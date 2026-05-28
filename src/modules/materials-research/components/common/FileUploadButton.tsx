import clsx from "clsx";
import { Upload } from "lucide-react";

interface FileUploadButtonProps {
  label: string;
  accept?: string;
  onFile: (file: File) => void | Promise<void>;
  variant?: "primary" | "outline" | "ghost";
  className?: string;
  disabled?: boolean;
}

export function FileUploadButton({
  label,
  accept = ".pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.xls,.json,.zip",
  onFile,
  variant = "primary",
  className,
  disabled,
}: FileUploadButtonProps) {
  const styles = {
    primary: "bg-primary text-white hover:bg-primary/90",
    outline: "border border-primary text-primary hover:bg-primary/5",
    ghost: "bg-white/20 text-white hover:bg-white/30",
  };

  return (
    <label
      className={clsx(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
        styles[variant],
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      <Upload className="h-3.5 w-3.5" />
      {label}
      <input
        type="file"
        className="hidden"
        accept={accept}
        disabled={disabled}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) await onFile(file);
          e.target.value = "";
        }}
      />
    </label>
  );
}
