import { useState } from "react";
import { useProviderAdmin, useAdminInvites } from "@/hooks/useProviderAdmin";
import { useZones } from "@/hooks/useZones";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Shield, AlertTriangle, CheckCircle, Clock, Eye, Plus, Loader2, MapPin, Users, FileText } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  PENDING: "bg-warning/20 text-warning-foreground",
  ACTIVE: "bg-success/20 text-success",
  PROBATION: "bg-warning/20 text-warning",
  SUSPENDED: "bg-destructive/20 text-destructive",
};

export default function AdminProviders() {
  const navigate = useNavigate();
  const { orgs, loading } = useProviderAdmin();
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = statusFilter === "all" ? orgs : orgs.filter((o: any) => o.status === statusFilter);
  const pendingCount = orgs.filter((o: any) => o.status === "PENDING").length;

  return (
    <div className="p-6 max-w-4xl animate-fade-in">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-h2">Providers</h1>
        {pendingCount > 0 && <Badge variant="destructive">{pendingCount} pending</Badge>}
      </div>
      <p className="text-caption mb-4">Review and manage provider organizations.</p>

      <div className="flex items-center gap-2 mb-4">
        <Tabs defaultValue="providers" className="flex-1">
        <div className="flex items-center gap-2">
        <TabsList>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="invites">Invites</TabsTrigger>
        </TabsList>
        <Link to="/admin/providers/applications">
          <Button variant="outline" size="sm" className="gap-1">
            <FileText className="h-3.5 w-3.5" /> Applications
          </Button>
        </Link>
        </div>

        <TabsContent value="providers">
          <div className="mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PROBATION">Probation</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {loading && <p className="text-muted-foreground text-center py-8">Loading...</p>}
            {!loading && filtered.length === 0 && <p className="text-muted-foreground text-center py-8">No providers found.</p>}
            {filtered.map((org: any) => {
              const riskCount = org.provider_risk_flags?.filter((f: any) => f.is_active).length || 0;
              const approvedZones = org.provider_coverage?.filter((c: any) => c.request_status === "APPROVED").length || 0;
              const totalZones = org.provider_coverage?.length || 0;
              return (
                <Card key={org.id} className="press-feedback cursor-pointer" onClick={() => navigate(`/admin/providers/${org.id}`)}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{org.name || "Unnamed"}</span>
                          <Badge className={STATUS_COLORS[org.status] || ""}>{org.status}</Badge>
                          {org.needs_review && <Badge variant="outline" className="text-xs">Needs Review</Badge>}
                        </div>
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{approvedZones}/{totalZones} zones</span>
                          {riskCount > 0 && (
                            <span className="flex items-center gap-1 text-warning"><AlertTriangle className="h-3 w-3" />{riskCount} flags</span>
                          )}
                        </div>
                      </div>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="invites">
          <InvitesPanel />
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}

function InvitesPanel() {
  const { invites, loading, createInvite, toggleInvite } = useAdminInvites();
  const zonesQuery = useZones();
  const zones = zonesQuery.data ?? [];
  const [showCreate, setShowCreate] = useState(false);
  const [code, setCode] = useState("");
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [maxUses, setMaxUses] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!code.trim()) { toast.error("Code is required"); return; }
    setCreating(true);
    try {
      await createInvite.mutateAsync({
        code: code.trim().toUpperCase(),
        allowedZoneIds: selectedZones,
        maxUses: maxUses ? parseInt(maxUses) : undefined,
      });
      toast.success("Invite created");
      setShowCreate(false);
      setCode("");
      setSelectedZones([]);
      setMaxUses("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{invites.length} invite codes</p>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />New Invite</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Invite Code</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Code</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="HANDLED-2026" />
              </div>
              <div>
                <Label>Max Uses (optional)</Label>
                <Input value={maxUses} onChange={(e) => setMaxUses(e.target.value)} type="number" placeholder="Unlimited" />
              </div>
              <div>
                <Label>Allowed Zones</Label>
                <div className="space-y-2 mt-1 max-h-40 overflow-y-auto">
                  {zones?.map((z: any) => (
                    <div key={z.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedZones.includes(z.id)}
                        onCheckedChange={(v) => {
                          setSelectedZones(v ? [...selectedZones, z.id] : selectedZones.filter(id => id !== z.id));
                        }}
                      />
                      <span className="text-sm">{z.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={creating}>
                {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {invites.map((inv: any) => (
          <Card key={inv.id}>
            <CardContent className="py-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-sm font-semibold">{inv.code}</code>
                  <Badge variant={inv.is_active ? "default" : "secondary"}>{inv.is_active ? "Active" : "Inactive"}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {inv.uses_count}{inv.max_uses ? `/${inv.max_uses}` : ""} uses
                  {inv.expires_at ? ` · Expires ${new Date(inv.expires_at).toLocaleDateString()}` : ""}
                </p>
              </div>
              <Switch
                checked={inv.is_active}
                onCheckedChange={(v) => toggleInvite.mutate({ id: inv.id, isActive: v })}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
