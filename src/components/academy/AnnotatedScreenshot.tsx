import { cn } from "@/lib/utils";

export interface BoxAnnotation {
  type: "box";
  /** X position as percentage (0–100) */
  x: number;
  /** Y position as percentage (0–100) */
  y: number;
  /** Width as percentage */
  w: number;
  /** Height as percentage */
  h: number;
  label?: string;
  color?: "blue" | "red" | "green" | "amber" | "purple";
}

export interface ArrowAnnotation {
  type: "arrow";
  from: { x: number; y: number };
  to: { x: number; y: number };
  label?: string;
  color?: "blue" | "red" | "green" | "amber" | "purple";
}

export interface PulseAnnotation {
  type: "pulse";
  x: number;
  y: number;
  label?: string;
  color?: "blue" | "red" | "green" | "amber" | "purple";
}

export interface StepAnnotation {
  type: "step";
  x: number;
  y: number;
  number: number;
  label?: string;
  color?: "blue" | "red" | "green" | "amber" | "purple";
}

export type Annotation =
  | BoxAnnotation
  | ArrowAnnotation
  | PulseAnnotation
  | StepAnnotation;

const colorMap = {
  blue: { border: "border-blue-400", bg: "bg-blue-500", text: "text-blue-300", fill: "#60a5fa" },
  red: { border: "border-red-400", bg: "bg-red-500", text: "text-red-300", fill: "#f87171" },
  green: { border: "border-green-400", bg: "bg-green-500", text: "text-green-300", fill: "#4ade80" },
  amber: { border: "border-amber-400", bg: "bg-amber-500", text: "text-amber-300", fill: "#fbbf24" },
  purple: { border: "border-purple-400", bg: "bg-purple-500", text: "text-purple-300", fill: "#c084fc" },
} as const;

function BoxOverlay({ a }: { a: BoxAnnotation }) {
  const c = colorMap[a.color ?? "blue"];
  return (
    <div
      className={cn("absolute border-2 rounded-sm pointer-events-none", c.border)}
      style={{ left: `${a.x}%`, top: `${a.y}%`, width: `${a.w}%`, height: `${a.h}%` }}
    >
      {a.label && (
        <span
          className={cn("absolute -top-6 left-0 text-xs font-medium px-1.5 py-0.5 rounded whitespace-nowrap", c.bg, "text-white")}
        >
          {a.label}
        </span>
      )}
    </div>
  );
}

function ArrowOverlay({ a }: { a: ArrowAnnotation }) {
  const c = colorMap[a.color ?? "blue"];
  const dx = a.to.x - a.from.x;
  const dy = a.to.y - a.from.y;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const len = Math.sqrt(dx * dx + dy * dy);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="absolute inset-0 w-full h-full overflow-visible">
        <defs>
          <marker
            id={`arrowhead-${a.from.x}-${a.from.y}`}
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill={c.fill} />
          </marker>
        </defs>
        <line
          x1={`${a.from.x}%`}
          y1={`${a.from.y}%`}
          x2={`${a.to.x}%`}
          y2={`${a.to.y}%`}
          stroke={c.fill}
          strokeWidth="2"
          markerEnd={`url(#arrowhead-${a.from.x}-${a.from.y})`}
        />
      </svg>
      {a.label && (
        <span
          className={cn("absolute text-xs font-medium px-1.5 py-0.5 rounded whitespace-nowrap", c.bg, "text-white")}
          style={{
            left: `${a.from.x}%`,
            top: `${a.from.y}%`,
            transform: "translate(-50%, -150%)",
          }}
        >
          {a.label}
        </span>
      )}
    </div>
  );
}

function PulseOverlay({ a }: { a: PulseAnnotation }) {
  const c = colorMap[a.color ?? "blue"];
  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: `${a.x}%`, top: `${a.y}%`, transform: "translate(-50%, -50%)" }}
    >
      <span className={cn("relative flex h-4 w-4")}>
        <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", c.bg)} />
        <span className={cn("relative inline-flex rounded-full h-4 w-4", c.bg)} />
      </span>
      {a.label && (
        <span
          className={cn("absolute left-6 top-1/2 -translate-y-1/2 text-xs font-medium px-1.5 py-0.5 rounded whitespace-nowrap", c.bg, "text-white")}
        >
          {a.label}
        </span>
      )}
    </div>
  );
}

function StepOverlay({ a }: { a: StepAnnotation }) {
  const c = colorMap[a.color ?? "blue"];
  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: `${a.x}%`, top: `${a.y}%`, transform: "translate(-50%, -50%)" }}
    >
      <span
        className={cn("inline-flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold text-white shadow-lg", c.bg)}
      >
        {a.number}
      </span>
      {a.label && (
        <span
          className={cn("absolute left-9 top-1/2 -translate-y-1/2 text-xs font-medium px-1.5 py-0.5 rounded whitespace-nowrap bg-card border border-border", c.text)}
        >
          {a.label}
        </span>
      )}
    </div>
  );
}

interface AnnotatedScreenshotProps {
  src?: string;
  alt: string;
  annotations?: Annotation[];
  className?: string;
  placeholderText?: string;
}

export function AnnotatedScreenshot({
  src,
  alt,
  annotations = [],
  className,
  placeholderText,
}: AnnotatedScreenshotProps) {
  return (
    <div className={cn("relative rounded-lg overflow-hidden border border-border bg-muted/30", className)}>
      {src ? (
        <img src={src} alt={alt} className="w-full h-auto block" />
      ) : (
        <div className="w-full aspect-video flex items-center justify-center bg-muted/50">
          <p className="text-sm text-muted-foreground">{placeholderText ?? `Screenshot: ${alt}`}</p>
        </div>
      )}

      {annotations.map((a, i) => {
        switch (a.type) {
          case "box":
            return <BoxOverlay key={i} a={a} />;
          case "arrow":
            return <ArrowOverlay key={i} a={a} />;
          case "pulse":
            return <PulseOverlay key={i} a={a} />;
          case "step":
            return <StepOverlay key={i} a={a} />;
        }
      })}
    </div>
  );
}
