import { AppRole } from "@/contexts/AuthContext";

export const ROLE_PRIORITY: AppRole[] = ["customer", "provider", "admin"];

export const STORAGE_KEYS = {
  ACTIVE_ROLE: "handled_active_role",
} as const;
