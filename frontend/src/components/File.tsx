import {EllipsisVertical, Folder} from "lucide-react";
import { useRouterState, useNavigate } from "@tanstack/react-router";

export function File({ item }: {item: string}) {
    // expects a vector of paths, could be a file or directory.
    const routerState = useRouterState();
    const navigate = useNavigate();

    const strSplit = item.split(".");

    // Simply don't render hidden file. Will add option to toggle and disable this.
    if (strSplit[0] == "") {
        return
    }


    async function continueDirectory(directory: String) {
        const {pathname} = routerState.location;
        const fullPath = pathname + "/" + directory;
        await navigate({to: fullPath});
    }

    return (
        <div>
            <span className={"flex"}>
                <button onClick={() => continueDirectory(item)} aria-label={"extra"} className={"cursor-pointer"}>
                    <Folder />
                </button>

                <button aria-label={"extra"} className={"cursor-pointer"}>
                    <EllipsisVertical />
                </button>
            </span>
            <h2 className={"mt-0 mb-10 text-xs"}>{item}</h2>
        </div>
    )
}