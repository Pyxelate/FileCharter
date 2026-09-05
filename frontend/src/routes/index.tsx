import { createFileRoute } from "@tanstack/react-router";
import { DirectoryBrowser } from "../components/DirectoryBrowser.tsx";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <DirectoryBrowser splat="" />;
}

// TODO: when pressing on the actual file instead of pressing download fix bug for it. make ui nice.
// add search feature, add security, implement mongo db.
