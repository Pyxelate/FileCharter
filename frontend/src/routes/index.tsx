import { createFileRoute } from "@tanstack/react-router";
import { DirectoryBrowser } from "../components/DirectoryBrowser.tsx";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <DirectoryBrowser splat="" />;
}
