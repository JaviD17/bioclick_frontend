import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  // Popular social media icons
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Youtube,
  Twitch,
  Github,

  // Website & business icons
  Globe,
  ExternalLink,
  Briefcase,
  Building,
  Store,

  // Creative & media icons
  Music,
  Camera,
  Video,
  Palette,
  Mic,

  // Tech & tools icons
  Smartphone,
  Laptop,
  Code,
  Database,

  // Communication icons
  Mail,
  Phone,
  MessageCircle,

  // Other useful icons
  Heart,
  Star,
  Gift,
  Calendar,
  MapPin,
  Book,
  Gamepad2,
  Coffee,

  // Default fallback
  Link as LinkIcon,
} from "lucide-react";

// Icon mapping - maps strings names to React components
const ICON_MAP = {
  // Social Media
  instagram: Instagram,
  twitter: Twitter,
  facebook: Facebook,
  linkedin: Linkedin,
  youtube: Youtube,
  twitch: Twitch,
  github: Github,

  // Website & Business
  globe: Globe,
  "external-link": ExternalLink,
  briefcase: Briefcase,
  building: Building,
  store: Store,

  // Creative & Media
  music: Music,
  camera: Camera,
  video: Video,
  palette: Palette,
  mic: Mic,

  // Tech & Tools
  smartphone: Smartphone,
  laptop: Laptop,
  code: Code,
  database: Database,

  // Communication
  mail: Mail,
  phone: Phone,
  "message-circle": MessageCircle,

  // Other
  heart: Heart,
  star: Star,
  gift: Gift,
  calendar: Calendar,
  "map-pin": MapPin,
  book: Book,
  gamepad2: Gamepad2,
  coffee: Coffee,

  // Default
  link: LinkIcon,
} as const;

const AVAILABLE_ICONS = Object.keys(ICON_MAP);

// Icon categories for better organization
const ICON_CATEGORIES = {
  "Social Media": [
    "instagram",
    "twitter",
    "facebook",
    "linkedin",
    "youtube",
    "twitch",
    "github",
  ],
  "Website & Business": [
    "globe",
    "external-link",
    "briefcase",
    "building",
    "store",
  ],
  "Creative & Media": ["music", "camera", "video", "palette", "mic"],
  "Tech & Tools": ["smartphone", "laptop", "code", "database"],
  Communication: ["mail", "phone", "message-circle"],
  Other: [
    "heart",
    "star",
    "gift",
    "calendar",
    "map-pin",
    "book",
    "gamepad2",
    "coffee",
    "link",
  ],
} as const;

interface IconPickerProps {
  selectedIcon?: string;
  onIconSelect: (icon: string | undefined) => void;
  disabled?: boolean;
}

export function IconPicker({
  selectedIcon,
  onIconSelect,
  disabled,
}: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Get the selected icon component
  const SelectedIconComponent = selectedIcon
    ? ICON_MAP[selectedIcon as keyof typeof ICON_MAP]
    : null;

  // Filter icons based on search
  const filteredCategories = Object.entries(ICON_CATEGORIES).reduce(
    (acc, [category, icons]) => {
      const filtered = icons.filter((icon) =>
        icon.toLocaleLowerCase().includes(searchTerm.toLocaleLowerCase())
      );
      if (filtered.length > 0) {
        acc[category] = filtered;
      }
      return acc;
    },
    {} as Record<string, string[]>
  );

  const handleIconSelect = (icon: string) => {
    onIconSelect(icon);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = () => {
    onIconSelect(undefined);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="space-y-2">
      <Label>Icon (Optional)</Label>
      <div className="flex gap-2">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="flex-1 justify-start gap-2"
              disabled={disabled}
            >
              {SelectedIconComponent ? (
                <>
                  <SelectedIconComponent className="h-4 w-4" />
                  {selectedIcon}
                </>
              ) : (
                <>
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  Choose icon...
                </>
              )}
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto bg-[color:var(--background)]">
            <DialogHeader>
              <DialogTitle>Choose an Icon</DialogTitle>
              <DialogDescription>
                Select an icon to represent your link
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Search */}
              <Input
                placeholder="Search icons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              {/* Clear button */}
              {selectedIcon && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClear}
                  className="w-full"
                >
                  Remove Icon
                </Button>
              )}

              {/* Icon grid by category */}
              <div className="space-y-4">
                {Object.entries(filteredCategories).map(([category, icons]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                      {category}
                    </h4>
                    <div className="grid grid-cols-6 gap-2">
                      {icons.map((iconName) => {
                        const IconComponent =
                          ICON_MAP[iconName as keyof typeof ICON_MAP];
                        const isSelected = selectedIcon === iconName;

                        return (
                          <Button
                            key={iconName}
                            type="button"
                            variant={isSelected ? "default" : "ghost"}
                            size="sm"
                            className="h-10 w-10 p-0 bg-[color:var(--background)] hover:bg-[color:var(--muted)] border"
                            onClick={() => handleIconSelect(iconName)}
                            title={iconName}
                          >
                            <IconComponent className="h-4 w-4" />
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* No results */}
              {Object.keys(filteredCategories).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No icons found matching "{searchTerm}"
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Utility function to get icon component by name
export function getIconComponent(iconName?: string) {
  if (!iconName) return null;
  return ICON_MAP[iconName as keyof typeof ICON_MAP] || null;
}
