import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { useAuth } from "~/lib/auth";
import {
  apiClient,
  type LinkCreate,
  type LinkUpdate,
  type Link,
} from "~/lib/api";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Badge } from "~/components/ui/badge";
import { Switch } from "~/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  BarChart3,
  GripVertical,
  Eye,
  EyeOff,
} from "lucide-react";
import { IconPicker } from "~/components/IconPicker";
import { toast } from "sonner";
import { cn } from "~/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export const Route = createFileRoute("/dashboard/links")({
  component: LinksManagementPage,
});

// ===== CONSTANTS =====
const QUERY_CONFIG = {
  staleTime: 30 * 1000, // 30 seconds
  retry: 1,
} as const;

const DRAG_ACTIVATION_DISTANCE = 8; // pixels

const SWITCH_STYLES =
  "border border-primary [&>span]:bg-[color:var(--card)] [&>span]:border-[color:var(--border)] data-[state=checked]:bg-[var(--primary)] data-[state=unchecked]:bg-[color:var(--muted)] data-[state=checked]:[&>span]:bg-[color:var(--card)] data-[state=unchecked]:[&>span]:bg-[color:var(--muted-foreground)]";

// ===== TYPES =====
interface SortableLinkItemProps {
  link: Link;
  onEdit: (link: Link) => void;
  onToggleActive: (id: number, isActive: boolean) => void;
  onDelete: (id: number) => void;
}

interface LinkFormData {
  title: string;
  url: string;
  description?: string;
  is_active: boolean;
  icon?: string;
}

// ===== UTILITY FUNCTIONS =====
const sortLinksByOrder = (links: Link[]) => {
  return links.sort((a, b) => a.display_order - b.display_order);
};

const getMaxDisplayOrder = (links: Link[]) => {
  return Math.max(...links.map((l) => l.display_order), -1);
};

const extractFormData = (formData: FormData): LinkFormData => ({
  title: formData.get("title") as string,
  url: formData.get("url") as string,
  description: (formData.get("description") as string) || undefined,
  is_active: formData.get("is_active") === "on",
});

const confirmDelete = () => {
  return window.confirm("Are you sure you want to delete this link?");
};

