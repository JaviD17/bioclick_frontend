import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useAuth } from "~/lib/auth";
import { useEffect } from "react";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

// ===== COMPONENTS =====
function LoadingSpinner() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4" />
        <p className="text-muted-foreground">Loading your dashboard...</p>
      </div>
    </div>
  );
}

function DashboardLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // ===== AUTHENTICATION GUARD =====
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: "/auth" });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // ===== RENDER CONDITIONS =====
  if (isLoading) return <LoadingSpinner />;

  if (!isAuthenticated) return null; // Will redirect via useEffect

  return (
    <div className="container mx-auto px-4 py-8">
      <Outlet />
    </div>
  );
}
