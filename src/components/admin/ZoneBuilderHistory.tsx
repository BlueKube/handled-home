import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, History, Loader2 } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

interface BuilderRun {
  id: string;
  region_id: string;
  config: any;
  status: string;
  created_at: string;
  committed_at: string | null;
  regions: { name: string } | null;
  zone_builder_results: { id: string }[];
}

export function ZoneBuilderHistory() {
  const [open, setOpen] = useState(false);

  const { data: runs, isLoading } = useQuery({
    queryKey: ["zone-builder-runs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("zone_builder_runs")
        .select("id, region_id, config, status, created_at, committed_at, regions(name), zone_builder_results(id)")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as unknown as BuilderRun[];
    },
    enabled: open,
  });

  const statusColor = (s: string) => {
    switch (s) {
      case "committed": return "default";
      case "preview": return "secondary";
      case "draft": return "outline";
      case "archived": return "outline";
      default: return "outline";
    }
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full py-2">
        <History className="h-4 w-4" />
        <span>Zone Builder History</span>
        <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pt-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !runs?.length ? (
          <p className="text-sm text-muted-foreground text-center py-4">No builder runs yet.</p>
        ) : (
          runs.map((run) => (
            <Card key={run.id} className="p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {run.regions?.name || "Unknown region"}
                </span>
                <Badge variant={statusColor(run.status) as any}>{run.status}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>{format(new Date(run.created_at), "MMM d, yyyy h:mm a")}</span>
                <span>{run.zone_builder_results?.length || 0} zones generated</span>
                {run.committed_at && (
                  <span>Committed {format(new Date(run.committed_at), "MMM d")}</span>
                )}
                {run.config?.resolution && (
                  <span>Res {run.config.resolution}</span>
                )}
              </div>
            </Card>
          ))
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
