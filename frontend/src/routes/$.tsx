import { createFileRoute } from "@tanstack/react-router";
import { DirectoryBrowser } from "../components/DirectoryBrowser.tsx";

// To do a catch all segment e.g /$ = /test/directory, /test/directory is the entire param. You can just have a file named $
// and the component name itself can be different to the file name, e.g RouteComponent.
// Usual access to path param is via $paramname { paramname } = Route.getParams(), but for catch all you can do
//  $ for { _splat} = Route.getParams(). _splat needs to be explicitly said for the catch all.

export const Route = createFileRoute("/$")({
  component: RouteComponent,
});

function RouteComponent() {
  const { _splat } = Route.useParams();
  return <DirectoryBrowser splat={_splat ?? ""} />;
}
