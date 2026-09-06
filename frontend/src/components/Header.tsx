import { UploadButton } from "./UploadButton.tsx";
import { Search, List as ListIcon, LayoutGrid } from "lucide-react";

export function Header({
  query,
  setQuery,
  view,
  setView,
}: {
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  view: "grid" | "list";
  setView: React.Dispatch<React.SetStateAction<"grid" | "list">>;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-lg font-semibold tracking-tight">
            FileCharter
          </span>
        </div>

        <div className="relative ml-2 min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
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
              view === "grid"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            onClick={() => setView("list")}
            aria-label="List view"
            title="List view"
            className={`rounded-md p-1.5 transition cursor-pointer ${
              view === "list"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ListIcon className="size-4" />
          </button>
        </div>

        <UploadButton />
      </div>
    </header>
  );
}
