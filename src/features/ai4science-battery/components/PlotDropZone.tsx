import React, { useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
  onFile: (file: File) => void;
  accept?: string;
  className?: string;
  style?: React.CSSProperties;
};

export function PlotDropZone(props: Props) {
  const { children, onFile, accept, className, style } = props;
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function pickFile(file: File | undefined) {
    if (!file) return;
    onFile(file);
  }

  return (
    <div
      className={className}
      style={{
        position: "relative",
        ...style
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        pickFile(f);
      }}
    >
      {dragOver ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            background: "rgba(37, 99, 235, 0.12)",
            border: "2px dashed #2563eb",
            borderRadius: 8,
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 600,
            color: "#1d4ed8"
          }}
        >
          松开以上传文件
        </div>
      ) : null}
      {children}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => {
          pickFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function UploadCsvExcelButton(props: { onFile: (f: File) => void; accept?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const accept =
    props.accept ??
    ".csv,.txt,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  return (
    <label className="btn btnPrimary" style={{ whiteSpace: "nowrap", cursor: "pointer" }}>
      上传 CSV / Excel
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) props.onFile(f);
          e.target.value = "";
        }}
      />
    </label>
  );
}
