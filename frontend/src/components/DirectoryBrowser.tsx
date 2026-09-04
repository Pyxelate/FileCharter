import {useNavigate} from "@tanstack/react-router";
import {useQuery} from "@tanstack/react-query";
import {useState} from "react";
import * as z from "zod";
import {DoorClosed} from "lucide-react";

import {File} from "./File.tsx";
import {canonicalize} from "@/lib/strings.ts";

const Files = z.object({
    directory: z.array(z.string()),
})

type FileData = z.infer<typeof Files>;

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

function FileUpload() {
    const [file, setFile] = useState<File | null>();

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files != null) {
            setFile(e.target.files[0])
        } else {
            console.log("Try again...")
        }
    }

    async function handleUpload() {
        const form = new FormData();
        if (file != null) {
            form.append("file", file)
            const response = await fetch("http://localhost:8080/upload", {
                method: "POST",
                body: form,
            })

            if (response.ok) {
                console.log("Upload sent.")
            }
        }
    }

    return (
        <div>
            <input onChange={handleFileChange} type="file"/>
            <button onClick={handleUpload}>Submit</button>
        </div>
    )
}

function PreviewImg({src, setSrc}: {src: string, setSrc: React.Dispatch<React.SetStateAction<string>>}) {
    return (
        <div className={"bg-black/95 z-100  absolute w-full h-full flex justify-center items-center"}>
            <button onClick={() => setSrc("")}><DoorClosed className={"bg-white"}/></button>
            <div className={"h-auto relative"}>
                <img className={"w-200 h-auto"} src={src} alt={"Test"}/>
            </div>
        </div>
    )
}

function PreviewFile({src, setSrc}: {src: string, setSrc: React.Dispatch<React.SetStateAction<string>>}) {
    return (
        <div className={"bg-black/95 z-100  absolute w-full h-full flex justify-center items-center"}>
            <button onClick={() => setSrc("")}><DoorClosed className={"bg-white"}/></button>
            <div className={"h-auto relative"}>
                <p className={"text-white"}>{src}</p>
            </div>
        </div>
    )
}

export function DirectoryBrowser({splat}: {splat: string}) {
    const [contentPreview, setContentPreview] = useState("");
    const [fileContentPreview, setfileContentPreview] = useState("");

    const navigate = useNavigate();
    const {data, isPending, isError, error} = useQuery({
        // Keying on `splat` is what makes navigating into a sub-directory
        // actually refetch instead of serving the previous directory's cache.
        queryKey: ["files", splat],
        queryFn: () => getFiles(splat),
    });

    if (isPending) return <div>Loading...</div>;
    if (isError) return <div>Something went wrong {error.message}</div>

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

    return (
        <>
            {contentPreview.length > 0 && <PreviewImg src={contentPreview} setSrc={setContentPreview}/>}
            {fileContentPreview.length > 0 && <PreviewFile src={fileContentPreview} setSrc={setfileContentPreview}/>}
            <main>
                <FileUpload/>
                <div>
                    <ul className={"grid grid-cols-5 gap-1"}>
                        {/* Add option to hide or unhide files with . hidden extension.*/}
                        {data.directory.map((file) => {
                            return <File key={file} item={file} download_file={download} file_event={fileEvents}/>
                        })}
                    </ul>
                </div>
            </main>
        </>
    )
}
