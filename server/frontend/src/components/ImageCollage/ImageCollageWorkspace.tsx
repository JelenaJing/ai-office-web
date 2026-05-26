/**
 * 多图拼版：中间 Fabric 画布（拖入、缩放、旋转、导出、磁吸对齐）
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { Canvas, FabricImage, Point, util } from 'fabric';
import type { TPointerEvent, FabricObject } from 'fabric';
import { dataAPI } from '../../services/api';

export const COLLAGE_DRAG_MIME = 'application/x-paper-collage-url';

/** 吸附阈值（px）：画板左/中/右、上/中/下 + 与其他图边/中心对齐 */
const SNAP_PX = 10;
/** 等宽/等高吸附阈值（缩放时，与另一张图的包围盒宽或高接近则对齐） */
const SIZE_SNAP_PX = 8;

type WidthSizeHint = {
  yMid: number;
  x1: number;
  x2: number;
  label: string;
};
type HeightSizeHint = {
  xMid: number;
  y1: number;
  y2: number;
  label: string;
};
type SizeHintState = { width?: WidthSizeHint; height?: HeightSizeHint };

function fitImageToCanvas(img: FabricImage, canvasW: number, canvasH: number) {
  const w = (img.width || 1) * (img.scaleX || 1);
  const h = (img.height || 1) * (img.scaleY || 1);
  const maxW = canvasW * 0.85;
  const maxH = canvasH * 0.85;
  const s = Math.min(maxW / w, maxH / h, 1);
  if (s < 1) {
    img.scale(s);
  }
}

/** 画板边/中心 + 其他对象边/中心 统一吸附（平移轴对齐包围盒） */
function snapMovingObject(canvas: Canvas, obj: FabricObject) {
  obj.setCoords();
  const br = obj.getBoundingRect();
  const L = br.left;
  const top = br.top;
  const bw = br.width;
  const bh = br.height;
  const R = L + bw;
  const bottom = top + bh;
  const cx = L + bw / 2;
  const cy = top + bh / 2;
  const cw = canvas.getWidth();
  const ch = canvas.getHeight();

  const xTargets: number[] = [0, cw / 2, cw];
  const yTargets: number[] = [0, ch / 2, ch];

  for (const o of canvas.getObjects()) {
    if (o === obj) continue;
    o.setCoords();
    const b = o.getBoundingRect();
    const ol = b.left;
    const ot = b.top;
    const obw = b.width;
    const obh = b.height;
    xTargets.push(ol, ol + obw, ol + obw / 2);
    yTargets.push(ot, ot + obh, ot + obh / 2);
  }

  const xCands: { d: number; dist: number }[] = [];
  for (const T of xTargets) {
    xCands.push({ d: T - L, dist: Math.abs(T - L) });
    xCands.push({ d: T - R, dist: Math.abs(T - R) });
    xCands.push({ d: T - cx, dist: Math.abs(T - cx) });
  }
  const yCands: { d: number; dist: number }[] = [];
  for (const T of yTargets) {
    yCands.push({ d: T - top, dist: Math.abs(T - top) });
    yCands.push({ d: T - bottom, dist: Math.abs(T - bottom) });
    yCands.push({ d: T - cy, dist: Math.abs(T - cy) });
  }

  const bx = xCands.filter((c) => c.dist < SNAP_PX).sort((a, b) => a.dist - b.dist)[0];
  const by = yCands.filter((c) => c.dist < SNAP_PX).sort((a, b) => a.dist - b.dist)[0];

  const tx = bx?.d ?? 0;
  const ty = by?.d ?? 0;
  if (tx !== 0 || ty !== 0) {
    obj.left += tx;
    obj.top += ty;
    obj.setCoords();
  }
}

/**
 * 缩放时：若当前图与另一张图的包围盒宽度或高度足够接近，则吸附为相同尺寸，
 * 并返回用于绘制「PPT 式」提示线的数据。
 */
