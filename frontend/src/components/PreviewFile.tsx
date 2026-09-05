import { X } from "lucide-react";

export function PreviewFile({
  src,
  setSrc,
}: {
  src: string;
  setSrc: React.Dispatch<React.SetStateAction<string>>;
}) {
  return (
    <div
      onClick={() => setSrc("")}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-medium text-muted-foreground">
            Preview
          </span>
          <button
            onClick={() => setSrc("")}
            aria-label="Close preview"
            className="rounded-md p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>
        <pre className="overflow-auto whitespace-pre-wrap p-4 font-mono text-sm leading-relaxed text-foreground/90">
          {src}
        </pre>
      </div>
    </div>
  );
}
