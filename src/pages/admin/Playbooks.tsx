import { useState, useMemo } from "react";
import { useAdminMembership, type AdminRole } from "@/hooks/useAdminMembership";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, CheckSquare, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

/* ── SOP metadata + content ── */
interface Playbook {
  id: string;
  title: string;
  allowedRoles: AdminRole[];
  checklist: string;
  steps: PlaybookStep[];
}

interface PlaybookStep {
  title: string;
  body: string;
  links?: { label: string; url: string }[];
  subSteps?: string[];
}

const PLAYBOOKS: Playbook[] = [
  {
    id: "eod-reconciliation",
    title: "End-of-Day Reconciliation",
    allowedRoles: ["dispatcher", "ops", "superuser"],
    checklist: "Verify all jobs completed, proof uploaded, no-shows flagged, exceptions resolved",
    steps: [
      {
        title: "Open Dispatcher Queues",
        body: "Navigate to the dispatcher queues and review all tabs.",
        links: [{ label: "Dispatcher Queues", url: "/admin/ops/dispatch" }],
      },
      {
        title: 'Check "At Risk" tab',
        body: "Any remaining jobs must be resolved. If provider is running late, contact and extend or reassign. If customer cancelled same-day, mark as cancelled with reason.",
      },
      {
        title: 'Check "Missing Proof" tab',
        body: "Every completed job needs photos. Send reminder to provider. If 2+ hours past completion, escalate to ops manager.",
      },
      {
        title: 'Check "Unassigned" tab',
        body: "Should be zero by end of day. Trigger backup assignment or notify customer of reschedule.",
      },
      {
        title: "Review Exceptions",
        body: "Resolve any open exceptions from today. Add resolution notes for audit trail.",
        links: [{ label: "Exceptions", url: "/admin/exceptions" }],
      },
      {
        title: "Verify Tomorrow's Coverage",
        body: "Any zones with 0 assigned providers need immediate attention.",
      },
    ],
  },
  {
    id: "missing-proof",
    title: "Missing Proof Handling",
    allowedRoles: ["dispatcher", "ops", "superuser"],
    checklist: "Identify missing proof, notify provider, escalate if unresolved, apply payout hold",
    steps: [
      {
        title: "Identify missing proof",
        body: 'Open Dispatcher Queues → "Missing Proof" tab.',
        links: [{ label: "Dispatcher Queues", url: "/admin/ops/dispatch" }],
      },
      {
        title: "Check time since completion",
        body: "Apply escalation timeline based on hours elapsed.",
        subSteps: [
          "< 1 hour: No action needed",
          "1–2 hours: Send push notification reminder",
          "2–4 hours: Send second reminder + SMS",
          "4+ hours: Escalate to ops",
        ],
      },
      {
        title: "Review job details",
        body: "Verify the job was actually completed (check arrived_at, departed_at). Check if photos were uploaded but failed validation.",
      },
      {
        title: "Apply payout hold if unresponsive",
        body: "After 4 hours with no proof: place payout on hold, add internal note, create support ticket if customer disputes quality.",
      },
    ],
  },
  {
    id: "no-show-escalation",
    title: "No-Show Escalation",
    allowedRoles: ["dispatcher", "ops", "superuser"],
    checklist: "Detect no-show, notify customer, reassign job, log incident, update provider score",
    steps: [
      {
        title: "Detection",
        body: 'System flags jobs where latest_start_by has passed with no arrived_at. Auto-appears in "At Risk" tab.',
        links: [{ label: "Dispatcher Queues", url: "/admin/ops/dispatch" }],
      },
      {
        title: "Attempt contact (within 15 min)",
        body: "Call/message provider. If they respond with ETA, update window and notify customer. If no response, proceed to reassign.",
        links: [{ label: "Provider List", url: "/admin/providers" }],
      },
      {
        title: "Reassign to backup provider",
        body: 'Use "Reassign" action in dispatcher queue. System auto-selects backup for zone+category.',
      },
      {
        title: "Notify customer",
        body: 'Auto-notification: "Your provider is running late. We\'ve assigned a new crew." If no reassignment possible, offer reschedule.',
      },
      {
        title: "Log the incident",
        body: "Create job issue: type = no_show, severity = high. Feeds into provider quality score automatically.",
      },
      {
        title: "Provider accountability",
        body: "1st no-show: Warning. 2nd (within 30 days): -15 points. 3rd: Trigger probation review.",
      },
    ],
  },
  {
    id: "provider-probation",
    title: "Provider Probation Ladder",
    allowedRoles: ["ops", "superuser"],
    checklist: "Review quality score, issue warning, apply probation, suspend if unresolved",
    steps: [
      {
        title: "Identify at-risk providers",
        body: "Review providers sorted by quality score. < 70: Watch list. < 50: Probation candidate. < 30: Suspension candidate.",
        links: [{ label: "Provider List", url: "/admin/providers" }],
      },
      {
        title: "Step 1 — Written Warning (Score 50–70)",
        body: "Send notification with improvement areas. Document in provider notes. Set 14-day review window.",
      },
      {
        title: "Step 2 — Formal Probation (Score < 50)",
        body: "Reduce job assignment priority. Send formal notice with targets. 30-day probation period.",
      },
      {
        title: "Step 3 — Restricted Service",
        body: "Limit to existing customers only. Weekly quality review. 14-day restricted period.",
      },
      {
        title: "Step 4 — Suspension (Score < 30)",
        body: "Remove from all assignments. Reassign pending jobs. Notify affected customers. Superuser approval required.",
      },
    ],
  },
  {
    id: "zone-pause",
    title: "Zone Pause Workflow",
    allowedRoles: ["ops", "superuser"],
    checklist: "Assess reason, notify stakeholders, pause zone, monitor, reactivate",
    steps: [
      {
        title: "Assess the situation",
        body: "Check zone detail for provider availability, active subscriptions, and pending jobs.",
        links: [{ label: "Zone List", url: "/admin/zones" }],
      },
      {
        title: "Determine pause type",
        body: "Weather pause (1–3 days), Capacity pause (1–2 weeks), or Full pause (indefinite, superuser only).",
      },
      {
        title: "Execute pause",
        body: 'Set zone status to "paused" with required reason. System auto-cancels/reschedules affected jobs.',
      },
      {
        title: "Notify stakeholders",
        body: "Customers and providers get notifications with reason and expected resume date.",
      },
      {
        title: "Monitor and reactivate",
        body: 'Check daily for resolution. Set zone back to "active" when ready. System generates catch-up jobs if applicable.',
      },
    ],
  },
  {
    id: "emergency-pricing",
    title: "Emergency Pricing Override",
    allowedRoles: ["superuser"],
    checklist: "Identify issue, document reason, apply override, verify impact, set expiry",
    steps: [
      {
        title: "Document before acting",
        body: "Note current pricing for affected SKUs/zones. Write clear reason.",
        links: [{ label: "Change Log", url: "/admin/control/change-log" }],
      },
      {
        title: "Apply the override",
        body: "Select affected zones, adjust multiplier or SKU-specific override, set effective date.",
        links: [{ label: "Pricing & Margin", url: "/admin/control/pricing" }],
      },
      {
        title: "Verify impact",
        body: "Check affected subscription count, review projected revenue impact, confirm no unintended changes.",
      },
      {
        title: "Set expiry if temporary",
        body: "Note expiry date, create reminder to revert. Use rollback feature when ready.",
      },
      {
        title: "Communicate",
        body: "Price decrease: No notification needed. Price increase: Requires 30-day notice per terms.",
      },
    ],
  },
  {
    id: "growth-zone-launch",
    title: "Growth Manager Zone Launch",
    allowedRoles: ["ops", "superuser"],
    checklist: "Validate readiness, seed capacity, activate zone, notify waitlist, monitor first week",
    steps: [
      {
        title: "Pre-launch readiness check",
        body: "Verify zone has at least 1 Primary provider with approved coverage, active capabilities, and passing compliance. Confirm capacity rows exist for default service day.",
        links: [{ label: "Zone List", url: "/admin/zones" }],
      },
      {
        title: "Seed initial capacity",
        body: "Set max_homes per day based on provider commitment. Start conservative (10-15 homes). Enable buffer_percent at 10%.",
        links: [{ label: "Service Days", url: "/admin/service-days" }],
      },
      {
        title: "Activate zone",
        body: 'Set zone status to "active". Verify it appears in customer-facing zone lookup. Confirm SKU pricing is configured.',
      },
      {
        title: "Notify waitlist",
        body: "Run waitlist notification for the zone. Monitor signup conversion over 48 hours.",
        links: [{ label: "Growth Dashboard", url: "/admin/growth" }],
      },
      {
        title: "Monitor first week",
        body: "Check daily: assignment success rate, proof compliance, customer issues. Escalate if issue rate > 10% or assignment failures > 0.",
        links: [{ label: "Ops Cockpit", url: "/admin/ops" }],
      },
    ],
  },
  {
    id: "byoc-close-checklist",
    title: "BYOC Close Checklist",
    allowedRoles: ["ops", "superuser"],
    checklist: "Verify attribution, confirm subscription, activate bonus window, track first visit",
    steps: [
      {
        title: "Verify attribution record",
        body: "Confirm byoc_attribution exists with correct provider_org_id and customer_id. Check invite_code matches the provider's referral code.",
        links: [{ label: "Growth Dashboard", url: "/admin/growth" }],
      },
      {
        title: "Confirm customer subscription",
        body: "Verify customer has active subscription. Update attribution status from 'invited' to 'subscribed'. Set subscribed_at timestamp.",
      },
      {
        title: "Activate bonus window",
        body: "Once first visit completes, attribution moves to 'active'. Bonus window starts (typically 12 weeks). Verify bonus_start_at and bonus_end_at are set.",
      },
      {
        title: "Monitor bonus accrual",
        body: "Weekly BYOC bonuses should appear in byoc_bonus_ledger. Verify amounts match configured rates. Check no duplicate entries.",
      },
      {
        title: "Handle disputes",
        body: "If provider claims missing attribution: check invite timestamps, verify customer used correct code, review referral_code on attribution record.",
      },
    ],
  },
  {
    id: "coverage-exception-approvals",
    title: "Coverage Exception Approvals",
    allowedRoles: ["ops", "superuser"],
    checklist: "Review request, verify provider capacity, check zone needs, approve/deny with reason",
    steps: [
      {
        title: "Review incoming request",
        body: "Check provider_coverage record with status REQUESTED. Review which zone and what categories the provider wants to cover.",
        links: [{ label: "Provider List", url: "/admin/providers" }],
      },
      {
        title: "Verify provider readiness",
        body: "Check: quality score > 60, no active probation, required capabilities enabled, compliance docs current. If any fail, deny with specific reason.",
      },
      {
        title: "Assess zone need",
        body: "Does the zone need another provider? Check capacity utilization, current provider count, and any coverage gaps. Surplus providers create scheduling conflicts.",
      },
      {
        title: "Approve or deny",
        body: "Approve: set request_status to APPROVED. Creates zone_category_providers entry as Backup. Deny: set to DENIED with clear reason for provider notification.",
      },
      {
        title: "Post-approval monitoring",
        body: "Monitor new provider's first 2 weeks: completion rate, proof compliance, customer feedback. Apply standard probation ladder if issues arise.",
      },
    ],
  },
  {
    id: "payout-hold-escalation",
    title: "Payout/Hold Escalation",
    allowedRoles: ["superuser"],
    checklist: "Identify held payouts, review hold reason, verify resolution, release or escalate",
    steps: [
      {
        title: "Identify held earnings",
        body: "Review provider_earnings with status HELD or HELD_UNTIL_READY. Group by provider org to see total held amount.",
        links: [{ label: "Payouts", url: "/admin/payouts" }],
      },
      {
        title: "Review hold reason",
        body: "Check associated job issues, missing proof, or payout account status. HELD_UNTIL_READY means Stripe Connect not fully set up.",
      },
      {
        title: "Contact provider if needed",
        body: "For holds > 7 days: send notification reminder. For holds > 14 days: direct outreach. Document all contact attempts in job events.",
      },
      {
        title: "Release or maintain hold",
        body: "If issue resolved (proof uploaded, issue closed): update earning status to ELIGIBLE. If payout account now ready: batch release all HELD_UNTIL_READY earnings.",
      },
      {
        title: "Escalation path",
        body: "Holds > 30 days with unresolved issues: create billing_exception with severity HIGH. Include total held amount and days held in exception metadata.",
        links: [{ label: "Exceptions", url: "/admin/exceptions" }],
      },
    ],
  },
];

