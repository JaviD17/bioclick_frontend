import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "~/lib/auth";
import { apiClient, type AnalyticsResponse } from "~/lib/api";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  Download,
  MousePointer,
  ExternalLink,
  Users,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/analytics")({
  component: AnalyticsPage,
});

// ===== CONSTANTS =====
const TIME_RANGES = [
  { label: "Last 7 days", value: "7d", days: 7 },
  { label: "Last 30 days", value: "30d", days: 30 },
  { label: "Last 90 days", value: "90d", days: 90 },
  { label: "Last year", value: "1y", days: 365 },
];

const CHART_COLORS = {
  primary: "oklch(var(--primary))",
  mobile: "#8884d8",
  desktop: "#82ca9d",
  tablet: "#ffc658",
  other: "#ff7c7c",
};

const QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes
} as const;

// ===== TYPES =====
type TimeRange = (typeof TIME_RANGES)[number];

// ===== UTILITY FUNCTIONS =====
const formatGrowth = (growth: number): string => {
  const sign = growth > 0 ? "+" : "";
  return `${sign}${growth}%`;
};

const formatTooltipDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const getDeviceColor = (deviceType: string): string => {
  switch (deviceType) {
    case "mobile":
      return CHART_COLORS.mobile;
    case "desktop":
      return CHART_COLORS.desktop;
    case "tablet":
      return CHART_COLORS.tablet;
    default:
      return CHART_COLORS.other;
  }
};

const createAnalyticsCSV = (
  analytics: AnalyticsResponse,
  timeRange: string
): string => {
  const csvData = [
    ["Metric", "Value"],
    ["Total Clicks", analytics.total_clicks.toString()],
    ["Unique Visitors", analytics.unique_visitors.toString()],
    ["Growth Percentage", `${analytics.growth_percentage}%`],
    [""],
    ["Top Links", ""],
    ["Link Title", "Clicks", "Percentage"],
    ...analytics.top_links.map((link) => [
      link.title,
      link.clicks.toString(),
      `${link.percentage}%`,
    ]),
    [""],
    ["Device Breakdown", ""],
    ["Device Type", "Count", "Percentage"],
    ...analytics.device_stats.map((device) => [
      device.device_type,
      device.count.toString(),
      `${device.percentage}%`,
    ]),
  ];

  return csvData
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");
};

// ===== COMPONENTS =====
function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  valueColor,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  valueColor?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueColor || ""}`}>{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <Icon className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p className="font-medium">{title}</p>
      <p className="text-sm">{description}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-destructive mb-4">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold">Failed to load analytics</h3>
            <p className="text-muted-foreground">
              {error.message || "Unable to fetch analytics data"}
            </p>
          </div>
          <Button onClick={onRetry} variant="outline">
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsPage() {
  const { user } = useAuth();
  const [selectedRange, setSelectedRange] = useState<TimeRange>(TIME_RANGES[1]); // Default: 30d

  // ===== DATA FETCHING =====
  const {
    data: analytics,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["analytics", user?.id, selectedRange.days],
    queryFn: () => apiClient.getAnalytics(selectedRange.days),
    enabled: !!user?.id,
    ...QUERY_CONFIG,
  });

  // ===== EXPORT FUNCTIONALITY =====
  const exportMutation = useMutation({
    mutationFn: async () => {
      if (!analytics) throw new Error("No data to export");

      const csvString = createAnalyticsCSV(analytics, selectedRange.value);
      const blob = new Blob([csvString], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-${selectedRange.value}-${
        new Date().toISOString().split("T")[0]
      }.csv`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast.success("Analytics exported successfully", {
        description: "Your data has been downloaded as a CSV file",
      });
    },
    onError: () => {
      toast.error("Export failed", {
        description: "Please try again or contact support",
      });
    },
  });

  // ===== EVENT HANDLERS =====
  const handleTimeRangeChange = (value: string) => {
    const range = TIME_RANGES.find((r) => r.value === value);
    if (range) setSelectedRange(range);
  };

  // ===== RENDER CONDITIONS =====
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (!analytics) return null;

  // ===== COMPUTED VALUES =====
  const growthColor =
    analytics.growth_percentage > 0
      ? "text-green-600"
      : analytics.growth_percentage < 0
      ? "text-red-600"
      : "text-muted-foreground";

  const uniqueVisitorRate =
    analytics.total_clicks > 0
      ? `${((analytics.unique_visitors / analytics.total_clicks) * 100).toFixed(
          1
        )}% of clicks`
      : "No data";

  const topLink = analytics.top_links[0];
  const topLinkInfo = topLink
    ? `${topLink.clicks} clicks (${topLink.percentage}%)`
    : "Create links to see data";

  return (
    <div className="space-y-8">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Track your link performance and audience insights
          </p>
        </div>

        <div className="flex gap-3">
          <Select
            value={selectedRange.value}
            onValueChange={handleTimeRangeChange}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            variant="outline"
            className="gap-2"
          >
            {exportMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ===== KEY METRICS ===== */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Total Clicks"
          value={analytics.total_clicks.toLocaleString()}
          subtitle={`${formatGrowth(
            analytics.growth_percentage
          )} from previous period`}
          icon={MousePointer}
        />

        <MetricCard
          title="Unique Visitors"
          value={analytics.unique_visitors.toLocaleString()}
          subtitle={uniqueVisitorRate}
          icon={Users}
        />

        <MetricCard
          title="Top Link"
          value={topLink?.title || "No data"}
          subtitle={topLinkInfo}
          icon={ExternalLink}
        />

        <MetricCard
          title="Growth"
          value={formatGrowth(analytics.growth_percentage)}
          subtitle={`vs previous ${selectedRange.days} days`}
          icon={TrendingUp}
          valueColor={growthColor}
        />
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* ===== CLICK TRENDS CHART ===== */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Click Trends
            </CardTitle>
            <CardDescription>
              Daily clicks over the last {selectedRange.days} days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.daily_stats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.daily_stats}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={formatTooltipDate}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString()
                    }
                    formatter={(value) => [value, "Clicks"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="clicks"
                    stroke={CHART_COLORS.primary}
                    strokeWidth={2}
                    dot={{ fill: CHART_COLORS.primary, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <EmptyState
                  icon={BarChart3}
                  title="No click data available for this period"
                  description=""
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* ===== TOP PERFORMING LINKS ===== */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Links
            </CardTitle>
            <CardDescription>
              Your most clicked links in the last {selectedRange.days} days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.top_links.length > 0 ? (
              <div className="space-y-4">
                {analytics.top_links.slice(0, 5).map((link, index) => (
                  <div
                    key={link.link_id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{link.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {link.clicks} clicks
                        </p>
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      {link.percentage}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={ExternalLink}
                title="No link data available"
                description="Create some links to see performance"
              />
            )}
          </CardContent>
        </Card>

        {/* ===== DEVICE BREAKDOWN ===== */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Device Types
            </CardTitle>
            <CardDescription>How visitors access your links</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.device_stats.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={analytics.device_stats}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="percentage"
                    >
                      {analytics.device_stats.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getDeviceColor(entry.device_type)}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, "Share"]} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="mt-4 space-y-2">
                  {analytics.device_stats.map((device) => (
                    <div
                      key={device.device_type}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: getDeviceColor(device.device_type),
                          }}
                        />
                        <span className="capitalize">{device.device_type}</span>
                      </div>
                      <span className="font-medium">{device.percentage}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                icon={Users}
                title="No device data available"
                description="Data will appear as users click your links"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
