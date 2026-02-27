import {
  Scissors,
  Leaf,
  Droplets,
  Sparkles,
  Bug,
  PawPrint,
  Waves,
  Wind,
  Trees,
  Home,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_LABELS: Record<string, string> = {
  mowing: "Lawn Care",
  trimming: "Trimming & Hedges",
  cleanup: "Cleanup & Debris",
  treatment: "Lawn Treatment",
  pool: "Pool Care",
  power_wash: "Power Washing",
  windows: "Window Cleaning",
  pest: "Pest Control",
  pet_waste: "Pet Waste",
  home_assistant: "Home Assistant",
};

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  mowing: Leaf,
  trimming: Scissors,
  cleanup: Wind,
  treatment: Droplets,
  pool: Waves,
  power_wash: Sparkles,
  windows: Sparkles,
  pest: Bug,
  pet_waste: PawPrint,
  home_assistant: Home,
};

/** Gradient fallbacks when no image is available */
export const CATEGORY_GRADIENTS: Record<string, string> = {
  mowing: "from-emerald-500 to-green-700",
  trimming: "from-lime-500 to-emerald-600",
  cleanup: "from-amber-500 to-orange-600",
  treatment: "from-teal-500 to-cyan-600",
  pool: "from-sky-400 to-blue-600",
  power_wash: "from-slate-400 to-slate-600",
  windows: "from-sky-300 to-blue-500",
  pest: "from-red-400 to-rose-600",
  pet_waste: "from-yellow-400 to-amber-500",
  home_assistant: "from-violet-400 to-purple-600",
};

export function getCategoryLabel(category: string | null | undefined): string {
  return category ? CATEGORY_LABELS[category] ?? category : "General";
}

export function getCategoryIcon(category: string | null | undefined): LucideIcon {
  return category ? CATEGORY_ICONS[category] ?? Trees : Trees;
}

export function getCategoryGradient(category: string | null | undefined): string {
  return category ? CATEGORY_GRADIENTS[category] ?? "from-muted to-muted-foreground/20" : "from-muted to-muted-foreground/20";
}

/** Ordered list of category keys for display grouping */
export const CATEGORY_ORDER = [
  "mowing",
  "trimming",
  "treatment",
  "cleanup",
  "pool",
  "power_wash",
  "windows",
  "pest",
  "pet_waste",
  "home_assistant",
];
