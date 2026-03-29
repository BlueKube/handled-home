import { useState, useMemo } from "react";
import { useAdminBilling } from "@/hooks/useAdminBilling";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageSkeleton } from "@/components/PageSkeleton";
import { DecisionTraceCard } from "@/components/admin/DecisionTraceCard";

export default function AdminExceptions() {
  const { exceptions, isLoading } = useAdminBilling();
  const [selectedExId, setSelectedExId] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    if (severityFilter === "all") return exceptions;
    return exceptions.filter((ex) => ex.severity === severityFilter);
  }, [exceptions, severityFilter]);

  const severities = useMemo(() => {
    const set = new Set(exceptions.map((ex) => ex.severity));
    return ["all", ...Array.from(set)];
  }, [exceptions]);

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      <h1 className="text-h2">Exceptions</h1>

      {exceptions.length > 0 && (
        <Tabs value={severityFilter} onValueChange={setSeverityFilter}>
          <TabsList>
            {severities.map((s) => (
              <TabsTrigger key={s} value={s} className="capitalize text-xs">
                {s === "all" ? `All (${exceptions.length})` : `${s} (${exceptions.filter(e => e.severity === s).length})`}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          {exceptions.length === 0 ? "No open exceptions." : "No exceptions match this filter."}
        </p>
      ) : (
        <div className="space-y-2">
          {exceptions.map((ex) => (
            <Card key={ex.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelectedExId(selectedExId === ex.id ? null : ex.id)}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={ex.severity === "HIGH" ? "destructive" : "secondary"} className="text-[10px]">
                    {ex.severity}
                  </Badge>
                  <span className="text-sm font-semibold">{ex.type.replace(/_/g, " ")}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {ex.entity_type} • Created {new Date(ex.created_at).toLocaleDateString()}
                </p>
                {ex.next_action && (
                  <p className="text-sm text-foreground">{ex.next_action}</p>
                )}
                {selectedExId === ex.id && (
                  <DecisionTraceCard entityType="billing_exception" entityId={ex.id} />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
