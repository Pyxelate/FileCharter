import {
  Folder,
  FileText,
  FileArchive,
  FileImage,
  FileCode,
  FileSpreadsheet,
  File as FileIcon,
  Download,
  type LucideIcon,
} from "lucide-react";

type IconMeta = { Icon: LucideIcon; color: string };

// Best-effort mapping from a filename to an icon + accent colour. The backend
// only returns names, so a name with no "." is treated as a directory.
function iconFor(item: string, isFolder: boolean): IconMeta {
  if (isFolder) return { Icon: Folder, color: "text-sky-400" };

  const ext = item.split(".").pop()?.toLowerCase() ?? "";

  if (
    ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico", "heic"].includes(
      ext,
    )
  )
    return { Icon: FileImage, color: "text-violet-400" };
  if (["zip", "tar", "gz", "rar", "7z", "bz2", "xz", "pkpass"].includes(ext))
    return { Icon: FileArchive, color: "text-amber-400" };
  if (["csv", "xlsx", "xls", "tsv"].includes(ext))
    return { Icon: FileSpreadsheet, color: "text-emerald-400" };
  if (
    [
      "js",
      "ts",
      "tsx",
      "jsx",
      "py",
      "rs",
      "go",
      "java",
      "c",
      "cpp",
      "rb",
      "php",
      "sh",
      "json",
      "html",
      "css",
      "ipynb",
      "drawio",
    ].includes(ext)
  )
    return { Icon: FileCode, color: "text-teal-400" };
  if (["txt", "md", "rtf", "log", "pdf", "doc", "docx", "ics"].includes(ext))
    return { Icon: FileText, color: "text-slate-300" };

  return { Icon: FileIcon, color: "text-slate-400" };
}

type DownloadFile = (file: string) => void;
type FileEvent = (file: string) => void;

export function File({
  item,
  file_event,
  download_file,
  view = "grid",
}: {
  item: string;
  file_event: FileEvent | undefined;
  download_file: DownloadFile | undefined;
  view?: "grid" | "list";
}) {
  if (typeof file_event == "undefined" || typeof download_file == "undefined") {
    console.log("Functions passed are invalid.");
    return null;
  }

  const strSplit = item.split(".");
  // Don't render hidden dotfiles (name starts with "."). Will add a toggle later.
  if (strSplit[0] == "") {
    return null;
  }

  const isFolder = strSplit.length == 1;
  const { Icon, color } = iconFor(item, isFolder);

  function onDownload(e: React.MouseEvent) {
    e.stopPropagation();
    download_file!(item);
  }

  if (view == "list") {
    return (
      <li className="group">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-accent">
          <button
            onClick={() => file_event!(item)}
            className="flex min-w-0 flex-1 items-center gap-3 text-left cursor-pointer"
          >
            <Icon className={`size-5 shrink-0 ${color}`} />
            <span
              aria-label="file-name"
              className="truncate text-sm text-foreground/90"
            >
              {item}
            </span>
          </button>
          <button
            onClick={onDownload}
            aria-label={`Download ${item}`}
            title="Download"
            className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-secondary hover:text-foreground group-hover:opacity-100 cursor-pointer"
          >
            <Download className="size-4" />
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="group relative">
      <button
        onClick={() => file_event!(item)}
        className="flex w-full flex-col items-center gap-3 rounded-xl border border-border/60 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:bg-accent hover:shadow-lg hover:shadow-black/20 cursor-pointer"
      >
        <Icon className={`size-10 ${color}`} />
        <span
          className="w-full truncate text-center text-xs text-foreground/90"
          title={item}
        >
          {item}
        </span>
      </button>
      <button
        onClick={onDownload}
        aria-label={`Download ${item}`}
        title="Download"
        className="absolute right-2 top-2 rounded-md bg-secondary/80 p-1.5 text-muted-foreground opacity-0 backdrop-blur transition hover:text-foreground group-hover:opacity-100 cursor-pointer"
      >
        <Download className="size-4" />
      </button>
    </li>
  );
}
