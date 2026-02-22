import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl bg-gradient-to-r from-muted via-muted-foreground/5 to-muted animate-shimmer",
        className
      )}
      style={{ backgroundSize: "200% 100%" }}
      {...props}
    />
  );
}

export { Skeleton };
