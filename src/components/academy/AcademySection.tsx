import { cn } from "@/lib/utils";
import { AnnotatedScreenshot, type Annotation } from "./AnnotatedScreenshot";
import { Lightbulb, AlertTriangle, Zap, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";

/* ── Section types that compose into a module ── */

export interface StepItem {
  title: string;
  description: string;
  screenshot?: { src?: string; alt: string; annotations?: Annotation[] };
}

export interface ProTip {
  text: string;
  context?: string;
}

export interface WatchOut {
  text: string;
  severity?: "caution" | "critical";
}

export interface AutomationNote {
  text: string;
  type: "set-and-forget" | "daily-check" | "weekly-check";
}

export interface RealWorldData {
  text: string;
  source: string;
}

export interface TrainingSection {
  id: string;
  title: string;
  type: "overview" | "walkthrough" | "pro-tips" | "watch-outs" | "automation" | "real-world" | "text";
  content?: string;
  steps?: StepItem[];
  proTips?: ProTip[];
  watchOuts?: WatchOut[];
  automationNotes?: AutomationNote[];
  realWorldData?: RealWorldData[];
}

/* ── Renderers ── */

function OverviewSection({ section }: { section: TrainingSection }) {
  return (
    <div className="space-y-3">
      {section.content && (
        <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
          {section.content}
        </div>
      )}
    </div>
  );
}

function WalkthroughSection({ section }: { section: TrainingSection }) {
  return (
    <div className="space-y-6">
      {section.steps?.map((step, i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {i + 1}
            </span>
            <div>
              <p className="font-medium text-sm">{step.title}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
            </div>
          </div>
          {step.screenshot && (
            <div className="ml-10">
              <AnnotatedScreenshot
                src={step.screenshot.src}
                alt={step.screenshot.alt}
                annotations={step.screenshot.annotations}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ProTipsSection({ section }: { section: TrainingSection }) {
  return (
    <div className="space-y-3">
      {section.proTips?.map((tip, i) => (
        <Card key={i} className="p-4 border-amber-500/30 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-950/10">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200">{tip.text}</p>
              {tip.context && (
                <p className="text-xs text-amber-700 dark:text-amber-400/70 mt-1">{tip.context}</p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function WatchOutsSection({ section }: { section: TrainingSection }) {
  return (
    <div className="space-y-3">
      {section.watchOuts?.map((wo, i) => (
        <Card
          key={i}
          className={cn(
            "p-4",
            wo.severity === "critical"
              ? "border-red-500/30 bg-red-950/10"
              : "border-orange-500/20 bg-orange-950/10",
          )}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className={cn(
                "h-5 w-5 flex-shrink-0 mt-0.5",
                wo.severity === "critical" ? "text-red-400" : "text-orange-400",
              )}
            />
            <p
              className={cn(
                "text-sm font-medium",
                wo.severity === "critical" ? "text-red-200" : "text-orange-200",
              )}
            >
              {wo.text}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}

function AutomationSection({ section }: { section: TrainingSection }) {
  const typeLabel = {
    "set-and-forget": { label: "Set & Forget", color: "text-green-400 bg-green-900/40 border-green-500/20" },
    "daily-check": { label: "Check Daily", color: "text-amber-400 bg-amber-900/40 border-amber-500/20" },
    "weekly-check": { label: "Check Weekly", color: "text-blue-400 bg-blue-900/40 border-blue-500/20" },
  };

  return (
    <div className="space-y-3">
      {section.automationNotes?.map((note, i) => {
        const t = typeLabel[note.type];
        return (
          <Card key={i} className="p-4 border-border">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", t.color)}>
                    {t.label}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{note.text}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function RealWorldSection({ section }: { section: TrainingSection }) {
  return (
    <div className="space-y-3">
      {section.realWorldData?.map((data, i) => (
        <Card key={i} className="p-4 border-purple-500/20 bg-purple-950/10">
          <div className="flex items-start gap-3">
            <ChevronRight className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-purple-200">{data.text}</p>
              <p className="text-xs text-purple-400/60 mt-1">Source: {data.source}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function TextSection({ section }: { section: TrainingSection }) {
  return (
    <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
      {section.content}
    </div>
  );
}

/* ── Main section renderer ── */

interface AcademySectionRendererProps {
  section: TrainingSection;
}

export function AcademySectionRenderer({ section }: AcademySectionRendererProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold">{section.title}</h3>
      {section.type === "overview" && <OverviewSection section={section} />}
      {section.type === "walkthrough" && <WalkthroughSection section={section} />}
      {section.type === "pro-tips" && <ProTipsSection section={section} />}
      {section.type === "watch-outs" && <WatchOutsSection section={section} />}
      {section.type === "automation" && <AutomationSection section={section} />}
      {section.type === "real-world" && <RealWorldSection section={section} />}
      {section.type === "text" && <TextSection section={section} />}
    </div>
  );
}
