export type Lead = {
  id: string;
  email: string;
  phone: string | null;
  zip_code: string;
  categories: string[];
  source: string;
  status: string;
  notes: string | null;
  created_at: string;
  notified_at: string | null;
};

export type Referral = {
  id: string;
  referrer_email: string;
  referred_name: string;
  referred_contact: string;
  referred_category: string;
  zip_code: string;
  status: string;
  created_at: string;
};

export type CustomerLead = {
  id: string;
  email: string;
  phone: string | null;
  zip_code: string;
  source: string;
  status: string;
  notify_on_launch: boolean;
  notified_at: string | null;
  created_at: string;
};

export const LEAD_STATUS_OPTIONS = ["all", "new", "contacted", "applied", "declined", "notified"] as const;
export const REFERRAL_STATUS_OPTIONS = ["all", "new", "contacted", "applied", "declined"] as const;
export const CUSTOMER_STATUS_OPTIONS = ["all", "new", "contacted", "notified", "subscribed", "declined"] as const;

export const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  contacted: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  applied: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  declined: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  notified: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  subscribed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
};