/* ── Expandable playbook card ── */
function PlaybookCard({ playbook }: { playbook: Playbook }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="overflow-hidden">
      <CardHeader
        className="cursor-pointer hover:bg-muted/30 transition-colors py-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <div>
              <CardTitle className="text-base">{playbook.title}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                <CheckSquare className="h-3 w-3" />
                {playbook.checklist}
              </p>
            </div>
          </div>
          <div className="flex gap-1.5">
            {playbook.allowedRoles.map((role) => (
              <Badge key={role} variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                {role}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 pb-4">
          <ol className="space-y-4">
            {playbook.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{step.body}</p>
                  {step.subSteps && (
                    <ul className="mt-2 space-y-1 ml-3">
                      {step.subSteps.map((sub, j) => (
                        <li key={j} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground shrink-0" />
                          {sub}
                        </li>
                      ))}
                    </ul>
                  )}
                  {step.links && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {step.links.map((link) => (
                        <Link
                          key={link.url}
                          to={link.url}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      )}
    </Card>
  );
}

/* ── Main page ── */
const ROLE_TABS: { key: AdminRole | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "dispatcher", label: "Dispatcher" },
  { key: "ops", label: "Ops" },
  { key: "superuser", label: "Superuser" },
];

export default function Playbooks() {
  const { adminRole } = useAdminMembership();
  const [roleFilter, setRoleFilter] = useState<AdminRole | "all">("all");

  const filtered = useMemo(() => {
    let result = PLAYBOOKS;
    // Filter by user's own role visibility
    if (adminRole) {
      result = result.filter((p) => p.allowedRoles.includes(adminRole));
    }
    // Then apply tab filter
    if (roleFilter !== "all") {
      result = result.filter((p) => p.allowedRoles.includes(roleFilter));
    }
    return result;
  }, [adminRole, roleFilter]);

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-h2 mb-0.5 flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Playbooks & SOPs
        </h1>
        <p className="text-caption">
          Standard operating procedures for consistent, high-quality operations.
        </p>
      </div>

      <Tabs value={roleFilter} onValueChange={(v) => setRoleFilter(v as AdminRole | "all")}>
        <TabsList>
          {ROLE_TABS.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key} className="capitalize text-xs">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No playbooks available for this role.</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((p) => <PlaybookCard key={p.id} playbook={p} />)
        )}
      </div>
    </div>
  );
}
