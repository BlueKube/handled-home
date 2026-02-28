import { useState } from "react";
import { useChangeRequests, useSubmitChangeRequest, useReviewChangeRequest } from "@/hooks/useChangeRequests";
import { useAdminMembership } from "@/hooks/useAdminMembership";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { toast } from "sonner";
import { Send, CheckCircle, XCircle } from "lucide-react";

export default function ControlChangeRequests() {
  const { isSuperuser } = useAdminMembership();
  const [tab, setTab] = useState("pending");
  const { data: requests, isLoading } = useChangeRequests(tab === "all" ? undefined : tab);
  const submitMut = useSubmitChangeRequest();
  const reviewMut = useReviewChangeRequest();

  const [submitOpen, setSubmitOpen] = useState(false);
  const [targetTable, setTargetTable] = useState("sku_pricing_zone_overrides");
  const [changeType, setChangeType] = useState("pricing");
  const [targetEntityId, setTargetEntityId] = useState("");
  const [proposedJson, setProposedJson] = useState("{}");
  const [reason, setReason] = useState("");

  const [reviewId, setReviewId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  const handleSubmit = () => {
    if (!reason.trim()) { toast.error("Reason is required"); return; }
    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(proposedJson); } catch { toast.error("Invalid JSON"); return; }
    submitMut.mutate({
      target_table: targetTable, target_entity_id: targetEntityId || undefined,
      change_type: changeType, proposed_changes: parsed, reason: reason.trim(),
    }, { onSuccess: () => { setSubmitOpen(false); setReason(""); setProposedJson("{}"); } });
  };

  const handleReview = (decision: string) => {
    if (!reviewId) return;
    reviewMut.mutate({ request_id: reviewId, decision, reviewer_note: reviewNote }, { onSuccess: () => { setReviewId(null); setReviewNote(""); } });
  };

  if (isLoading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96 w-full" /></div>;

  const statusColor = (s: string) => s === "pending" ? "secondary" : s === "approved" ? "default" : "destructive";

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Change Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">Submit pricing/payout/config change requests for superuser review.</p>
        </div>
        <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
          <DialogTrigger asChild><Button size="sm"><Send className="h-3.5 w-3.5 mr-1" />New Request</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Submit Change Request</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Change Type</Label>
                  <Select value={changeType} onValueChange={setChangeType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pricing">Pricing</SelectItem>
                      <SelectItem value="payout">Payout</SelectItem>
                      <SelectItem value="incentive">Incentive</SelectItem>
                      <SelectItem value="algorithm">Algorithm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Target Table</Label><Input value={targetTable} onChange={(e) => setTargetTable(e.target.value)} className="h-9" /></div>
              </div>
              <div><Label className="text-xs">Target Entity ID (optional)</Label><Input value={targetEntityId} onChange={(e) => setTargetEntityId(e.target.value)} placeholder="UUID or identifier" /></div>
              <div><Label className="text-xs">Proposed Changes (JSON)</Label><Textarea value={proposedJson} onChange={(e) => setProposedJson(e.target.value)} className="font-mono text-xs" rows={4} /></div>
              <div><Label className="text-xs">Reason</Label><Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this change needed?" /></div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
              <Button onClick={handleSubmit} disabled={submitMut.isPending}>{submitMut.isPending ? "Submitting…" : "Submit"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          <Card>
            <CardContent className="pt-4">
              <div className="border rounded-lg overflow-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Type</TableHead><TableHead>Table</TableHead><TableHead>Role</TableHead>
                    <TableHead>Reason</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead>
                    {isSuperuser && tab === "pending" && <TableHead className="w-32">Review</TableHead>}
                  </TableRow></TableHeader>
                  <TableBody>
                    {requests?.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell><Badge variant="outline">{r.change_type}</Badge></TableCell>
                        <TableCell className="font-mono text-xs">{r.target_table}</TableCell>
                        <TableCell className="text-xs">{r.requester_role}</TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{r.reason}</TableCell>
                        <TableCell><Badge variant={statusColor(r.status)}>{r.status}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{format(new Date(r.created_at), "MMM d, HH:mm")}</TableCell>
                        {isSuperuser && tab === "pending" && (
                          <TableCell>
                            {reviewId === r.id ? (
                              <div className="space-y-1">
                                <Input value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="Note…" className="h-7 text-xs" />
                                <div className="flex gap-1">
                                  <Button size="sm" className="h-6 text-xs" onClick={() => handleReview("approved")} disabled={reviewMut.isPending}><CheckCircle className="h-3 w-3 mr-0.5" />OK</Button>
                                  <Button size="sm" variant="destructive" className="h-6 text-xs" onClick={() => handleReview("rejected")} disabled={reviewMut.isPending}><XCircle className="h-3 w-3 mr-0.5" />No</Button>
                                  <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setReviewId(null)}>×</Button>
                                </div>
                              </div>
                            ) : (
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setReviewId(r.id); setReviewNote(""); }}>Review</Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    {(!requests || requests.length === 0) && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No change requests</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
