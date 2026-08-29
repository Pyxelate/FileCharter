import {Folder, FileText, FileArchive} from "lucide-react";

import {PopoverBasic} from "./PopoverDefault";
import {
    // Popover,
    // PopoverContent,
    PopoverDescription,
    // PopoverHeader,
    PopoverTitle,
    // PopoverTrigger,
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

type DownloadFile = (file: string) => void;
type FileEvent = (file: string) => void;

export function File({ item, file_event, download_file }: {item: string, file_event: FileEvent | undefined, download_file: DownloadFile |undefined}) {
    // expects a vector of paths, could be a file or directory.

    if (typeof file_event == "undefined" || typeof download_file == "undefined") {
        console.log("Functions passed are invalid.")
        return null
    }

    const strSplit = item.split(".");
    if (strSplit[0] == "") {
        return null
    }
    // Simply don't render hidden file. Will add option to toggle and disable this.


    return (
        <>

            <div className={"relative"}>

                <span className={"flex"}>
                <button onClick={() => file_event(item)} aria-label={"extra"} className={"cursor-pointer"}>
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

// for now all void.
