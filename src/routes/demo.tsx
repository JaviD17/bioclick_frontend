import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";

export const Route = createFileRoute("/demo")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="container mx-auto my-12">
      <div className="border text-center rounded space-y-6 py-8">
        <div>
          <h1 className="font-bold text-3xl tracking-wide">Demo Page</h1>
          <p className="italic text-base tracking-tight text-muted-foreground">Under Construction</p>
        </div>
        <Separator className="max-w-sm bg-current mx-auto" />
        <Button size={"lg"}>Login</Button>
      </div>
    </div>
  );
}
