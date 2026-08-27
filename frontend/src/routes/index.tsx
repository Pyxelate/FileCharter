import { createFileRoute } from "@tanstack/react-router";


export const Route = createFileRoute("/")({
    component: Index,
})

function Index() {
    return (
        <>

        </>
    )
}

// add index.test.tsx (look into react testing library, and probably playwright)