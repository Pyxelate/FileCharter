import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { BACKEND_URL } from "@/lib/getConfigs.ts";

export function UploadButton() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = e.target.files?.[0];
    if (chosen == null) return;

    setBusy(true);
    const form = new FormData();
    form.append("file", chosen);
    try {
      const response = await fetch(`${BACKEND_URL}/upload`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      if (response.ok) {
        await queryClient.invalidateQueries({ queryKey: ["files"] });
      }
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        onChange={handleFileChange}
        type="file"
        className="hidden"
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="flex shrink-0 items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Upload className="size-4" />
        )}
        <span className="hidden sm:inline">
          {busy ? "Uploading…" : "Upload"}
        </span>
      </button>
    </>
  );
}
