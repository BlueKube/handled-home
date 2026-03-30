import type { LucideIcon } from "lucide-react";
import {
  Gauge, ListChecks, AlertTriangle, Users, DollarSign,
  Wallet, Map, Package, Layers, HelpCircle,
  TrendingUp, Shield, Lock, BookOpen, GraduationCap,
} from "lucide-react";
import type { TrainingSection } from "@/components/academy/AcademySection";

export interface AcademyModule {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  estimatedMinutes: number;
  category: "daily-ops" | "weekly-ops" | "setup" | "reactive" | "governance" | "onboarding";
  sections: TrainingSection[];
}

export const ACADEMY_CATEGORIES = {
  "daily-ops": { label: "Daily Operations", description: "Pages you'll use every day" },
  "weekly-ops": { label: "Weekly Operations", description: "Pages you'll use weekly" },
  "setup": { label: "Setup & Configuration", description: "Configure once, revisit quarterly" },
  "reactive": { label: "Reactive Operations", description: "Respond to issues and growth" },
  "governance": { label: "Governance & Control", description: "Senior operators and superusers" },
  "onboarding": { label: "Getting Started", description: "Your first week on the job" },
} as const;

export type AcademyCategory = keyof typeof ACADEMY_CATEGORIES;

/*
 * Module definitions.
 * Each module starts with an empty sections array.
 * Content PRDs (028–042) populate the sections.
 */
export const ACADEMY_MODULES: AcademyModule[] = [
  {
    id: "ops-cockpit",
    title: "Ops Cockpit & Daily Rhythm",
    subtitle: "Your morning dashboard, health gauges, dispatcher queues, and the daily ops routine that keeps everything running smoothly.",
    icon: Gauge,
    estimatedMinutes: 25,
    category: "daily-ops",
    sections: [],
  },
  {
    id: "jobs-scheduling",
    title: "Jobs & Scheduling Operations",
    subtitle: "The 14-day planner, assignment engine, service days, weather mode, and everything that turns routines into provider routes.",
    icon: ListChecks,
    estimatedMinutes: 35,
    category: "daily-ops",
    sections: [],
  },
  {
    id: "exception-management",
    title: "Exception Management",
    subtitle: "Triage, resolve, and learn from operational exceptions. The difference between firefighting and fire prevention.",
    icon: AlertTriangle,
    estimatedMinutes: 20,
    category: "daily-ops",
    sections: [],
  },
  {
    id: "provider-lifecycle",
    title: "Provider Lifecycle",
    subtitle: "From application to active to probation — managing the people who deliver the service your brand promises.",
    icon: Users,
    estimatedMinutes: 30,
    category: "weekly-ops",
    sections: [],
  },
  {
    id: "customer-billing",
    title: "Customer Billing & Ledgers",
    subtitle: "Subscriptions, invoices, credits, refunds, and the dunning ladder. Understanding where the money comes from.",
    icon: DollarSign,
    estimatedMinutes: 20,
    category: "weekly-ops",
    sections: [],
  },
  {
    id: "provider-payouts",
    title: "Provider Payouts & Money",
    subtitle: "Earnings, holds, thresholds, and payout day. Understanding where the money goes.",
    icon: Wallet,
    estimatedMinutes: 20,
    category: "weekly-ops",
    sections: [],
  },
  {
    id: "zones-markets",
    title: "Zones, Capacity & Market Launch",
    subtitle: "Territory design, H3 hex grids, zone health, capacity planning, and the zone lifecycle from planning to live.",
    icon: Map,
    estimatedMinutes: 30,
    category: "weekly-ops",
    sections: [],
  },
  {
    id: "sku-catalog",
    title: "SKU Catalog Management",
    subtitle: "Service definitions, duration calibration, proof requirements, and why getting SKUs right prevents 80% of downstream problems.",
    icon: Package,
    estimatedMinutes: 25,
    category: "setup",
    sections: [],
  },
  {
    id: "plans-bundles",
    title: "Plans, Bundles & Entitlements",
    subtitle: "Subscription plan design, the handle economy, entitlement versioning, and why fewer plans is almost always better.",
    icon: Layers,
    estimatedMinutes: 25,
    category: "setup",
    sections: [],
  },
  {
    id: "support-operations",
    title: "Support Operations",
    subtitle: "Tickets, SLAs, macros, and the art of resolving issues without making them worse.",
    icon: HelpCircle,
    estimatedMinutes: 20,
    category: "reactive",
    sections: [],
  },
  {
    id: "growth-incentives",
    title: "Growth & Incentives",
    subtitle: "Referral programs, BYOC/BYOP funnels, fraud detection, and knowing when growth is healthy vs. when it's burning money.",
    icon: TrendingUp,
    estimatedMinutes: 20,
    category: "reactive",
    sections: [],
  },
  {
    id: "governance-health",
    title: "Governance & System Health",
    subtitle: "Audit logs, cron health, notifications, feature toggles, and launch readiness. The control panel for the control panel.",
    icon: Shield,
    estimatedMinutes: 25,
    category: "governance",
    sections: [],
  },
  {
    id: "control-room",
    title: "Control Room (Superuser)",
    subtitle: "Pricing overrides, payout rules, change requests, and the audit trail. Power tools with guardrails.",
    icon: Lock,
    estimatedMinutes: 20,
    category: "governance",
    sections: [],
  },
  {
    id: "sops-playbooks",
    title: "SOPs & Playbooks",
    subtitle: "Standard operating procedures, daily checklists, and incident response. When to follow the script and when to escalate.",
    icon: BookOpen,
    estimatedMinutes: 15,
    category: "governance",
    sections: [],
  },
  {
    id: "first-week",
    title: "Your First Week",
    subtitle: "A structured 5-day onboarding plan that takes you from 'what does this button do?' to running daily ops with confidence.",
    icon: GraduationCap,
    estimatedMinutes: 45,
    category: "onboarding",
    sections: [],
  },
];
