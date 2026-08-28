import { createFileRoute } from '@tanstack/react-router'
import * as z from "zod";
import {useQuery} from "@tanstack/react-query";
import {File} from "../components/File.tsx";


// To do a catch all segment e.g /$ = /test/directory, /test/directory is the entire param. You can just have a file named $
// and the component name itself can be different to the file name, e.g RouteComponent.
// Usual access to path param is via $paramname { paramname } = Route.getParams(), but for catch all you can do
//  $ for { _splat} = Route.getParams(). _splat needs to be explicitly said for the catch all.

export const Route = createFileRoute('/$')({
  component: RouteComponent,
})

const Files = z.object({
    directory: z.array(z.string()),
})

type FileData = z.infer<typeof Files>;



async function getFiles(directory: String): Promise<FileData> {
    const response = await fetch(`http://localhost:8080/${directory}`);

    const result = Files.safeParse(await response.json());
    if (result.success) {
        return result.data
    } else {
        console.log(result.error.issues);
        return Promise.reject("e");
    }
}


function RouteComponent() {
    const { _splat } = Route.useParams();
    const {data, isPending, isError, error} = useQuery({
        queryKey: ["files"],
        queryFn: () => getFiles(_splat as String),
    });

    if (isPending) return <div>Loading...</div>;
    if (isError) return <div>Something went wrong {error.message}</div>


    return (
        <>
            <ul>
                {/* Add option to hide or unhide files with . hidden extension.*/}
                {data.directory.map((file) => {
                    return <File item={file} />
                })}
            </ul>
        </>
    )
}