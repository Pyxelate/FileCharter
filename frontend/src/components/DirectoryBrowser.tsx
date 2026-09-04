import {useNavigate} from "@tanstack/react-router";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {useRef, useState} from "react";
import * as z from "zod";
import {
    ChevronRight,
    HardDrive,
    Home,
    LayoutGrid,
    List as ListIcon,
    Loader2,
    Search,
    TriangleAlert,
    Upload,
    X,
} from "lucide-react";

import {File} from "./File.tsx";
import {canonicalize} from "@/lib/strings.ts";

const Files = z.object({
    directory: z.array(z.string()),
})

type FileData = z.infer<typeof Files>;
type ViewMode = "grid" | "list";

// `splat` is the current directory relative to the home dir ("" for root).
async function getFiles(splat: string): Promise<FileData> {
    const url = splat ? `http://localhost:8080/${splat}` : "http://localhost:8080/";
    const response = await fetch(url);

    const result = Files.safeParse(await response.json());
    if (result.success) {
        return result.data
    } else {
        console.log(result.error.issues);
        return Promise.reject("e");
    }
}

function UploadButton() {
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
            const response = await fetch("http://localhost:8080/upload", {
                method: "POST",
                body: form,
            })
            if (response.ok) {
                await queryClient.invalidateQueries({queryKey: ["files"]});
            }
        } finally {
            setBusy(false);
            e.target.value = "";
        }
    }

    return (
        <>
            <input ref={inputRef} onChange={handleFileChange} type="file" className="hidden"/>
            <button
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className="flex shrink-0 items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
            >
                {busy ? <Loader2 className="size-4 animate-spin"/> : <Upload className="size-4"/>}
                <span className="hidden sm:inline">{busy ? "Uploading…" : "Upload"}</span>
            </button>
        </>
    )
}

function Breadcrumbs({splat, onNavigate}: {splat: string, onNavigate: (path: string) => void}) {
    const segments = splat ? splat.split("/").filter(Boolean) : [];

    return (
        <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
            <button
                onClick={() => onNavigate("")}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 transition hover:bg-accent hover:text-foreground cursor-pointer"
            >
                <Home className="size-4"/>
                <span>Home</span>
            </button>
            {segments.map((segment, i) => {
                const path = segments.slice(0, i + 1).join("/");
                const isLast = i === segments.length - 1;
                return (
                    <span key={path} className="flex items-center gap-1">
                        <ChevronRight className="size-4 opacity-40"/>
                        <button
                            onClick={() => onNavigate(path)}
                            className={`rounded-md px-2 py-1 transition hover:bg-accent hover:text-foreground cursor-pointer ${
                                isLast ? "font-medium text-foreground" : ""
                            }`}
                        >
                            {segment}
                        </button>
                    </span>
                )
            })}
        </nav>
    )
}

function PreviewImg({src, setSrc}: {src: string, setSrc: React.Dispatch<React.SetStateAction<string>>}) {
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
                    <X className="size-4"/>
                </button>
                <img src={src} alt="preview" className="max-h-[85vh] w-auto rounded-xl shadow-2xl"/>
            </div>
        </div>
    )
}

function PreviewFile({src, setSrc}: {src: string, setSrc: React.Dispatch<React.SetStateAction<string>>}) {
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
                    <span className="text-sm font-medium text-muted-foreground">Preview</span>
                    <button
                        onClick={() => setSrc("")}
                        aria-label="Close preview"
                        className="rounded-md p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground cursor-pointer"
                    >
                        <X className="size-4"/>
                    </button>
                </div>
                <pre className="overflow-auto whitespace-pre-wrap p-4 font-mono text-sm leading-relaxed text-foreground/90">
                    {src}
                </pre>
            </div>
        </div>
    )
}

function StatusScreen({children}: {children: React.ReactNode}) {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
            {children}
        </div>
    )
}

