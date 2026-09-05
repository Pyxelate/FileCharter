import { ChevronRight, Home } from "lucide-react";

export function BreadCrumbs({
  splat,
  onNavigate,
}: {
  splat: string;
  onNavigate: (path: string) => void;
}) {
  const segments = splat ? splat.split("/").filter(Boolean) : [];

  return (
    <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
      <button
        onClick={() => onNavigate("")}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 transition hover:bg-accent hover:text-foreground cursor-pointer"
      >
        <Home className="size-4" />
        <span>Home</span>
      </button>
      {segments.map((segment, i) => {
        const path = segments.slice(0, i + 1).join("/");
        const isLast = i === segments.length - 1;
        return (
          <span key={path} className="flex items-center gap-1">
            <ChevronRight className="size-4 opacity-40" />
            <button
              onClick={() => onNavigate(path)}
              className={`rounded-md px-2 py-1 transition hover:bg-accent hover:text-foreground cursor-pointer ${
                isLast ? "font-medium text-foreground" : ""
              }`}
            >
              {segment}
            </button>
          </span>
        );
      })}
    </nav>
  );
}
