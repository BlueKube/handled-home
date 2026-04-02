import { useState } from "react";
import { useOrgContracts, useSetOrgContractMutation } from "@/hooks/useProviderPayoutAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { toast } from "sonner";
import { contractLabel } from "./shared";

interface ContractsTabProps {
  isSuperuser: boolean;
}

export function ContractsTab({ isSuperuser }: ContractsTabProps) {
  const { data: orgContracts } = useOrgContracts();
  const setContractMut = useSetOrgContractMutation();

  const [ctOpen, setCtOpen] = useState(false);
  const [ctOrgId, setCtOrgId] = useState("");
  const [ctType, setCtType] = useState("partner_flat");
  const [ctReason, setCtReason] = useState("");

  const handleSaveContract = () => {
    if (!ctOrgId || !ctReason.trim()) { toast.error("Org and reason required"); return; }
    setContractMut.mutate({ provider_org_id: ctOrgId, contract_type: ctType, reason: ctReason.trim() }, { onSuccess: () => setCtOpen(false) });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Provider Org Contracts</CardTitle>
        {isSuperuser && (
          <Dialog open={ctOpen} onOpenChange={setCtOpen}>
            <DialogTrigger asChild><Button size="sm">Assign Contract</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Set Contract Type</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Provider Org ID</Label><Input value={ctOrgId} onChange={(e) => setCtOrgId(e.target.value)} placeholder="UUID" /></div>
                <div><Label>Contract Type</Label>
                  <Select value={ctType} onValueChange={setCtType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="partner_flat">Partner Flat</SelectItem>
                      <SelectItem value="partner_time_guarded">Time-Guarded</SelectItem>
                      <SelectItem value="contractor_time_based">Time-Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Reason</Label><Textarea value={ctReason} onChange={(e) => setCtReason(e.target.value)} placeholder="Why?" /></div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                <Button onClick={handleSaveContract} disabled={setContractMut.isPending}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Org ID</TableHead><TableHead>Contract Type</TableHead><TableHead>Since</TableHead><TableHead>Reason</TableHead></TableRow></TableHeader>
            <TableBody>
              {orgContracts?.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.provider_org_id.slice(0, 8)}…</TableCell>
                  <TableCell><Badge variant="outline">{contractLabel(c.contract_type)}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{format(new Date(c.active_from), "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.reason ?? "—"}</TableCell>
                </TableRow>
              ))}
              {(!orgContracts || orgContracts.length === 0) && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No contracts assigned</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
