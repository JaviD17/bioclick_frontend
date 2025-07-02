import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

interface RealtimeSyncOptions {
  queryKey: string[];
  enabled?: boolean;
  interval?: number; // milliseconds
  onlyWhenVisible?: boolean;
}

export function useRealtimeSync({
  queryKey,
  enabled = true,
  interval = 30000, // 30 seconds default
  onlyWhenVisible = true,
}: RealtimeSyncOptions) {
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const syncData = () => {
      // Only sync if tab is visible (saves bandwidth)
      if (onlyWhenVisible && document.hidden) return;

      queryClient.invalidateQueries({ queryKey });
    };

    // Set up interval
    intervalRef.current = setInterval(syncData, interval);

    // Sync when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        syncData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [queryKey, enabled, interval, onlyWhenVisible, queryClient]);
}

// Cross-tab synchronization using storage events
export function useCrossTabSync(queryKeys: string[][]) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Listen for custom sync events
      if (e.key === "biotap-sync" && e.newValue) {
        const syncData = JSON.parse(e.newValue);

        // Invalidate specific queries based on sync event
        queryKeys.forEach((queryKey) => {
          if (syncData.type === "click" || syncData.type === "all") {
            queryClient.invalidateQueries({ queryKey });
          }
        });
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [queryClient, queryKeys]);

  // Function to trigger sync across tabs
  const triggerCrossTabSync = (type: "click" | "link" | "all" = "click") => {
    localStorage.setItem(
      "biotap-sync",
      JSON.stringify({
        type,
        timestamp: Date.now(),
      })
    );
    // Remove after a short delay to trigger event
    setTimeout(() => localStorage.removeItem("biotap-sync"), 100);
  };
  return { triggerCrossTabSync };
}
