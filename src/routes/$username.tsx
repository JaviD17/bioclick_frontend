import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { apiClient, type Link } from "~/lib/api";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import {
  ExternalLink,
  BarChart3,
  Share,
  CheckCircle,
  User,
} from "lucide-react";
import { getIconComponent } from "~/components/IconPicker";
import { toast } from "sonner";
import { useOptimisticClicks } from "~/hooks/useOptimisticClicks";
import { useRealtimeSync, useCrossTabSync } from "~/hooks/useRealtimeSync";

export const Route = createFileRoute("/$username")({
  component: PublicProfile,
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

const calculateTotalClicks = (links: Link[]) => {
  return links.reduce((sum, link) => sum + link.click_count, 0);
};

const getUserInitials = (username: string) => {
  return username.slice(0, 2).toUpperCase();
};

const extractHostname = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

// ===== COMPONENTS =====
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="h-20 w-20 bg-muted animate-pulse rounded-full mx-auto" />
        <div className="h-6 w-32 bg-muted animate-pulse rounded mx-auto" />
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="h-12 w-80 bg-muted animate-pulse rounded-xl"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorState({ username }: { username: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="h-20 w-20 bg-destructive/10 rounded-full mx-auto flex items-center justify-center">
          <User className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold">Profile not found</h1>
        <p className="text-muted-foreground">
          The user @{username} doesn't exist or has no public links.
        </p>
      </div>
    </div>
  );
}

function ProfileHeader({
  username,
  totalClicks,
  activeLinksCount,
  onShareProfile,
  copied,
}: {
  username: string;
  totalClicks: number;
  activeLinksCount: number;
  onShareProfile: () => void;
  copied: boolean;
}) {
  return (
    <div className="text-center mb-8">
      <Avatar className="h-20 w-20 mx-auto mb-4 ring-4 ring-primary/20">
        <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-primary to-accent text-primary-foreground">
          {getUserInitials(username)}
        </AvatarFallback>
      </Avatar>

      <h1 className="text-2xl font-bold mb-2">@{username}</h1>

      <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-1">
          <BarChart3 className="h-4 w-4" />
          {totalClicks} total clicks
        </div>
        <div className="flex items-center gap-1">
          <ExternalLink className="h-4 w-4" />
          {activeLinksCount} links
        </div>
      </div>

      <Button
        variant={"outline"}
        size={"sm"}
        onClick={onShareProfile}
        className="gap-2"
      >
        {copied ? (
          <>
            <CheckCircle className="h-4 w-4 text-green-600" />
            Copied!
          </>
        ) : (
          <>
            <Share className="h-4 w-4" />
            Share Profile
          </>
        )}
      </Button>
    </div>
  );
}

function LinkCard({
  link,
  onLinkClick,
}: {
  link: Link;
  onLinkClick: (id: number) => void;
}) {
  const IconComponent = link.icon ? getIconComponent(link.icon) : null;

  return (
    <Card
      className="group hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer border-2 hover:border-primary/50"
      onClick={() => onLinkClick(link.id)}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              {IconComponent && (
                <IconComponent className="h-5 w-5 text-primary shrink-0" />
              )}
              <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                {link.title}
              </h3>
            </div>

            {link.description && (
              <p className="text-muted-foreground text-sm mb-2">
                {link.description}
              </p>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="truncate">{extractHostname(link.url)}</span>
              {link.click_count > 0 && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" />
                    {link.click_count} clicks
                  </div>
                </>
              )}
            </div>
          </div>
          <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors ml-4 shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyLinksState({ username }: { username: string }) {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <ExternalLink className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold">No links yet</h3>
        <p className="text-muted-foreground">
          @{username} hasn't added any links yet.
        </p>
      </CardContent>
    </Card>
  );
}

function PublicProfile() {
  const { username } = Route.useParams();
  const [copied, setCopied] = useState(false);

  // Real-time click tracking
  const { trackClickWithOptimisticUpdate } = useOptimisticClicks();

  // Background sync for real-time updates
  useRealtimeSync({
    queryKey: ["publicLinks", username],
    interval: 15000, // 15 seconds for public profiles
  });

  // Cross-tab synchronization
  const { triggerCrossTabSync } = useCrossTabSync([
    ["publicLinks", username],
    ["analytics"],
  ]);

  // ===== DATA FETCHING  =====
  const {
    data: links = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["publicLinks", username],
    queryFn: async () => {
      const result = await apiClient.getPublicLinks(username);
      return sortLinksByOrder(result);
    },
    ...QUERY_CONFIG,
    refetchOnWindowFocus: true, // Refresh when user returns to tab
    refetchOnMount: true,
  });

  // ===== COMPUTED VALUES =====
  const activeLinks = links.filter((link) => link.is_active);
  const totalClicks = calculateTotalClicks(links);

  // ===== EVENT HANDLERS =====
  const shareProfile = useCallback(async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_SUCCESS_DURATION);

      toast.success("Profile link copied!", {
        description: `Share @${username}'s profile with others`,
      });
    } catch (error) {
      console.error("Failed to copy:", error);

      toast.error("Failed to copy profile link", {
        description: "Please try copying the URL manually from your browser",
      });
    }
  }, [username]);

  const trackClick = useCallback(
    async (linkId: number) => {
      // Use optimistic update system
      await trackClickWithOptimisticUpdate(linkId, username);

      // Trigger cross-tab sync
      triggerCrossTabSync("click");

      // const redirectUrl = apiClient.getRedirectUrl(linkId);
      // window.open(redirectUrl, "_blank", "noopener,noreferrer");
    },
    [trackClickWithOptimisticUpdate, username, triggerCrossTabSync]
  );

  // ===== RENDER CONDITIONS =====
  if (isLoading) return <LoadingSkeleton />;

  if (error || !links) return <ErrorState username={username} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* ===== HEADER ===== */}
        <ProfileHeader
          username={username}
          totalClicks={totalClicks}
          activeLinksCount={activeLinks.length}
          onShareProfile={shareProfile}
          copied={copied}
        />

        {/* Links */}
        <div className="space-y-4">
          {activeLinks.length === 0 ? (
            <EmptyLinksState username={username} />
          ) : (
            activeLinks.map((link) => (
              <LinkCard key={link.id} link={link} onLinkClick={trackClick} />
            ))
          )}
        </div>

        {/* ===== FOOTER ===== */}
        <div className="text-center mt-12 text-xs text-muted-foreground">
          <p>Powered by BioClick</p>
        </div>
      </div>
    </div>
  );
}
