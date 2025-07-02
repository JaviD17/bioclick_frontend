import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { apiClient } from "~/lib/api";
import { useState } from "react";
import { useAuth } from "~/lib/auth";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { Alert, AlertDescription } from "~/components/ui/alert";
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  User,
  Lock,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

type AuthMode = "login" | "register";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");

  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if alrady authenticated
  if (isAuthenticated) {
    navigate({ to: "/dashboard" });
    return null;
  }

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    full_name: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "login") {
        await login({
          username: formData.username,
          password: formData.password,
        });

        toast.success(`Welcome back, ${formData.username}`);
      } else {
        await register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
        });

        toast.success(
          `Account created successfully! Welcome to BioTap, ${formData.username}!`
        );
      }

      setTimeout(() => {
        navigate({ to: "/dashboard" });
      }, 1000);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await apiClient.requestPasswordReset(forgotPasswordEmail);
      toast.success("Password reset link sent! Check your email.");
      setShowForgotPassword(false);
      setForgotPasswordEmail("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError("");
    setFormData({ username: "", email: "", password: "", full_name: "" });
  };

  // Replace your entire return statement with this structure:

  return (
    <>
      {/* Main Auth Page */}
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-primary to-accent mx-auto mb-4" />
            <h1 className="text-2xl font-bold">
              {mode === "login" ? "Welcome back!" : "Create your account"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {mode === "login"
                ? "Sign in to manage your links"
                : "Join thousands of creators building their online presence"}
            </p>
          </div>

          {/* Auth Card */}
          <Card className="shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">
                {mode === "login" ? "Sign in" : "Create your account"}
              </CardTitle>
              <CardDescription>
                {mode === "login"
                  ? "Enter your credentials to access your dashboard"
                  : "Fill in your details to get started"}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {error && (
                <Alert variant={"destructive"} className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="johndoe"
                      value={formData.username}
                      onChange={(e) =>
                        handleInputChange("username", e.target.value)
                      }
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Email (Register only) */}
                {mode === "register" && (
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Full Name (Register only) */}
                {mode === "register" && (
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name (Optional)</Label>
                    <Input
                      id="full_name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.full_name}
                      onChange={(e) =>
                        handleInputChange("full_name", e.target.value)
                      }
                    />
                  </div>
                )}

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      className="pl-10 pr-10"
                      required
                      minLength={8}
                    />
                    <Button
                      type="button"
                      variant={"ghost"}
                      size={"sm"}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {mode === "login" && (
                  <div className="text-right">
                    <Button
                      type="button"
                      variant={"link"}
                      className="p-0 h-auto text-sm"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Forgot password?
                    </Button>
                  </div>
                )}

                {/* Submit Button */}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {mode === "login"
                        ? "Signing in..."
                        : "Creating account..."}
                    </>
                  ) : (
                    <>
                      {mode === "login" ? "Sign in" : "Create account"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              {/* Toggle Mode */}
              <div className="mt-6">
                <Separator />
                <div className="text-center text-sm text-muted-foreground mt-4">
                  {mode === "login"
                    ? "Don't have an account?"
                    : "Already have an account?"}
                  <Button
                    variant={"link"}
                    className="ml-1 p-0 h-auto font-semibold"
                    onClick={toggleMode}
                  >
                    {mode === "login" ? "Sign up" : "Sign in"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-8">
            By {mode === "register" ? "creating an account" : "signing in"}, you
            agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>

      {showForgotPassword && (
        <div
          className="fixed inset-0 bg-black/5 backdrop-blur-lg dark:backdrop-blur-2xl flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            // Close modal when clicking the backdropss
            if (e.target === e.currentTarget) {
              setShowForgotPassword(false);
              setError("");
              setForgotPasswordEmail("");
            }
          }}
        >
          <Card
            className="w-full max-w-md shadow-2xl border-2 bg-card"
            onClick={(e) => e.stopPropagation()} // Prevent modal close when clicking inside
          >
            <CardHeader>
              <CardTitle>Reset Password</CardTitle>
              <CardDescription>
                Enter your email address and we'll send you a reset link.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="john@example.com"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      className="pl-10"
                      required
                      autoFocus
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setError("");
                      setForgotPasswordEmail("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
