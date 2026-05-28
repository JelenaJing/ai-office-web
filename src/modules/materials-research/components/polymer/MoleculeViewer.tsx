import { useEffect, useRef, useState } from "react";

interface MoleculeViewerProps {
  smiles?: string;
  /** PubChem 化合物名，优先用于获取 3D SDF */
  compoundName?: string;
  label?: string;
  height?: number;
}

type Mol3D = {
  createViewer: (el: HTMLElement, opts: { backgroundColor: string }) => {
    addModel: (data: string, format: string) => unknown;
    setStyle: (sel: object, style: object) => void;
    zoomTo: () => void;
    render: () => void;
    resize: () => void;
  };
};

async function load3Dmol(): Promise<Mol3D> {
  const w = window as Window & { $3Dmol?: Mol3D };
  if (w.$3Dmol) return w.$3Dmol;
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[data-3dmol="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const s = document.createElement("script");
    s.src = "https://3Dmol.csb.pitt.edu/build/3Dmol-min.js";
    s.async = true;
    s.dataset["3dmol"] = "1";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("3Dmol load failed"));
    document.head.appendChild(s);
  });
  const lib = (window as Window & { $3Dmol?: Mol3D }).$3Dmol;
  if (!lib) throw new Error("3Dmol unavailable");
  return lib;
}

async function fetchSdfFromPubChem(smiles?: string, name?: string): Promise<string | null> {
  const tryUrl = async (path: string) => {
    const res = await fetch(path);
    if (!res.ok) return null;
    const text = await res.text();
    return text.includes("V2000") || text.includes("V3000") ? text : null;
  };
  if (name) {
    const enc = encodeURIComponent(name);
    const sdf = await tryUrl(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${enc}/SDF?record_type=3d`
    );
    if (sdf) return sdf;
    const sdf2d = await tryUrl(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${enc}/SDF`);
    if (sdf2d) return sdf2d;
  }
  if (smiles) {
    const enc = encodeURIComponent(smiles);
    const sdf = await tryUrl(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${enc}/SDF?record_type=3d`
    );
    if (sdf) return sdf;
    return tryUrl(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${enc}/SDF`);
  }
  return null;
}

/** 3Dmol + PubChem SDF 展示分子三维结构 */
export function MoleculeViewer({ smiles, compoundName, label, height = 260 }: MoleculeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [hint, setHint] = useState("");

  useEffect(() => {
    const el = containerRef.current;
    if (!el || (!smiles && !compoundName)) {
      setStatus("error");
      setHint("无结构数据");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setHint("正在加载三维结构…");

    const run = async () => {
      const $3Dmol = await load3Dmol();
      if (cancelled || !containerRef.current) return;

      const sdf = await fetchSdfFromPubChem(smiles, compoundName);
      if (cancelled || !containerRef.current) return;

      el.innerHTML = "";
      el.style.width = "100%";
      el.style.height = `${height}px`;
      el.style.position = "relative";

      const viewer = $3Dmol.createViewer(el, { backgroundColor: "white" });

      try {
        if (sdf) {
          viewer.addModel(sdf, "sdf");
        } else if (smiles) {
          const parts = smiles.split(".").map((s) => s.trim()).filter(Boolean);
          if (parts.length > 1) {
            for (const part of parts.slice(0, 2)) {
              viewer.addModel(part, "smi");
            }
          } else {
            viewer.addModel(smiles, "smi");
          }
        } else {
          throw new Error("no structure");
        }
        viewer.setStyle({}, { stick: { radius: 0.14 }, sphere: { scale: 0.25 } });
        viewer.zoomTo();
        viewer.render();
        requestAnimationFrame(() => viewer.resize());
        if (!cancelled) {
          setStatus("ok");
          setHint("");
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
          setHint("结构解析失败，请检查网络或更换单体");
        }
      }
    };

    run().catch(() => {
      if (!cancelled) {
        setStatus("error");
        setHint("三维引擎加载失败");
      }
    });

    return () => {
      cancelled = true;
      if (el) el.innerHTML = "";
    };
  }, [smiles, compoundName, height]);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {label && <p className="border-b border-slate-100 px-3 py-2 text-xs font-medium text-slate-600">{label}</p>}
      <div className="relative bg-slate-50" style={{ minHeight: height }}>
        <div ref={containerRef} className="w-full" style={{ height }} />
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted">{hint}</div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-xs text-muted">
            {hint || "无法显示结构"}
          </div>
        )}
      </div>
    </div>
  );
}