// ===== COMPONENTS =====
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 bg-muted animate-pulse rounded" />
      <div className="space-y-4">
        {Array.from({ length: 3 }, (_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-muted animate-pulse rounded" />
                <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EmptyLinksState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold">No links yet</h3>
        <p className="text-muted-foreground mb-6">
          Get started by creating your first link
        </p>
        <Button onClick={onCreateClick} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Your First Link
        </Button>
      </CardContent>
    </Card>
  );
}

function SortableLinkItem({
  link,
  onEdit,
  onToggleActive,
  onDelete,
}: SortableLinkItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDelete = useCallback(() => {
    if (confirmDelete()) {
      onDelete(link.id);
    }
  }, [link.id, onDelete]);

  const handleToggleActive = useCallback(() => {
    onToggleActive(link.id, !link.is_active);
  }, [link.id, link.is_active, onToggleActive]);

  const handleEdit = useCallback(() => {
    onEdit(link);
  }, [link, onEdit]);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        !link.is_active && "opacity-60",
        isDragging && "shadow-lg ring-2 ring-primary/20 z-50"
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <button
                className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted transition-colors"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </button>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{link.title}</h3>
                {!link.is_active && (
                  <Badge variant={"secondary"} className="text-xs">
                    Hidden
                  </Badge>
                )}
              </div>
            </div>

            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1 mb-2 ml-9"
            >
              {link.url}
              <ExternalLink className="h-3 w-3" />
            </a>

            {link.description && (
              <p className="text-sm text-muted-foreground mb-3 ml-9">
                {link.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground ml-9">
              <div className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                {link.click_count} clicks
              </div>
              <div>Order: {link.display_order}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <Button variant={"ghost"} size={"sm"} onClick={handleToggleActive}>
              {link.is_active ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LinkForm({
  onSubmit,
  onCancel,
  initialData,
  isLoading,
  submitLabel,
  selectedIcon,
  onIconSelect,
}: {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  initialData?: Link;
  isLoading: boolean;
  submitLabel: string;
  selectedIcon?: string;
  onIconSelect: (icon?: string) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${initialData ? "edit-" : ""}title`}>Title</Label>
        <Input
          id={`${initialData ? "edit-" : ""}title`}
          name="title"
          placeholder="My Website"
          defaultValue={initialData?.title}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${initialData ? "edit-" : ""}url`}>URL</Label>
        <Input
          id={`${initialData ? "edit-" : ""}url`}
          name="url"
          type="url"
          placeholder="https://example.com"
          defaultValue={initialData?.url}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${initialData ? "edit-" : ""}description`}>
          Description (Optional)
        </Label>
        <Textarea
          id={`${initialData ? "edit-" : ""}description`}
          name="description"
          placeholder="A brief description of your link"
          defaultValue={initialData?.description || ""}
          rows={3}
        />
      </div>

      <IconPicker selectedIcon={selectedIcon} onIconSelect={onIconSelect} />

      <div className="flex items-center space-x-2">
        <Switch
          id={`${initialData ? "edit-" : ""}is_active`}
          name="is_active"
          defaultChecked={initialData?.is_active ?? true}
          className={SWITCH_STYLES}
        />
        <Label htmlFor={`${initialData ? "edit-" : ""}is_active`}>
          Make link visible
        </Label>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? `${submitLabel.slice(0, -1)}ing...` : submitLabel}
        </Button>
        <Button type="button" variant={"outline"} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function ReorderStatusIndicator() {
  return (
    <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg">
      Saving new order...
    </div>
  );
}

function LinksManagementPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ===== STATE =====
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [createIcon, setCreateIcon] = useState<string | undefined>(undefined);
  const [editIcon, setEditIcon] = useState<string | undefined>(undefined);

  // ===== DRAG & DROP SETUP =====
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before starting drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  // ===== MUTATIONS =====
  const createMutation = useMutation({
    mutationFn: async (linkData: LinkCreate) => {
      const maxOrder = getMaxDisplayOrder(links);
      return apiClient.createLink({ ...linkData, display_order: maxOrder + 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
      setIsCreateOpen(false);
      setCreateIcon(undefined);
      toast.success("Link created successfully!");
    },
    onError: (error) => {
      toast.error("Failed to create link", {
        description: error.message,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: LinkUpdate }) =>
      apiClient.updateLink(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
      setEditingLink(null);
      setEditIcon(undefined);
      toast.success("Link updated successfully");
    },
    onError: (error) =>
      toast.error("Failed to update link", {
        description: error.message,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: apiClient.deleteLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
      toast.success("Link deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete link", {
        description: error.message,
      });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (reorderedLinks: Link[]) => {
      const updates = reorderedLinks.map((link, index) =>
        apiClient.updateLink(link.id, { display_order: index })
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
      toast.success("Links reordered successfully");
    },
    onError: (error) => {
      toast.error("Failed to reorder links", {
        description: error.message,
      });
    },
  });

  // ===== EVENT HANDLERS =====
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = links.findIndex((link) => link.id === active.id);
        const newIndex = links.findIndex((link) => link.id === over.id);
        const reorderedLinks = arrayMove(links, oldIndex, newIndex);

        // Optimistically update the cache
        queryClient.setQueryData(["links", user?.id], reorderedLinks);

        // Send updates to server
        reorderMutation.mutate(reorderedLinks);
      }
    },
    [links, queryClient, user?.id, reorderMutation]
  );

  const handleCreate = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const linkData = {
        ...extractFormData(formData),
        display_order: 0, // Will be updated in the mutation
        icon: createIcon,
      };
      createMutation.mutate(linkData);
    },
    [createIcon, createMutation]
  );

  const handleUpdate = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!editingLink) return;

      const formData = new FormData(e.currentTarget);
      const linkData = {
        ...extractFormData(formData),
        icon: editIcon,
      };
      updateMutation.mutate({ id: editingLink.id, data: linkData });
    },
    [editingLink, editIcon, updateMutation]
  );

  const handleToggleActive = useCallback(
    (id: number, is_active: boolean) => {
      updateMutation.mutate({ id, data: { is_active } });
    },
    [updateMutation]
  );

  const handleEditOpen = useCallback((link: Link) => {
    setEditingLink(link);
    setEditIcon(link.icon);
  }, []);

  const handleDelete = useCallback(
    (id: number) => {
      deleteMutation.mutate(id);
    },
    [deleteMutation]
  );

  const openCreateDialog = useCallback(() => {
    setIsCreateOpen(true);
  }, []);

  const closeCreateDialog = useCallback(() => {
    setIsCreateOpen(false);
    setCreateIcon(undefined);
  }, []);

  const closeEditDialog = useCallback(() => {
    setEditingLink(null);
    setEditIcon(undefined);
  }, []);

  // ===== RENDER CONDITIONS =====
  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Links</h1>
          <p className="text-muted-foreground mt-2">
            Create and organize your links
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Link
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-[color:var(--background)] border shadow-xl">
            <DialogHeader>
              <DialogTitle>Create New Link</DialogTitle>
              <DialogDescription>
                Add a new link to your profile
              </DialogDescription>
            </DialogHeader>
            <LinkForm
              onSubmit={handleCreate}
              onCancel={closeCreateDialog}
              isLoading={createMutation.isPending}
              submitLabel="Create Link"
              selectedIcon={createIcon}
              onIconSelect={setCreateIcon}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* ===== LINKS LIST ===== */}
      {links.length === 0 ? (
        <EmptyLinksState onCreateClick={openCreateDialog} />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={links.map((l) => l.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {links.map((link) => (
                <SortableLinkItem
                  key={link.id}
                  link={link}
                  onEdit={handleEditOpen}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* ===== STATUS INDICATORS ===== */}
      {reorderMutation.isPending && <ReorderStatusIndicator />}

      {/* ===== EDIT DIALOG ===== */}
      <Dialog open={!!editingLink} onOpenChange={closeEditDialog}>
        <DialogContent className="sm:max-w-md bg-[color:var(--background)] border shadow-xl">
          <DialogHeader>
            <DialogTitle>Edit Link</DialogTitle>
            <DialogDescription>Update your link details</DialogDescription>
          </DialogHeader>
          {editingLink && (
            <LinkForm
              onSubmit={handleUpdate}
              onCancel={closeEditDialog}
              initialData={editingLink}
              isLoading={updateMutation.isPending}
              submitLabel="Update Link"
              selectedIcon={editIcon}
              onIconSelect={setEditIcon}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
