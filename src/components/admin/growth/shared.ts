export const STATES = ["CLOSED", "WAITLIST_ONLY", "PROVIDER_RECRUITING", "SOFT_LAUNCH", "OPEN", "PROTECT_QUALITY"] as const;

export const STATE_COLORS: Record<string, string> = {
  CLOSED: "bg-muted text-muted-foreground",
  WAITLIST_ONLY: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  PROVIDER_RECRUITING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  SOFT_LAUNCH: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  OPEN: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  PROTECT_QUALITY: "bg-destructive/10 text-destructive",
};

export const HEALTH_COLORS: Record<string, string> = {
  stable: "text-green-600 dark:text-green-400",
  tight: "text-amber-600 dark:text-amber-400",
  risk: "text-destructive",
};

export interface ZoneTabProps {
  selectedZone: string;
  setSelectedZone: (v: string) => void;
}