function snapSizeToPeers(canvas: Canvas, obj: FabricObject): SizeHintState | null {
  obj.setCoords();
  const br = obj.getBoundingRect();
  const w = br.width;
  const h = br.height;
  const sx = obj.scaleX || 1;
  const sy = obj.scaleY || 1;

  let bestWDelta = Infinity;
  let matchW: number | null = null;
  let obrW: ReturnType<FabricObject['getBoundingRect']> | null = null;

  let bestHDelta = Infinity;
  let matchH: number | null = null;
  let obrH: ReturnType<FabricObject['getBoundingRect']> | null = null;

  for (const o of canvas.getObjects()) {
    if (o === obj) continue;
    o.setCoords();
    const obr = o.getBoundingRect();
    const dW = Math.abs(w - obr.width);
    if (dW < bestWDelta) {
      bestWDelta = dW;
      matchW = obr.width;
      obrW = obr;
    }
    const dH = Math.abs(h - obr.height);
    if (dH < bestHDelta) {
      bestHDelta = dH;
      matchH = obr.height;
      obrH = obr;
    }
  }

  const canW = bestWDelta < SIZE_SNAP_PX && matchW !== null && obrW;
  const canH = bestHDelta < SIZE_SNAP_PX && matchH !== null && obrH;
  if (!canW && !canH) return null;

  const preferW = !canH || (canW && bestWDelta <= bestHDelta);

  if (preferW && canW) {
    const ratio = matchW! / w;
    obj.scaleX = sx * ratio;
    obj.setCoords();
    const br2 = obj.getBoundingRect();
    const obr = obrW!;
    const yMid = (br2.top + br2.height / 2 + obr.top + obr.height / 2) / 2;
    return {
      width: {
        yMid,
        x1: Math.min(br2.left, obr.left),
        x2: Math.max(br2.left + br2.width, obr.left + obr.width),
        label: `宽 ${Math.round(matchW!)} px`,
      },
    };
  }

  if (canH) {
    const ratio = matchH! / h;
    obj.scaleY = sy * ratio;
    obj.setCoords();
    const br2 = obj.getBoundingRect();
    const obr = obrH!;
    const xMid = (br2.left + br2.width / 2 + obr.left + obr.width / 2) / 2;
    return {
      height: {
        xMid,
        y1: Math.min(br2.top, obr.top),
        y2: Math.max(br2.top + br2.height, obr.top + obr.height),
        label: `高 ${Math.round(matchH!)} px`,
      },
    };
  }

  return null;
}

function drawSizeHintsOnTop(canvas: Canvas, hint: SizeHintState | null) {
  if (!hint || (!hint.width && !hint.height)) return;
  const ctx = canvas.contextTop;
  const vt = canvas.viewportTransform;
  if (!ctx || !vt) return;

  ctx.save();
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = 'rgba(142, 68, 173, 0.95)';
  ctx.fillStyle = 'rgba(142, 68, 173, 0.95)';
  ctx.lineWidth = 1;
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.textBaseline = 'bottom';

  if (hint.width) {
    const { yMid, x1, x2, label } = hint.width;
    const p1 = util.transformPoint(new Point(x1, yMid), vt);
    const p2 = util.transformPoint(new Point(x2, yMid), vt);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    const pm = util.transformPoint(new Point((x1 + x2) / 2, yMid), vt);
    ctx.textAlign = 'center';
    ctx.fillText(label, pm.x, pm.y - 4);
  }
  if (hint.height) {
    const { xMid, y1, y2, label } = hint.height;
    const p1 = util.transformPoint(new Point(xMid, y1), vt);
    const p2 = util.transformPoint(new Point(xMid, y2), vt);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    const pm = util.transformPoint(new Point(xMid, (y1 + y2) / 2), vt);
    ctx.textAlign = 'left';
    ctx.fillText(label, pm.x + 6, pm.y + 4);
  }

  ctx.restore();
}

interface ImageCollageWorkspaceProps {
  onClose: () => void;
  projectId: string | null;
}

