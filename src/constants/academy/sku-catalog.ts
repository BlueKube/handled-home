import type { TrainingSection } from "@/components/academy/AcademySection";

export const skuCatalogSections: TrainingSection[] = [
  {
    id: "overview",
    title: "What is a SKU and Why Does It Matter?",
    type: "overview",
    content: `A SKU (Service Keeping Unit) is the atomic unit of work in Handled Home. Every job, every invoice line item, every proof requirement, every scheduling rule traces back to a SKU. Getting SKUs right prevents 80% of downstream problems. Getting them wrong creates issues that ripple through scheduling, billing, provider satisfaction, and customer complaints.

A SKU defines: what the service is (lawn mowing, pest treatment, window cleaning), how long it takes, what proof the provider must submit, what the checklist includes, which levels/variants exist, and what it costs to deliver.

There are three admin pages for SKU management:

• SKUs — The catalog. Create, edit, search, and manage service definitions.
• SKU Calibration — Compare your configured durations and prices against real provider data. This is how you replace guesses with reality.
• Level Analytics — Track which service levels customers choose, where providers recommend level changes, and where courtesy upgrades happen.

The most important thing to understand: a SKU is a promise to both the customer AND the provider. The customer sees "Standard Lawn Mowing — 45 min" and expects a thorough job. The provider sees the same thing and expects to be done in 45 minutes at the promised pay rate. If the duration is wrong, the customer feels shortchanged or the provider feels underpaid. Both are relationship-ending.`,
  },
  {
    id: "sku-design",
    title: "SKU Design Principles",
    type: "text",
    content: `INCLUSIONS AND EXCLUSIONS MATTER MORE THAN YOU THINK

The #1 source of customer complaints in home services is scope ambiguity. "Lawn mowing" means different things to different people. To a customer, it might mean "mow, edge, blow, and trim the hedges." To a provider, it might mean "mow and blow." This gap creates disputes.

Every SKU should have explicit inclusions (what IS part of this service) and exclusions (what is NOT). "Standard Lawn Mowing includes: mow all grass areas, edge sidewalks and driveway, blow clean hard surfaces. Does NOT include: hedge trimming, weeding, leaf cleanup, or fertilization."

This clarity protects everyone. The customer knows what they're getting. The provider knows what they're doing. And when a complaint comes in, you have a reference document to resolve it.

THE LEVEL SYSTEM

Most SKUs should have 2-4 levels (variants). For lawn mowing: Maintenance (quick mow), Standard (mow + edge + blow), and Deep (everything + bed cleanup). Levels let customers self-select based on their needs, and they let providers recommend upgrades when they see a property that needs more attention.

The courtesy upgrade system allows a provider to perform one level higher than what was booked — once per property per SKU per 6 months — for free. This builds customer goodwill and demonstrates provider quality. Track courtesy upgrades in Level Analytics to see which providers are going above and beyond.

PROOF REQUIREMENTS

Every SKU should define what photos the provider must submit. At minimum: one "after" photo. For lawn care, pest control, and window cleaning, "before + after" is non-negotiable. Photos are your defense against unjustified complaints, your quality audit tool, and your customer communication asset.

A completed job without proof photos is an unverified claim. It may be perfectly fine, but you have zero evidence if the customer disputes it.`,
  },
  {
    id: "calibration",
    title: "SKU Calibration — Replacing Guesses with Reality",
    type: "walkthrough",
    steps: [
      {
        title: "Understand the seed data problem",
        description: "When the platform launched, every SKU duration and price was estimated. A 'standard lawn mowing' was set to 45 minutes based on industry averages. But YOUR providers in YOUR market might take 35 minutes (efficient crews, small lots) or 60 minutes (solo operators, larger properties). The calibration page helps you replace those estimates with real numbers.",
        screenshot: { alt: "SKU Calibration page showing current vs. provider-reported values" },
      },
      {
        title: "Enter provider-reported data by property size",
        description: "The calibration form has fields for Small, Medium, Large, and XL property durations. This is critical because a 'standard lawn mowing' on a 1/8 acre lot and a 1/2 acre lot are completely different jobs. Enter the actual durations from your provider interviews — not what you think they should be.",
        screenshot: { alt: "Calibration input form with size tier fields" },
      },
      {
        title: "Read the delta indicators",
        description: "Green (<5% delta) means your seed data was close. Yellow (5-20% delta) means it's off but manageable. Red (>20% delta) means your scheduling, billing, and route planning are based on wrong numbers. Fix reds immediately — they cause cascading problems.",
        screenshot: { alt: "Delta indicators showing green/yellow/red thresholds" },
      },
      {
        title: "Apply calibration and export the report",
        description: "Clicking 'Apply' updates the SKU's average duration and price hint. Export the calibration report (JSON) for your records. This report is your audit trail showing what changed, when, and based on what data.",
        screenshot: { alt: "Apply calibration button and export report" },
      },
    ],
  },
  {
    id: "pro-tips",
    title: "Pro Tips from Veteran Operators",
    type: "pro-tips",
    proTips: [
      {
        text: "Every 10 minutes of duration error compounds across a provider's daily route. If lawn mowing is set to 45 min but actually takes 60, by the 5th job they're running 75 minutes late. Customers get angry, providers get stressed, and your arrival notifications become lies.",
        context: "Duration accuracy is the single most impactful SKU setting. Get this right first.",
      },
      {
        text: "Interview at least 3 providers before setting durations. One provider's numbers are an anecdote. Three providers' numbers are data. If all three say lawn mowing takes 50-55 minutes but your seed data says 45, believe the providers.",
        context: "Providers know their work better than spreadsheets do.",
      },
      {
        text: "Don't create a new SKU when a level will do. 'Premium Lawn Care' and 'Lawn Mowing with Edging' are the same SKU at different levels. Separate SKUs for similar services create catalog bloat, confuse customers, and make reporting harder.",
        context: "A lean catalog with well-defined levels beats a fat catalog with overlapping services.",
      },
      {
        text: "When a customer complains that 'the service wasn't thorough enough,' check the SKU inclusions first. In 40% of cases, the customer expected something that wasn't in the service definition. The fix isn't to scold the provider — it's to clarify the SKU or upsell to a higher level.",
      },
      {
        text: "Pause a SKU rather than archiving it if you're unsure. Paused SKUs don't appear in the customer catalog but retain all their configuration. Archived SKUs are gone. You can un-pause in seconds; recreating an archived SKU takes an hour.",
      },
    ],
  },
  {
    id: "watch-outs",
    title: "Watch Out For...",
    type: "watch-outs",
    watchOuts: [
      {
        text: "Never change a SKU's duration on a live SKU without checking how many active routines use it. Changing 'Standard Lawn Mowing' from 45 to 60 minutes affects every customer subscribed to it — their routes get longer, their arrival windows shift, and capacity projections change. Make duration changes during low-activity periods (Sunday night) and verify the planner picks them up correctly.",
        severity: "critical",
      },
      {
        text: "Proof requirements apply to ALL jobs for that SKU. If you add a 'before photo' requirement to an active SKU, every provider on their next job will be required to submit it. Warn providers before adding new proof requirements — a surprise mandatory photo they weren't expecting causes proof compliance to tank temporarily.",
        severity: "caution",
      },
      {
        text: "The SKU price hint is NOT the customer price. It's a reference value for margin calculations. Customer pricing comes from the plan they subscribe to. Don't confuse calibrating the SKU price (provider cost basis) with changing what customers pay (that's in Control Room → Pricing).",
        severity: "caution",
      },
    ],
  },
  {
    id: "real-world",
    title: "Real-World Pricing Context",
    type: "real-world",
    realWorldData: [
      {
        text: "Professional lawn mowing nationally averages ~$122 per visit, with a range of $49–$203 depending on lot size. Small yard (under 1/4 acre): $49–$79. Standard yard: $80–$140. Large lot: $140–$220. Recurring maintenance plans drop per-visit pricing to $45–$90 because the provider saves on acquisition cost and route planning.",
        source: "Angi consumer cost guides, IBISWorld (2025)",
      },
      {
        text: "Professional house cleaning averages $175 per visit nationally ($118–$237 range). A 'quick refresh' clean runs $99–$149. Standard clean: $160–$240. Deep clean: $250–$400. Move-in/move-out: $350–$650. Recurring plans (weekly/biweekly) reduce per-visit cost by 10–20%.",
        source: "Angi, This Old House consumer cost guides (2025)",
      },
      {
        text: "Pest control is $29.7B annually (2026 est.) and uniquely subscription-friendly. Quarterly treatments are the industry standard. Customer retention in pest control is among the highest in home services — once started, customers rarely cancel voluntarily. Initial treatment: $150–$300; quarterly maintenance: $100–$150.",
        source: "IBISWorld market research (2026)",
      },
      {
        text: "Gutter cleaning ranges $119–$234 per visit depending on home height and linear footage. Most maintenance sources recommend 2x/year (spring + fall). Homes with heavy tree cover may need 3-4 cleanings. This is a high-margin service with low equipment requirements — excellent for bundling with other outdoor services.",
        source: "Angi consumer cost guides (2025)",
      },
    ],
  },
  {
    id: "automation",
    title: "What's Automated vs. What Needs Your Eyes",
    type: "automation",
    automationNotes: [
      {
        text: "SKU lifecycle transitions (draft → active → paused → archived) are manual and require admin action. This is intentional — SKU changes have broad impact and should be deliberate.",
        type: "weekly-check",
      },
      {
        text: "Proof compliance tracking is automatic. The system monitors whether providers submit required photos. Review Level Analytics monthly for trends in level mismatches and courtesy upgrades.",
        type: "weekly-check",
      },
      {
        text: "Duration averages are recalculated when you apply calibration data. They do NOT auto-update from job completion times. Calibration is a human-driven process based on provider interviews.",
        type: "weekly-check",
      },
    ],
  },
];
