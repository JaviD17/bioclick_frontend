import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "~/lib/auth";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  ArrowRight,
  Link as LinkIcon,
  BarChart3,
  Eye,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

// ===== TYPES =====
interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  iconBgColor: string;
  iconColor: string;
}

// ===== CONSTANTS =====
const FEATURES = [
  {
    icon: LinkIcon,
    title: "Smart Link Management",
    description:
      "Create, organize, and customize your links with ease. Drag and drop to reorder, toggle visibility, and more.",
    iconBgColor: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    description:
      "Track clicks, monitor performance, and understand your audience with detailed analytics and insights.",
    iconBgColor: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    icon: Eye,
    title: "Beautiful Profiles",
    description:
      "Create stunning, mobile-optimized profile pages that showcase your brand and content perfectly.",
    iconBgColor: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Built with modern technologies for blazing fast performance and an amazing user experience.",
    iconBgColor: "bg-yellow-100",
    iconColor: "text-yellow-600",
  },
] as const;

const BUTTON_STYLES = {
  primary:
    "gap-2 bg-primary hover:bg-primary/80 text-primary-foreground shadow-xl border-2 border-primary-foreground/20 hover:border-primary-foreground/60 hover:shadow-2xl hover:scale-105 transition-all duration-300 ease-out font-semibold",
  outline:
    "border-2 border-foreground/30 bg-background/80 text-foreground hover:bg-foreground/20 hover:border-foreground/70 hover:scale-105 backdrop-blur-sm transition-all duration-300 ease-out",
  cta: "gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg ring-2 ring-primary/20 hover:ring-primary/30 transition-all duration-200 font-semibold",
} as const;

// ===== COMPONENTS =====
function FeatureCard({
  icon: Icon,
  title,
  description,
  iconBgColor,
  iconColor,
}: FeatureCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader>
        <div
          className={`h-12 w-12 rounded-full ${iconBgColor} flex items-center justify-center mb-4`}
        >
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function AuthenticatedView({ username }: { username: string }) {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Welcome back, {username}! 👋🏽
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          Ready to manage your links and see how they're performing?
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link to="/dashboard">
            <Button size={"lg"} className="gap-2">
              Go to Dashboard
            </Button>
          </Link>
          <Link to="/$username" params={{ username }}>
            <Button variant={"outline"} size="lg">
              View Public Profile
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="container mx-auto px-4 py-24 text-center">
      <Badge variant={"secondary"} className="mb-6">
        🚀 Built with FastAPI & TanStack
      </Badge>

      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
        One link to rule
        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
          them all
        </span>
      </h1>

      <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
        Connect your audience to all of your content with one simple link in
        your bio. Track clicks, manage links, and grow your online presence.
      </p>

      <div className="mt-10 flex items-center justify-center gap-x-6">
        <Link to="/auth">
          <Button size={"lg"} className={BUTTON_STYLES.primary}>
            Get Started for Free
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link to="/demo">
          <Button
            variant={"outline"}
            size={"lg"}
            className={BUTTON_STYLES.outline}
          >
            View Demo
          </Button>
        </Link>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className="container mx-auto px-4 py-24">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Everything you need in one place
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Powerful features to help you manage and grow your online presence
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}

        {/* Call to Action Card */}
        <Card className="relative overflow-hidden md:col-span-2">
          <CardHeader>
            <CardTitle>Ready to get started?</CardTitle>
            <CardDescription>
              Join thousands of creators, businesses, and influencers who trust
              our platform to manage their online presence.
            </CardDescription>
            <div className="pt-4">
              <Link to="/auth">
                <Button className={BUTTON_STYLES.cta}>
                  Create Your Links
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
        </Card>
      </div>
    </section>
  );
}

function Landing() {
  const { isAuthenticated, user } = useAuth();

  // ===== AUTHENTICATED USER VIEW =====
  if (isAuthenticated) {
    return <AuthenticatedView username={user?.username || "User"} />;
  }

  // ===== PUBLIC LANDING PAGE =====
  return (
    <div className="flex flex-col">
      <HeroSection />
      <FeaturesSection />
    </div>
  );
}
