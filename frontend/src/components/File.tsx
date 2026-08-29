import {EllipsisVertical, Folder, FileText, FileArchive, DoorClosed} from "lucide-react";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import {useState} from "react";
import {PopoverBasic} from "./PopoverDefault";
import {
    Popover,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
} from "@/shadcn-components/ui/popover"

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
        <div className={"bg-black/95 z-100  absolute w-full h-full flex justify-center items-center"}>
            <button onClick={() => setSrc("")}><DoorClosed className={"bg-white"}/></button>
            <div className={"h-auto relative"}>
                <img className={"w-200 h-auto"} src={src} alt={"Test"}/>
            </div>
        </div>
    )
}


function PreviewFile({src, setSrc}) {
    return (
        <div className={"bg-black/95 z-100  absolute w-full h-full flex justify-center items-center"}>
            <button onClick={() => setSrc("")}><DoorClosed className={"bg-white"}/></button>
            <div className={"h-auto relative"}>
                <p className={"text-white"}>{src}</p>
            </div>
        </div>
    )
}
export function File({ item }: {item: string}) {
    // expects a vector of paths, could be a file or directory.
    const [contentPreview, setContentPreview] = useState("");
    const [fileContentPreview, setfileContentPreview] = useState("");

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
        const imageFormat = ["jpg", "png"];

        if (imageFormat.some(i =>fullPath.includes(i))) {
            let new_slice = "";
            if (fullPath[0] == "/") {
                 new_slice = fullPath.substring(1, fullPath.length);
            }
            let response = await fetch(`http://localhost:8080/preview/${new_slice}`);
            let blob = await response.blob();
            const imgUrl = URL.createObjectURL(blob);
            setfileContentPreview(imgUrl);
            return
        }

        if (directory.includes("txt") || directory.includes("md"))  {

            let item = await read_content(directory);
            setfileContentPreview(item);
            return
        }

        await navigate({to: fullPath});
    }

    async function read_content(item) {
        const {pathname} = routerState.location;
        const fullPath = pathname + "/" + item;
        let new_slice = "";
        if (fullPath[0] == "/") {
            new_slice = fullPath.substring(1, fullPath.length);
        }

        let response = await fetch(`http://localhost:8080/read/${new_slice}`);
        let data = await response.json();
        return data
    }

    async function download_file(item) {
        const {pathname} = routerState.location;
        const fullPath = pathname + "/" + item;
        let new_slice = "";
        if (fullPath[0] == "/") {
            new_slice = fullPath.substring(1, fullPath.length);
        }

        let file = await fetch(`http://localhost:8080/download/${new_slice}`)
        let blob = await file.blob();
        // Try catch.
        // In order to do things with a stream of bytes/data, it must be serlialized to blob.
        let url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${item}`);

        // Creates invisible link and auto downloads item.
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);

        // 5. Clean up the object URL
        window.URL.revokeObjectURL(url);
    }

    return (
        <>
            {contentPreview.length > 0 && <PreviewImg src={contentPreview} setSrc={setContentPreview}/>}
            {fileContentPreview.length > 0 && <PreviewFile src={fileContentPreview} setSrc={setfileContentPreview}/>}
            <div className={"relative"}>

                <span className={"flex"}>
                <button onClick={() => continueDirectory(item)} aria-label={"extra"} className={"cursor-pointer"}>
                   <IconType str={strSplit} />
                </button>

                <button aria-label={"extra"} className={"cursor-pointer"}>
                    <PopoverBasic>
                        <PopoverTitle>Download File</PopoverTitle>
                        <PopoverDescription>
                            <button className={"cursor-pointer"} onClick={() => download_file(item)}>Download</button>
                        </PopoverDescription>

                    </PopoverBasic>
                </button>
            </span>
                <h2 className={"mt-0 mb-10 text-xs"}>{item}</h2>
            </div>
        </>

    )
}
