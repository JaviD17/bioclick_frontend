import { createFileRoute, Link as RouterLink } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { useAuth } from "~/lib/auth";
import { apiClient, type User, type Link } from "~/lib/api";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import {
  Plus,
  ExternalLink,
  Eye,
  BarChart3,
  Copy,
  CheckCircle,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

// ===== CONSTANTS =====
const QUERY_CONFIG = {
  staleTime: 30 * 1000, // 30 seconds
  retry: 1,
} as const;

const COPY_SUCCESS_DURATION = 2000; // 2 seconds

// ===== UTILITY FUNCTIONS =====
const sortLinksByOrder = (links: Link[]) => {
  return links.sort((a, b) => a.display_order - b.display_order);
};

const calculateLinkStats = (links: Link[]) => {
  const activeLinks = links.filter((link) => link.is_active);
  const totalClicks = links.reduce((sum, link) => sum + link.click_count, 0);
  const topLink = links.reduce(
    (top, link) => (link.click_count > (top?.click_count || 0) ? link : top),
    links[0]
  );

  return { activeLinks, totalClicks, topLink };
};

// ===== COMPONENTS =====
function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 bg-muted animate-pulse rounded" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-2">
              <div className="h-4 bg-muted animate-pulse rounded" />
              <div className="h-8 bg-muted animate-pulse rounded" />
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EmptyLinksState() {
  return (
    <div className="text-center py-8">
      <LinkIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold">No links yet</h3>
      <p className="text-muted-foreground mb-4">
        Create your first link to get started
      </p>
      <RouterLink to="/dashboard/links">
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Your First Link
        </Button>
      </RouterLink>
    </div>
  );
}

function LinkItem({ link }: { link: Link }) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium truncate">{link.title}</h4>
          {!link.is_active && (
            <Badge variant={"secondary"} className="text-xs">
              Hidden
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">{link.url}</p>
      </div>
      <div className="text-right ml-4">
        <p className="text-sm font-medium">{link.click_count}</p>
        <p className="text-xs text-muted-foreground">clicks</p>
      </div>
    </div>
  );
}

function ProfileUrlCard({ user }: { user: User }) {
  const [copied, setCopied] = useState(false);

  const publicProfileUrl = `${window.location.origin}/${user?.username}`;

  const copyProfileUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(publicProfileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_SUCCESS_DURATION);

      toast.success("Profile URL copied to clipboard!", {
        description: "Share this link to direct people to all your content",
      });
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy URL", {
        description:
          "Please try copying manually or check your browser permissions",
      });
    }
  }, [publicProfileUrl]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Your Profile URL</CardTitle>
        <CardDescription>
          Share this link to direct people to all your content
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={publicProfileUrl}
            readOnly
            className="font-mono text-sm"
          />
          <Button
            variant={"outline"}
            size={"icon"}
            onClick={copyProfileUrl}
            className="shrink-0"
          >
            {copied ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        {copied && (
          <p className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Copied to clipboard!
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardHome() {
  const { user } = useAuth();

  // ===== DATA FETCHING =====
  const {
    data: links = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["links", user?.id],
    queryFn: async () => {
      const result = await apiClient.getLinks();
      return sortLinksByOrder(result);
    },
    enabled: !!user?.id, // Only run query when user is loaded
    ...QUERY_CONFIG,
  });

  // ===== COMPUTED VALUES =====
  const { activeLinks, totalClicks, topLink } = calculateLinkStats(links);
  const displayName = user?.full_name || user?.username;
  const hiddenLinksCount = links.length - activeLinks.length;
  const recentLinksCount = Math.min(links.length, 5);

  // ===== RENDER CONDITIONS =====
  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-8">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {displayName}! 👋🏽
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your links and track your performance
          </p>
        </div>
        <div className="flex gap-3">
          <RouterLink to="/dashboard/links">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Link
            </Button>
          </RouterLink>
          <RouterLink
            to={"/$username"}
            params={{ username: user?.username || "" }}
          >
            <Button variant="outline" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </Button>
          </RouterLink>
        </div>
      </div>

      {/* ===== STATS CARDS ===== */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Active Links"
          value={activeLinks.length.toString()}
          subtitle={`${hiddenLinksCount} hidden`}
          icon={LinkIcon}
        />

        <MetricCard
          title="Total Clicks"
          value={totalClicks.toLocaleString()}
          subtitle="All time clicks"
          icon={BarChart3}
        />

        <MetricCard
          title="Top Performing"
          value={topLink?.title || "No links yet"}
          subtitle={
            topLink ? `${topLink.click_count} clicks` : "Create your first link"
          }
          icon={ExternalLink}
        />
      </div>

      {/* ===== PROFILE URL ===== */}
      {user && <ProfileUrlCard user={user} />}

      {/* ===== RECENT LINKS ===== */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Links</CardTitle>
            <CardDescription>
              Your latest {recentLinksCount} links
            </CardDescription>
          </div>
          <RouterLink to="/dashboard/links">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </RouterLink>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <EmptyLinksState />
          ) : (
            <div className="space-y-3">
              {links.slice(0, 5).map((link) => (
                <LinkItem key={link.id} link={link} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
