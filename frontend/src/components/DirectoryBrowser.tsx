import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import * as z from "zod";
import { Loader2, TriangleAlert } from "lucide-react";

import { File } from "./File.tsx";
import { canonicalize } from "@/lib/strings.ts";
import { PreviewFile } from "./PreviewFile.tsx";
import { PreviewImage } from "./PreviewImage.tsx";
import { BreadCrumbs } from "./BreadCrumbs.tsx";
import { Header } from "./Header.tsx";

const Files = z.object({
  directory: z.array(z.string()),
});

type FileData = z.infer<typeof Files>;
type ViewMode = "grid" | "list";

function StatusScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
      {children}
    </div>
  );
}

export function DirectoryBrowser({ splat }: { splat: string }) {
  const [contentPreview, setContentPreview] = useState("");
  const [fileContentPreview, setfileContentPreview] = useState("");
  const [view, setView] = useState<ViewMode>("grid");
  const [query, setQuery] = useState("");

  // `splat` is the current directory relative to the home dir ("" for root).
  async function getFiles(splat: string): Promise<FileData> {
    const url = splat
      ? `http://localhost:8080/${splat}`
      : "http://localhost:8080/";
    const response = await fetch(url, { credentials: "include" });

    if (response.status == 401) {
      navigate({ to: "/auth" });
    }

    const result = Files.safeParse(await response.json());
    if (result.success) {
      return result.data;
    } else {
      console.log(result.error.issues);
      return Promise.reject("err");
    }
  }

  const navigate = useNavigate();
  const { data, isPending, isError, error } = useQuery({
    // Keying on `splat` is what makes navigating into a sub-directory
    // actually refetch instead of serving the previous directory's cache.
    queryKey: ["files", splat],
    queryFn: () => getFiles(splat),
  });

  function goTo(path: string) {
    if (path === "") {
      navigate({ to: "/" });
    } else {
      navigate({ to: "/$", params: { _splat: path } });
    }
  }

  async function fileEvents(item: string) {
    const fullPath = canonicalize(item, splat);
    const imageFormat = ["jpg", "png"];

    if (imageFormat.some((i) => fullPath.includes(i))) {
      const response = await fetch(
        `http://localhost:8080/preview/image/${fullPath}`,
        { credentials: "include" },
      );
      const blob = await response.blob();
      const imgUrl = URL.createObjectURL(blob);
      setContentPreview(imgUrl);
      return;
    }

    if (item.includes("txt") || item.includes("md")) {
      const content = await read_content(item);
      setfileContentPreview(content);
      return;
    }

    // Absolute router path so the `/$` catch-all resolves it from any depth.
    await navigate({ to: "/$", params: { _splat: fullPath } });
  }

  async function read_content(file: string) {
    const new_slice = canonicalize(file, splat);
    const response = await fetch(
      `http://localhost:8080/preview/file/${new_slice}`,
      { credentials: "include" },
    );
    return await response.json();
  }

  async function download(downloadFile: string) {
    const new_slice = canonicalize(downloadFile, splat);

    const file = await fetch(`http://localhost:8080/download/${new_slice}`, {
      credentials: "include",
    });
    const blob = await file.blob();
    // In order to do things with a stream of bytes/data, it must be serialized to blob.
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${downloadFile}`);

    // Creates invisible link and auto downloads item.
    document.body.appendChild(link);
    link.click();
    if (link.parentNode != null) {
      link.parentNode.removeChild(link);
    } else {
      await Promise.reject("Something went wrong with downloads");
    }

    window.URL.revokeObjectURL(url);
  }

  const items = (data?.directory ?? []).filter((file) =>
    file.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {contentPreview.length > 0 && (
        <PreviewImage src={contentPreview} setSrc={setContentPreview} />
      )}
      {fileContentPreview.length > 0 && (
        <PreviewFile src={fileContentPreview} setSrc={setfileContentPreview} />
      )}
      <Header query={query} setQuery={setQuery} view={view} setView={setView} />

      <div className="mx-auto max-w-6xl px-4 pt-4">
        <BreadCrumbs splat={splat} onNavigate={goTo} />
      </div>

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-4">
        {isPending ? (
          <StatusScreen>
            <Loader2 className="size-6 animate-spin text-primary" />
            <span className="text-sm">Loading…</span>
          </StatusScreen>
        ) : isError ? (
          <StatusScreen>
            <TriangleAlert className="size-6 text-destructive" />
            <span className="text-sm">
              Something went wrong — {error.message}
            </span>
          </StatusScreen>
        ) : items.length === 0 ? (
          <StatusScreen>
            <span className="text-sm">
              {query ? "No files match your search." : "This folder is empty."}
            </span>
          </StatusScreen>
        ) : view === "grid" ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {items.map((file) => (
              <File
                key={file}
                item={file}
                download_file={download}
                file_event={fileEvents}
                view="grid"
              />
            ))}
          </ul>
        ) : (
          <ul className="flex flex-col divide-y divide-border/60 overflow-hidden rounded-xl border border-border bg-card">
            {items.map((file) => (
              <File
                key={file}
                item={file}
                download_file={download}
                file_event={fileEvents}
                view="list"
              />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
