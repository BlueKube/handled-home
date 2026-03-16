import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminApplications } from "@/hooks/useAdminApplications";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ChevronLeft, Eye, FileText, Clock } from "lucide-react";
import { format } from "date-fns";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  submitted: { label: "Submitted", variant: "default" },
  under_review: { label: "Under Review", variant: "outline" },
  approved: { label: "Approved", variant: "default" },
  approved_conditional: { label: "Conditional", variant: "outline" },
  waitlisted: { label: "Waitlisted", variant: "secondary" },
  rejected: { label: "Rejected", variant: "destructive" },
};

export default function AdminApplications() {
  const navigate = useNavigate();
  const { applications } = useAdminApplications();
  const [statusFilter, setStatusFilter] = useState("actionable");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const data = applications.data ?? [];

  // Derive unique categories
  const allCategories = Array.from(
    new Set(data.flatMap((a: any) => a.requested_categories || [a.category]))
  ).sort();

  // Filter
  const filtered = data.filter((app: any) => {
    const statusMatch =
      statusFilter === "all" ? true :
      statusFilter === "actionable" ? ["submitted", "under_review"].includes(app.status) :
      app.status === statusFilter;
    const catMatch =
      categoryFilter === "all" ? true :
      (app.requested_categories || [app.category]).includes(categoryFilter);
    return statusMatch && catMatch;
  });

  const actionableCount = data.filter((a: any) => ["submitted", "under_review"].includes(a.status)).length;

  if (applications.isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl animate-fade-in">
      <Button variant="ghost" size="icon" className="mb-2" onClick={() => navigate("/admin/providers")} aria-label="Back to providers">
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <div className="flex items-center justify-between mb-1">
        <h1 className="text-h2">Applications</h1>
        {actionableCount > 0 && (
          <Badge variant="destructive">{actionableCount} need review</Badge>
        )}
      </div>
      <p className="text-caption mb-4">Review provider applications and make decisions.</p>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="actionable">Needs Review</SelectItem>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="approved_conditional">Conditional</SelectItem>
            <SelectItem value="waitlisted">Waitlisted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {allCategories.map((cat) => (
              <SelectItem key={cat} value={cat} className="capitalize">
                {cat.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No applications match filters.</p>
        )}
        {filtered.map((app: any) => {
          const cfg = STATUS_CONFIG[app.status] || { label: app.status, variant: "secondary" as const };
          const categories = app.requested_categories || [app.category];
          return (
            <Card
              key={app.id}
              className="press-feedback cursor-pointer"
              onClick={() => navigate(`/admin/providers/applications/${app.id}`)}
            >
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      {categories.map((c: string) => (
                        <Badge key={c} variant="outline" className="text-xs capitalize">
                          {c.replace(/_/g, " ")}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm font-medium">
                      {(app.provider_orgs as any)?.name || `Applicant ${app.user_id.slice(0, 8)}`}
                    </p>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      {app.submitted_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(app.submitted_at), "MMM d, yyyy")}
                        </span>
                      )}
                      {app.zip_codes?.length > 0 && (
                        <span>{app.zip_codes.length} ZIP{app.zip_codes.length !== 1 ? "s" : ""}</span>
                      )}
                      {app.byoc_estimate_json && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" /> BYOC
                        </span>
                      )}
                    </div>
                  </div>
                  <Eye className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
