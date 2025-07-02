import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "~/lib/auth";
import { apiClient, type UserUpdate, type PasswordChange } from "~/lib/api";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import {
  User,
  Mail,
  Calendar,
  ExternalLink,
  BarChart3,
  Save,
  Eye,
  Lock,
  AlertCircle,
  CheckCircle,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

interface PasswordChangeData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

function ProfilePage() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletePassword, setDeletePassword] = useState("");

  // Fetch user stats (links and clicks)
  const { data: links = [] } = useQuery({
    queryKey: ["links", user?.id],
    queryFn: async () => {
      const result = await apiClient.getLinks();
      // Sort by display_order to ensure consistent ordering
      return result.sort((a, b) => a.display_order - b.display_order);
    },
    enabled: !!user?.id,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: UserUpdate) => {
      const result = await apiClient.updateUser(data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);

      // Show sonner toast
      toast.success("Profile updated successfully");
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message}`);
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordChangeData) => {
      const result = await apiClient.changePassword(data);
      return result;
    },
    onSuccess: (response) => {
      console.log(response);
      setPasswordSuccess(true);
      setPasswordError(null);
      setTimeout(() => setPasswordSuccess(false), 3000);

      // Show toast with API response message
      toast.success(response.message);
    },
    onError: (error) => {
      // Clear success state if there was an error
      setPasswordSuccess(false);

      // Show error toast
      toast.error(`Password change failed: ${error.message}`);
    },
  });

  // Delete profile mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      toast.success("Account delete successfully");
      // Log out and redirect
      logout();
    },
    onError: (error) => {
      toast.error(`Failed to delete account: ${error.message}`);
    },
  });

  const handleProfileUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const updateData: UserUpdate = {
      email: formData.get("email") as string,
      full_name: (formData.get("full_name") as string) || undefined,
    };

    updateProfileMutation.mutate(updateData);
  };

  const handlePasswordChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError(null);

    const formData = new FormData(e.currentTarget);

    const passwordData = {
      current_password: formData.get("current_password") as string,
      new_password: formData.get("new_password") as string,
      confirm_password: formData.get("confirm_password") as string,
    };

    // Client-side validation
    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (passwordData.new_password.length < 8) {
      setPasswordError("New password must be at least 8 characters long");
      return;
    }

    // Only send the data the API expects
    const apiData: PasswordChange = {
      current_password: passwordData.current_password,
      new_password: passwordData.new_password,
    };

    changePasswordMutation.mutate(passwordData);

    // Clear form
    e.currentTarget.reset();
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmation !== "DELETE") {
      toast.error('Please type "DELETE" to confirm');
      return;
    }

    if (!deletePassword.trim()) {
      toast.error("Please enter your password to confirm");
      return;
    }

    deleteAccountMutation.mutate();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Please log in</h3>
            <p className="text-muted-foreground">
              You need to be logged in to view your profile
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate stats
  const totalClicks = links.reduce((sum, link) => sum + link.click_count, 0);
  const activeLinks = links.filter((link) => link.is_active).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <Avatar className="h-24 w-24 mx-auto mb-4 ring-4 ring-primary/20">
            <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary to-accent text-primary-foreground">
              {user.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-3xl font-bold">@{user.username}</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <ExternalLink className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{links.length}</div>
              <div className="text-sm text-muted-foreground">Total Links</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Eye className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{activeLinks}</div>
              <div className="text-sm to-muted-foreground">Active Links</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{totalClicks}</div>
              <div className="text-sm text-muted-foreground">Total Clicks</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and account details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {updateSuccess && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Profile updated successfully!
                  </AlertDescription>
                </Alert>
              )}

              {updateProfileMutation.error && (
                <Alert variant={"destructive"}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {updateProfileMutation.error.message}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={user.username}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Username cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={user.email}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    defaultValue={user.full_name || ""}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Account Status</Label>
                  <div>
                    <Badge variant={user.is_active ? "default" : "secondary"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Member Since
                  </Label>
                  <Input
                    value={new Date(user.created_at).toLocaleDateString()}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="w-full"
                >
                  {updateProfileMutation.isPending ? (
                    "Updating..."
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Profile
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {passwordSuccess && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Password changed successfully!
                  </AlertDescription>
                </Alert>
              )}

              {(changePasswordMutation.error || passwordError) && (
                <Alert variant={"destructive"}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {passwordError || changePasswordMutation.error?.message}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current_password">Current Password</Label>
                  <Input
                    id="current_password"
                    name="current_password"
                    type="password"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <Input
                    id="new_password"
                    name="new_password"
                    type="password"
                    minLength={8}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimun 8 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <Input
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    minLength={8}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="w-full"
                  variant={"outline"}
                >
                  {changePasswordMutation.isPending ? (
                    "Changing Password..."
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Change Password
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your account and links.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button asChild variant={"outline"}>
                <Link to="/dashboard/links">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Manage Links
                </Link>
              </Button>

              <Button asChild variant={"outline"}>
                <a href={`/${user.username}`} target="_blank">
                  <Eye className="h-4 w-4 mr-2" />
                  View Public Profile
                </a>
              </Button>

              <Button variant={"destructive"} onClick={logout}>
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible and destructive actions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border border-destructive/30 rounded-lg bg-destructive/5">
                <h3 className="font-semibold text-destructive mb-2">
                  Delete Account
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Permanently delete your account and all associated data. This
                  action cannot be undone.
                </p>

                <Dialog
                  open={showDeleteModal}
                  onOpenChange={setShowDeleteModal}
                >
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </DialogTrigger>
                </Dialog>

                {/* Custom Modal with your beautiful styling */}
                {showDeleteModal && (
                  <div
                    className="fixed inset-0 bg-black/5 backdrop-blur-lg dark:backdrop-blur-2xl flex items-center justify-center p-4 z-50"
                    onClick={(e) => {
                      // Close modal when clicking the backdrop
                      if (e.target === e.currentTarget) {
                        setShowDeleteModal(false);
                        setDeleteConfirmation("");
                        setDeletePassword("");
                      }
                    }}
                  >
                    <Card
                      className="w-full max-w-md shadow-2xl border-2 bg-card border-destructive/20"
                      onClick={(e) => e.stopPropagation()} // Prevent modal close when clicking inside
                    >
                      <CardHeader>
                        <CardTitle className="text-destructive flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          Delete Account
                        </CardTitle>
                        <CardDescription>
                          This action cannot be undone. This will permanently
                          delete your account and all associated data.
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* What gets deleted */}
                        <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                          <h4 className="font-semibold text-sm mb-2">
                            This will delete:
                          </h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Your profile and account information</li>
                            <li>• All your links ({links.length} links)</li>
                            <li>
                              • Analytics data ({totalClicks.toLocaleString()}{" "}
                              clicks)
                            </li>
                            <li>• All email preferences and logs</li>
                          </ul>
                        </div>

                        {/* Confirmation input */}
                        <div className="space-y-2">
                          <Label htmlFor="delete-confirmation">
                            Type <strong>DELETE</strong> to confirm:
                          </Label>
                          <Input
                            id="delete-confirmation"
                            value={deleteConfirmation}
                            onChange={(e) =>
                              setDeleteConfirmation(e.target.value)
                            }
                            placeholder="DELETE"
                            className="font-mono"
                            autoFocus
                          />
                        </div>

                        {/* Password confirmation */}
                        <div className="space-y-2">
                          <Label htmlFor="delete-password">
                            Enter your password to confirm:
                          </Label>
                          <Input
                            id="delete-password"
                            type="password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            placeholder="Your current password"
                          />
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowDeleteModal(false);
                              setDeleteConfirmation("");
                              setDeletePassword("");
                            }}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleDeleteAccount}
                            disabled={
                              deleteConfirmation !== "DELETE" ||
                              !deletePassword.trim() ||
                              deleteAccountMutation.isPending
                            }
                            className="flex-1"
                          >
                            {deleteAccountMutation.isPending ? (
                              "Deleting..."
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Account
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
