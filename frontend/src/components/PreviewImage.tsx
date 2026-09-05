import { X } from "lucide-react";

export function PreviewImage({
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
      <div className="relative max-h-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setSrc("")}
          aria-label="Close preview"
          className="absolute -right-3 -top-3 rounded-full border border-border bg-card p-2 text-foreground shadow-lg transition hover:bg-accent cursor-pointer"
        >
          <X className="size-4" />
        </button>
        <img
          src={src}
          alt="preview"
          className="max-h-[85vh] w-auto rounded-xl shadow-2xl"
        />
      </div>
    </div>
  );
}