export default function ImageCollageWorkspace({ onClose, projectId }: ImageCollageWorkspaceProps) {
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const extraBlobUrlsRef = useRef<string[]>([]);
  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    const c = fabricRef.current;
    if (!c || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    c.discardActiveObject();
    try {
      const blob = await c.toBlob({
        format: 'png',
        multiplier: 2,
        enableRetinaScaling: true,
      });
      if (!blob) {
        alert('导出图片失败');
        return;
      }
      const localUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = localUrl;
      a.download = `collage-${Date.now()}.png`;
      a.rel = 'noopener';
      a.click();
      URL.revokeObjectURL(localUrl);

      if (projectId) {
        try {
          await dataAPI.saveCollage(projectId, blob);
        } catch (err: unknown) {
          const ax = err as { response?: { data?: { detail?: string } }; message?: string };
          const msg =
            ax?.response?.data?.detail || (err instanceof Error ? err.message : '') || '未知错误';
          alert(`已下载到本机，但写入项目目录失败：${msg}`);
        }
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [projectId]);

  const handleDeleteSelection = useCallback(() => {
    const c = fabricRef.current;
    if (!c) return;
    const objs = c.getActiveObjects();
    if (!objs.length) return;
    objs.forEach((o) => c.remove(o));
    c.discardActiveObject();
    c.requestRenderAll();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) {
        return;
      }
      const c = fabricRef.current;
      if (!c || c.getActiveObjects().length === 0) return;
      e.preventDefault();
      handleDeleteSelection();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleDeleteSelection]);

  useEffect(() => {
    const canvasEl = canvasElRef.current;
    const wrap = canvasWrapRef.current;
    if (!canvasEl || !wrap) return undefined;

    const w = Math.max(320, wrap.clientWidth);
    const h = Math.max(240, wrap.clientHeight);
    const canvas = new Canvas(canvasEl, {
      width: w,
      height: h,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
    });
    fabricRef.current = canvas;

    let sizeHint: SizeHintState | null = null;

    const onSnapMove = (e: { target?: FabricObject }) => {
      const t = e.target;
      if (!t) return;
      sizeHint = null;
      snapMovingObject(canvas, t);
    };
    canvas.on('object:moving', onSnapMove);

    const onScaleOrResize = (e: { target?: FabricObject }) => {
      const t = e.target;
      if (!t) return;
      sizeHint = snapSizeToPeers(canvas, t);
      canvas.requestRenderAll();
    };
    canvas.on('object:scaling', onScaleOrResize);
    canvas.on('object:resizing', onScaleOrResize);

    const clearSizeHint = () => {
      if (sizeHint) {
        sizeHint = null;
        canvas.requestRenderAll();
      }
    };
    canvas.on('mouse:up', clearSizeHint);

    const onBeforeRender = () => {
      // toBlob / 部分内部渲染没有交互层 upper canvas，contextTop 可能为 undefined
      const ctxTop = canvas.contextTop;
      if (ctxTop) {
        canvas.clearContext(ctxTop);
      }
    };
    canvas.on('before:render', onBeforeRender);

    const onAfterRender = () => {
      drawSizeHintsOnTop(canvas, sizeHint);
    };
    canvas.on('after:render', onAfterRender);

    const syncSize = () => {
      const c = fabricRef.current;
      if (!c || !canvasWrapRef.current) return;
      const cw = Math.max(320, canvasWrapRef.current.clientWidth);
      const ch = Math.max(240, canvasWrapRef.current.clientHeight);
      c.setDimensions({ width: cw, height: ch });
      c.requestRenderAll();
    };

    const ro = new ResizeObserver(() => syncSize());
    ro.observe(wrap);
    syncSize();

    const addImageAt = async (url: string, sceneX: number, sceneY: number) => {
      const c = fabricRef.current;
      if (!c) return;
      try {
        const img = await FabricImage.fromURL(url);
        fitImageToCanvas(img, c.getWidth(), c.getHeight());
        img.set({
          left: sceneX,
          top: sceneY,
          originX: 'center',
          originY: 'center',
        });
        c.add(img);
        c.setActiveObject(img);
        c.requestRenderAll();
      } catch (e) {
        console.error('Failed to load image onto canvas', e);
      }
    };

    const onDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const c = fabricRef.current;
      if (!c) return;

      const pointer = c.getScenePoint(e as unknown as TPointerEvent);
      const dt = e.dataTransfer;
      if (!dt) return;

      const fromStrip =
        dt.getData(COLLAGE_DRAG_MIME) || dt.getData('text/plain') || dt.getData('text/uri-list');
      if (fromStrip && (fromStrip.startsWith('blob:') || fromStrip.startsWith('data:'))) {
        await addImageAt(fromStrip.trim(), pointer.x, pointer.y);
        return;
      }

      const { files } = dt;
      if (files?.length) {
        for (const file of Array.from(files)) {
          if (!file.type.startsWith('image/')) continue;
          const u = URL.createObjectURL(file);
          extraBlobUrlsRef.current.push(u);
          await addImageAt(u, pointer.x, pointer.y);
        }
      }
    };

    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    };

    const onDragEnter = (e: DragEvent) => {
      e.preventDefault();
    };

    const captureOpts = true;
    wrap.addEventListener('dragenter', onDragEnter, captureOpts);
    wrap.addEventListener('dragover', onDragOver, captureOpts);
    wrap.addEventListener('drop', onDrop, captureOpts);

    return () => {
      wrap.removeEventListener('dragenter', onDragEnter, captureOpts);
      wrap.removeEventListener('dragover', onDragOver, captureOpts);
      wrap.removeEventListener('drop', onDrop, captureOpts);
      canvas.off('object:moving', onSnapMove);
      canvas.off('object:scaling', onScaleOrResize);
      canvas.off('object:resizing', onScaleOrResize);
      canvas.off('mouse:up', clearSizeHint);
      canvas.off('before:render', onBeforeRender);
      canvas.off('after:render', onAfterRender);
      ro.disconnect();
      const inst = fabricRef.current;
      fabricRef.current = null;
      extraBlobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      extraBlobUrlsRef.current = [];
      if (inst) {
        void inst.dispose();
      }
    };
  }, []);

  return (
    <div className="image-collage-workspace">
      <div className="image-collage-workspace-toolbar">
        <span className="image-collage-workspace-title" id="image-collage-title">
          多图组合
        </span>
        <div className="image-collage-workspace-actions">
          <button type="button" className="image-collage-btn-danger" onClick={handleDeleteSelection}>
            删除选中
          </button>
          <button
            type="button"
            className="image-collage-btn-primary"
            onClick={() => void handleSave()}
            disabled={saving}
          >
            {saving ? '保存中…' : '保存拼合图'}
          </button>
          <button type="button" className="image-collage-btn-ghost" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
      <div className="image-collage-canvas-wrap" ref={canvasWrapRef}>
        <canvas ref={canvasElRef} />
      </div>
      <p className="image-collage-workspace-hint">
        从下方展示柜拖入图片或拖到白板；拖动时靠近画板左/中/右与上/中/下，或其他图的边与中心，会自动吸附。缩放角点/边时若与另一张图宽或高接近，会吸附为相同尺寸并显示紫色虚线与像素提示。
        {projectId
          ? ' 保存时会下载到本机并写入项目 data/plots（collage_时间戳.png）。'
          : ' 保存时仅下载到本机（无项目时无法写入目录）。'}
      </p>
    </div>
  );
}
