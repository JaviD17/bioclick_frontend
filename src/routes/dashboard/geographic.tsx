import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "~/lib/auth";
import { apiClient, type GeographicResponse } from "~/lib/api";
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
import { Badge } from "~/components/ui/badge";
import { Globe, MapPin, TrendingUp, Users, Loader2 } from "lucide-react";
import { WorldMap } from "~/components/WorldMap";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/dashboard/geographic")({
  component: GeographicAnalyticsPage,
});

const TIME_RANGES = [
  { label: "Last 7 days", value: "7d", days: 7 },
  { label: "Last 30 days", value: "30d", days: 30 },
  { label: "Last 90 days", value: "90d", days: 90 },
  { label: "Last year", value: "1y", days: 365 },
];

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

function LoadingState() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    </div>
  );
}

function CountryFlag({ countryCode }: { countryCode: string }) {
  return (
    <span className="text-lg">
      {String.fromCodePoint(
        ...[...countryCode.toUpperCase()].map((x) => 0x1f1a5 + x.charCodeAt(0))
      )}
    </span>
  );
}

function GeographicAnalyticsPage() {
  const { user } = useAuth();
  const [selectedRange, setSelectedRange] = useState(TIME_RANGES[1]); // Default: 30d

  const {
    data: geopgraphic,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["geographic-analytics", user?.id, selectedRange.days],
    queryFn: () => apiClient.getGeographicAnalytics(selectedRange.days),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleTimeRangeChange = (value: string) => {
    const range = TIME_RANGES.find((r) => r.value === value);
    if (range) setSelectedRange(range);
  };

  if (isLoading) return <LoadingState />;
  if (error) return <div>Error loading geographic data</div>;
  if (!geopgraphic) return null;

  const topCountry = geopgraphic.top_countries[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="h-8 w-8" />
            Geographic Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Discover where your audience is located around the world
          </p>
        </div>

        {/* Step 4 */}
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
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Countries Reached"
          value={geopgraphic.total_countries.toString()}
          subtitle={`Active in ${geopgraphic.total_countries} countries`}
          icon={Globe}
        />

        <MetricCard
          title="Top Country"
          value={topCountry?.country_name || "No data"}
          subtitle={`${
            topCountry
              ? `${topCountry.clicks} clicks (${topCountry.percentage}%)`
              : "No geographic data yet"
          }`}
          icon={MapPin}
        />

        <MetricCard
          title="International Clicks"
          value={geopgraphic.top_countries
            .reduce((sum, country) => sum + country.clicks, 0)
            .toLocaleString()}
          subtitle="From geolocated visitors"
          icon={TrendingUp}
        />

        <MetricCard
          title="Global Visitors"
          value={geopgraphic.top_countries
            .reduce((sum, country) => country.unique_visitors, 0)
            .toLocaleString()}
          subtitle="Unique international visitors"
          icon={Users}
        />
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* World Map */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Global Click Distribution
            </CardTitle>
            <CardDescription>
              Interactive map showing clicks from around the world
            </CardDescription>
          </CardHeader>
          <CardContent>
            {geopgraphic.top_countries.length > 0 ? (
              <WorldMap
                countryData={geopgraphic.top_countries}
                className="h-[400px] w-full rounded-lg"
              />
            ) : (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No geographic data available yet</p>
                  <p className="text-sm">
                    Data will appear as visitors click your links
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Countries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Top Countries
            </CardTitle>
            <CardDescription>
              Countries with the most clicks in the last {selectedRange.days}{" "}
              days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {geopgraphic.top_countries.length > 0 ? (
              <div className="space-y-4">
                {geopgraphic.top_countries.map((country, index) => (
                  <div
                    key={country.country_code}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                        {index + 1}
                      </div>
                      <CountryFlag countryCode={country.country_code} />
                      <div>
                        <p className="font-medium">{country.country_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {country.unique_visitors} unique visitors
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{country.clicks}</p>
                      <Badge variant={"secondary"} className="text-xs">
                        {country.percentage}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No country data available</p>
                <p className="text-sm">
                  Data will appear as visitors click your links
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Geographic Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Geographic Trends
            </CardTitle>
            <CardDescription>International clicks over time</CardDescription>
          </CardHeader>
          <CardContent>
            {geopgraphic.geographic_trends.length > 0 ? (
              <ResponsiveContainer width={"100%"} height={200}>
                <LineChart data={geopgraphic.geographic_trends}>
                  <CartesianGrid
                    strokeDasharray={"3 3"}
                    className="opacity-30"
                  />
                  <XAxis
                    dataKey={"date"}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString()
                    }
                    formatter={(value) => [value, "International Clicks"]}
                  />
                  <Line
                    type={"monotone"}
                    dataKey={"clicks"}
                    stroke="oklch(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "oklch(var(--primary))", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No trend data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
