// Option A: Updated useOptimisticClicks.ts (Remove duplicate tracking)

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { apiClient, type Link } from "~/lib/api";

export function useOptimisticClicks() {
  const queryClient = useQueryClient();

  const trackClickWithOptimisticUpdate = useCallback(
    async (linkId: number, username?: string) => {
      // 1. IMMEDIATE OPTIMISTIC UPDATE
      const updateCaches = (updater: (link: Link) => Link) => {
        // Update public links cache
        if (username) {
          queryClient.setQueryData(
            ["publicLinks", username],
            (oldData: Link[] | undefined) => {
              if (!oldData) return oldData;
              return oldData.map((link) =>
                link.id === linkId ? updater(link) : link
              );
            }
          );
        }

        // Update user's links cache (dashboard)
        queryClient.setQueryData(["links"], (oldData: Link[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map((link) =>
            link.id === linkId ? updater(link) : link
          );
        });
      };

      // Optimistically increment click count
      updateCaches((link) => ({
        ...link,
        click_count: link.click_count + 1,
      }));

      // 2. REDIRECT (Let the redirect endpoint handle tracking)
      const redirectUrl = apiClient.getRedirectUrl(linkId);
      window.open(redirectUrl, "_blank", "noopener,noreferrer");

      // 3. BACKGROUND SYNC (Get real data after redirect tracking)
      setTimeout(() => {
        if (username) {
          queryClient.invalidateQueries({
            queryKey: ["publicLinks", username],
          });
        }
        queryClient.invalidateQueries({ queryKey: ["links"] });
        queryClient.invalidateQueries({ queryKey: ["analytics"] });
      }, 2000); // 2 second delay
    },
    [queryClient]
  );

  return { trackClickWithOptimisticUpdate };
}