import {EllipsisVertical, Folder, FileText, FileArchive} from "lucide-react";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import {useState} from "react";


function IconType({str}: {str: string[]}) {

    if (str.length == 1) {
        return <Folder/>
    }

    if (str.includes("zip")) {
        return <FileArchive />
    } else {
        return <FileText/>
    }
}

function PreviewImg({src, setSrc}) {
    return (
        <>
            <img src={src} alt={"Test"}/>
        </>
    )
}

export function File({ item }: {item: string}) {
    // expects a vector of paths, could be a file or directory.
    const [contentPreview, setContentPreview] = useState("");
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

        if (fullPath.includes(".png")) {
            let new_slice = "";
            if (fullPath[0] == "/") {
                 new_slice = fullPath.substring(1, fullPath.length);
            }
            let response = await fetch(`http://localhost:8080/preview/${new_slice}`);
            let blob = await response.blob();
            const imgUrl = URL.createObjectURL(blob);
            setContentPreview(imgUrl);
            return
        }

        await navigate({to: fullPath});
    }

    return (
        <div>
            {contentPreview.length > 0 && <PreviewImg src={contentPreview} setSrc={setContentPreview}/>}
            <span className={"flex"}>
                <button onClick={() => continueDirectory(item)} aria-label={"extra"} className={"cursor-pointer"}>
                   <IconType str={strSplit} />
                </button>

                <button aria-label={"extra"} className={"cursor-pointer"}>
                    <EllipsisVertical />
                </button>
            </span>
            <h2 className={"mt-0 mb-10 text-xs"}>{item}</h2>
        </div>
    )
}
