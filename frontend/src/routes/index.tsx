import { createFileRoute } from "@tanstack/react-router";
import * as z from "zod";
import {useQuery} from "@tanstack/react-query";
import {File} from "../components/File.tsx";
import {useState} from "react";

const Files = z.object({
        directory: z.array(z.string()),
})

type FileData = z.infer<typeof Files>;

export const Route = createFileRoute("/")({

    component: Index,
})

async function getFiles(): Promise<FileData> {
    const response = await fetch("http://localhost:8080/");

    const result = Files.safeParse(await response.json());
    if (result.success) {
        return result.data
    } else {
        console.log(result.error.issues);
        return Promise.reject("e");
    }
}


export function Index() {
    const [file, setFile] = useState<File | null>(null);
    const {data, isPending, isError, error} = useQuery({
        queryKey: ["files"],
        queryFn: getFiles,
    });
    // issues: communication between the frontend and backend is too slow, fetch could be shit.
    if (isPending) return <div>Loading...</div>;
    if (isError) return <div>Something went wrong {error.message}</div>

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files)  setFile(e.target.files[0])
    }

    async function handleUpload() {
        const formData = new FormData();

        formData.append("filename", file as File);

        const res = await fetch("http://localhost:8080/upload", {
            method: "POST",
            body: formData,
        })
        console.log(res.ok)
    }

    return (
        <>
            <main>
                <div>
                    <input onChange={handleFileChange} type="file"/>
                    <button onClick={handleUpload}>Submit</button>
                </div>
                <div>
                    <ul className={"grid grid-cols-5 gap-1"}>
                        {/* Add option to hide or unhide files with . hidden extension.*/}
                        {data.directory.map((file) => {
                            return <File key={file} item={file} />
                        })}
                    </ul>
                </div>
            </main>

        </>
    )
}

// TODO: Add functionaliity to view text files, when pressing on the actual file instead of pressing download fix bug for it. make ui nice. clean up code. add search feature, add upload file. add security, implement mongo db.
// add -index.test.tsx (look into react testing library, and probably playwright)