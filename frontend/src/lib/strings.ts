// Joins the current directory (splat, relative to the home dir) with a clicked
// item and returns a normalised path with no leading slash, e.g.
//   canonicalize("sub", "downloads") -> "downloads/sub"
//   canonicalize("downloads", "")    -> "downloads"
// The result is safe to use both as a backend path segment and, prefixed with
// "/", as an absolute router path.
export function canonicalize(path: string, baseDir: string): string {
    const joined = baseDir ? `${baseDir}/${path}` : path;
    return joined.replace(/\/+/g, "/").replace(/^\//, "");
}

export function removeInitSlash(path: string): string {
    if (path[0] == "/") {
        return path.substring(1)
    } else {
        return path
    }
}
