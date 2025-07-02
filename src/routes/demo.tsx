import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/demo")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <p>Demo Page Here</p>
      {/* Demo Content */}
    </div>
  );
}
