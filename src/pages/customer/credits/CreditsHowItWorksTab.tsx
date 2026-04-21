import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, RotateCcw, Calendar } from "lucide-react";

const SECTIONS = [
  {
    icon: Sparkles,
    title: "What are credits?",
    body: "Every service on Handled Home costs a set number of credits. You get an allowance each billing cycle based on your plan — the bigger your home, the larger your allowance.",
    bullets: [
      "Simple mowing, edging, or pest treatment = a few credits.",
      "Seasonal clean-ups, window wash, or pool service = more.",
      "Swap services cycle-to-cycle without haggling or rebooking.",
    ],
  },
  {
    icon: RotateCcw,
    title: "How they stretch",
    body: "Unused credits roll over to the next cycle up to your plan's rollover cap, so you're never penalized for a quiet week. Top-up credits never expire while your subscription is active.",
    bullets: [
      "Rollover cap varies by plan — check your plan details.",
      "Top-up packs don't count against your rollover cap.",
      "Refunds from cancelled jobs return to your balance automatically.",
    ],
  },
  {
    icon: Calendar,
    title: "When they reset",
    body: "Your allowance refreshes on your billing cycle date. Reset rolls over any unused credits up to the cap, then grants the new cycle's allowance on top.",
    bullets: [
      "Billing cycles are 4 weeks (28 days) by default.",
      "Your next reset date is shown at the top of this page.",
      "You can always top up mid-cycle if you're running low.",
    ],
  },
];

export function CreditsHowItWorksTab() {
  return (
    <div className="space-y-4">
      {SECTIONS.map(({ icon: Icon, title, body, bullets }) => (
        <Card key={title}>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-accent" />
              <h3 className="text-base font-semibold text-foreground">{title}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{body}</p>
            <ul className="space-y-1.5 pl-1">
              {bullets.map((b) => (
                <li key={b} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
