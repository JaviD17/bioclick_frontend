/// <reference types="vite/client" />
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect, useState } from "react";

import { DefaultCatchBoundary } from "~/components/DefaultCatchBoundary";
import { NotFound } from "~/components/NotFound";
import { AuthProvider, useAuth } from "~/lib/auth";
import { ThemeProvider } from "~/lib/theme";
import { ThemeToggle } from "~/components/ThemeToggle";
import { Button } from "~/components/ui/button";
import { Toaster } from "sonner";
import { LogOut, Home, User, BarChart3, Menu, X } from "lucide-react";

import appCss from "~/styles/app.css?url";
import { seo } from "~/utils/seo";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: false,
    },
  },
});

function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  });

  const toggleMobileMenu = () => {
    console.log("Menu clicked");
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary to-accent" />
            <span className="text-xl font-bold">BioTap</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard">
                  <Button variant={"ghost"} size={"sm"}>
                    <Home className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>

                <Link to="/dashboard/analytics">
                  <Button variant={"ghost"} size={"sm"}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Analytics
                  </Button>
                </Link>

                <Link to="/profile">
                  <Button variant={"ghost"} size={"sm"}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Button>
                </Link>

                <ThemeToggle />

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    Welcome, {user?.username}!
                  </span>
                  <Button
                    variant={"ghost"}
                    size={"sm"}
                    onClick={logout}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <>
                <ThemeToggle />
                <Link to="/auth">
                  <Button variant={"ghost"} size={"sm"}>
                    Login
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size={"sm"}>Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <Button
              variant={"ghost"}
              size={"sm"}
              onClick={isMounted ? toggleMobileMenu : undefined}
              className="h-9 w-9 p-0"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-background/95">
            <div className="px-4 py-4 space-y-3">
              {isAuthenticated ? (
                <>
                  {/* User Welcome */}
                  <div className="pb-2 border-b">
                    <span className="text-sm text-muted-foreground">
                      Welcome, {user?.username}
                    </span>
                  </div>

                  {/* Navigation Links */}
                  <Link
                    to="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button
                      variant={"ghost"}
                      size={"sm"}
                      className="w-full justify-start"
                    >
                      <Home className="mr-2 h-4 w-4" />
                      Dasboard
                    </Button>
                  </Link>

                  <Link
                    to="/dashboard/analytics"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button
                      variant={"ghost"}
                      size={"sm"}
                      className="w-full justify-start"
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Analytics
                    </Button>
                  </Link>

                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Button
                      variant={"ghost"}
                      size={"sm"}
                      className="w-full justify-start"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Button>
                  </Link>

                  {/* Logout */}
                  <div className="pt-2 border-t">
                    <Button
                      variant={"ghost"}
                      size={"sm"}
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button
                      variant={"ghost"}
                      size={"sm"}
                      className="w-full justify-start"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button size={"sm"} className="w-full">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      ...seo({
        title:
          "TanStack Start | Type-Safe, Client-First, Full-Stack React Framework",
        description: `TanStack Start is a type-safe, client-first, full-stack React framework. `,
      }),
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/favicon-32x32.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "/favicon-16x16.png",
      },
      { rel: "manifest", href: "/site.webmanifest", color: "#fffff" },
      { rel: "icon", href: "/favicon.ico" },
    ],
  }),
  errorComponent: (props) => {
    return (
      <RootDocument>
        <DefaultCatchBoundary {...props} />
      </RootDocument>
    );
  },
  notFoundComponent: () => <NotFound />,
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <div className="min-h-screen bg-background font-sans antialiased">
                <Navbar />
                <main>{children}</main>
              </div>

              {/* Dev tools - only in development */}
              {process.env.NODE_ENV === "development" && (
                <>
                  <TanStackRouterDevtools position="bottom-right" />
                  <ReactQueryDevtools initialIsOpen={false} />
                  <Scripts />
                </>
              )}
              <Toaster
                position="top-right"
                richColors
                closeButton
                theme="system"
              />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