export function DirectoryBrowser({splat}: {splat: string}) {
    const [contentPreview, setContentPreview] = useState("");
    const [fileContentPreview, setfileContentPreview] = useState("");
    const [view, setView] = useState<ViewMode>("grid");
    const [query, setQuery] = useState("");

    const navigate = useNavigate();
    const {data, isPending, isError, error} = useQuery({
        // Keying on `splat` is what makes navigating into a sub-directory
        // actually refetch instead of serving the previous directory's cache.
        queryKey: ["files", splat],
        queryFn: () => getFiles(splat),
    });

    function goTo(path: string) {
        if (path === "") {
            navigate({to: "/"});
        } else {
            navigate({to: "/$", params: {_splat: path}});
        }
    }

    async function fileEvents(item: string) {
        const fullPath = canonicalize(item, splat)
        const imageFormat = ["jpg", "png"];

        if (imageFormat.some(i => fullPath.includes(i))) {
            const response = await fetch(`http://localhost:8080/preview/image/${fullPath}`);
            const blob = await response.blob();
            const imgUrl = URL.createObjectURL(blob);
            setContentPreview(imgUrl);
            return
        }

        if (item.includes("txt") || item.includes("md")) {
            const content = await read_content(item);
            setfileContentPreview(content);
            return
        }

        // Absolute router path so the `/$` catch-all resolves it from any depth.
        await navigate({to: "/$", params: {_splat: fullPath}});
    }

    async function read_content(file: string) {
        const new_slice = canonicalize(file, splat)
        const response = await fetch(`http://localhost:8080/preview/file/${new_slice}`);
        return await response.json()
    }

    async function download(downloadFile: string) {
        const new_slice = canonicalize(downloadFile, splat)

        const file = await fetch(`http://localhost:8080/download/${new_slice}`)
        const blob = await file.blob();
        // In order to do things with a stream of bytes/data, it must be serialized to blob.
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${downloadFile}`);

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

  const items = (data?.directory ?? [])

        .filter((file) => file.toLowerCase().includes(query.trim().toLowerCase()));

    return (
        <div className="min-h-screen bg-background text-foreground">
            {contentPreview.length > 0 && <PreviewImg src={contentPreview} setSrc={setContentPreview}/>}
            {fileContentPreview.length > 0 && <PreviewFile src={fileContentPreview} setSrc={setfileContentPreview}/>}

            <header className="sticky top-0 z-20 border-b border-border bg-card/70 backdrop-blur-md">
                <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
                    <div className="flex shrink-0 items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                            <HardDrive className="size-5"/>
                        </div>
                        <span className="text-lg font-semibold tracking-tight">FileCharter</span>
                    </div>

                    <div className="relative ml-2 min-w-0 flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/>
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search this folder…"
                            className="w-full rounded-lg border border-border bg-background/60 py-2 pl-9 pr-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30"
                        />
                    </div>

                    <div className="hidden items-center gap-0.5 rounded-lg border border-border p-0.5 sm:flex">
                        <button
                            onClick={() => setView("grid")}
                            aria-label="Grid view"
                            title="Grid view"
                            className={`rounded-md p-1.5 transition cursor-pointer ${
                                view === "grid" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <LayoutGrid className="size-4"/>
                        </button>
                        <button
                            onClick={() => setView("list")}
                            aria-label="List view"
                            title="List view"
                            className={`rounded-md p-1.5 transition cursor-pointer ${
                                view === "list" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <ListIcon className="size-4"/>
                        </button>
                    </div>

                    <UploadButton/>
                </div>
            </header>

            <div className="mx-auto max-w-6xl px-4 pt-4">
                <Breadcrumbs splat={splat} onNavigate={goTo}/>
            </div>

            <main className="mx-auto max-w-6xl px-4 pb-24 pt-4">
                {isPending ? (
                    <StatusScreen>
                        <Loader2 className="size-6 animate-spin text-primary"/>
                        <span className="text-sm">Loading…</span>
                    </StatusScreen>
                ) : isError ? (
                    <StatusScreen>
                        <TriangleAlert className="size-6 text-destructive"/>
                        <span className="text-sm">Something went wrong — {error.message}</span>
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
                            <File key={file} item={file} download_file={download} file_event={fileEvents} view="grid"/>
                        ))}
                    </ul>
                ) : (
                    <ul className="flex flex-col divide-y divide-border/60 overflow-hidden rounded-xl border border-border bg-card">
                        {items.map((file) => (
                            <File key={file} item={file} download_file={download} file_event={fileEvents} view="list"/>
                        ))}
                    </ul>
                )}
            </main>
        </div>
    )
}
