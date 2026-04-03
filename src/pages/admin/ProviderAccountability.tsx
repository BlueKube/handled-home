import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageSkeleton } from "@/components/PageSkeleton";
import {
  useProviderIncidents, useProviderProbation, useClassifyIncident, useResolveProbation,
  type IncidentWithRelations, type ProbationWithRelations,
} from "@/hooks/useProviderAccountability";
import { AlertTriangle, Shield, Clock, Check, X } from "lucide-react";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { QueryErrorCard } from "@/components/QueryErrorCard";

const INCIDENT_LABELS: Record<string, string> = {
  no_show: "No-Show",
  quality_issue: "Quality Issue",
  access_failure: "Access Failure",
  late_arrival: "Late Arrival",
  proof_missing: "Proof Missing",
};

const SEVERITY_COLORS: Record<string, string> = {
  minor: "secondary",
  major: "default",
  critical: "destructive",
};

const PROBATION_STATUS_COLORS: Record<string, string> = {
  active: "destructive",
  completed: "secondary",
  failed: "destructive",
  revoked: "secondary",
};

const REASON_LABELS: Record<string, string> = {
  sla_orange: "SLA dropped to Orange",
  no_show_tier3: "No-show Tier 3 escalation",
  quality_sustained_red: "Sustained RED quality",
  manual: "Manual entry",
};

export default function ProviderAccountability() {
  const { data: incidents, isLoading: incidentsLoading, isError: incidentsError } = useProviderIncidents();
  const { data: probations, isLoading: probationsLoading, isError: probationsError } = useProviderProbation();
  const classifyIncident = useClassifyIncident();
  const resolveProbation = useResolveProbation();
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const isLoading = incidentsLoading || probationsLoading;
  const isError = incidentsError || probationsError;
  if (isLoading) return <PageSkeleton />;
  if (isError) return <div className="p-6"><QueryErrorCard /></div>;

  const filteredIncidents = typeFilter === "all"
    ? (incidents ?? [])
    : (incidents ?? []).filter((i) => i.incident_type === typeFilter);

  const activeProbations = (probations ?? []).filter((p) => p.status === "active");
  const unclassifiedIncidents = (incidents ?? []).filter((i) => !i.classified_by_user_id);

  const handleClassify = async (id: string, isExcused: boolean) => {
    try {
      await classifyIncident.mutateAsync({ incidentId: id, isExcused });
      toast.success(isExcused ? "Marked as excused" : "Marked as unexcused");
    } catch {
      toast.error("Failed to classify incident");
    }
  };

  const handleResolveProbation = async (id: string, outcome: "improved" | "suspended" | "extended") => {
    try {
      await resolveProbation.mutateAsync({ probationId: id, outcome });
      toast.success(`Probation ${outcome}`);
    } catch {
      toast.error("Failed to update probation");
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Provider Accountability</h1>
        {unclassifiedIncidents.length > 0 && (
          <Badge variant="destructive">{unclassifiedIncidents.length} unclassified</Badge>
        )}
        {activeProbations.length > 0 && (
          <Badge variant="default">{activeProbations.length} on probation</Badge>
        )}
      </div>

      <Tabs defaultValue="incidents">
        <TabsList>
          <TabsTrigger value="incidents">
            Incidents ({incidents?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="probation">
            Probation ({activeProbations.length} active)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incidents" className="space-y-4">
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder="Incident Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(INCIDENT_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredIncidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Shield className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No incidents found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Severity</TableHead>
                  <TableHead className="text-xs">Provider</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">When</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIncidents.map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell className="text-xs font-medium">
                      {INCIDENT_LABELS[incident.incident_type] ?? incident.incident_type}
                    </TableCell>
                    <TableCell>
                      <Badge variant={SEVERITY_COLORS[incident.severity] as any} className="text-[10px]">
                        {incident.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{incident.provider_org_name ?? "—"}</TableCell>
                    <TableCell>
                      {incident.classified_by_user_id ? (
                        <Badge variant={incident.is_excused ? "secondary" : "destructive"} className="text-[10px]">
                          {incident.is_excused ? "Excused" : "Unexcused"}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      {!incident.classified_by_user_id && (
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleClassify(incident.id, true)}>
                            <Check className="h-3 w-3 text-success" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleClassify(incident.id, false)}>
                            <X className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="probation" className="space-y-4">
          {(probations ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Shield className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No probation records.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(probations ?? []).map((prob) => {
                const daysLeft = differenceInDays(new Date(prob.deadline_at), new Date());
                const isActive = prob.status === "active";
                const isOverdue = isActive && daysLeft < 0;

                return (
                  <Card key={prob.id} className={isOverdue ? "border-destructive" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-sm">{prob.provider_org_name ?? "Unknown Provider"}</CardTitle>
                          <Badge variant={PROBATION_STATUS_COLORS[prob.status] as any} className="text-[10px]">
                            {prob.status}
                          </Badge>
                        </div>
                        {isActive && (
                          <div className="flex items-center gap-1">
                            <Clock className={`h-3 w-3 ${isOverdue ? "text-destructive" : "text-muted-foreground"}`} />
                            <span className={`text-xs font-mono ${isOverdue ? "text-destructive font-bold" : "text-muted-foreground"}`}>
                              {isOverdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Reason:</span> {REASON_LABELS[prob.entry_reason] ?? prob.entry_reason}
                      </p>
                      {prob.targets && Object.keys(prob.targets as object).length > 0 && (
                        <div className="text-xs">
                          <span className="font-medium text-muted-foreground">Targets:</span>
                          <pre className="bg-muted p-2 rounded mt-1 text-[10px] overflow-x-auto">
                            {JSON.stringify(prob.targets, null, 2)}
                          </pre>
                        </div>
                      )}
                      {prob.outcome && (
                        <p className="text-xs"><span className="font-medium">Outcome:</span> {prob.outcome}</p>
                      )}
                      {isActive && (
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" variant="outline" className="text-xs" onClick={() => handleResolveProbation(prob.id, "improved")}>
                            <Check className="h-3 w-3 mr-1" /> Improved
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs" onClick={() => handleResolveProbation(prob.id, "extended")}>
                            <Clock className="h-3 w-3 mr-1" /> Extend
                          </Button>
                          <Button size="sm" variant="destructive" className="text-xs" onClick={() => handleResolveProbation(prob.id, "suspended")}>
                            <AlertTriangle className="h-3 w-3 mr-1" /> Suspend
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
