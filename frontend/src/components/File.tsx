import {EllipsisVertical, Folder} from "lucide-react";

export function File({ item }: {item: string}) {
    // expects a vector of paths, could be a file or directory.

    const strSplit = item.split(".");

    // Simply don't render hidden file. Will add option to toggle and disable this.
    if (strSplit[0] == ".") {
        return
    }

    return (
        <div>
            <span className={"flex"}>
                <Folder />
                <button aria-label={"extra"}>
                    <EllipsisVertical />

                </button>
            </span>
            <h2>{item}</h2>
        </div>
    )
}