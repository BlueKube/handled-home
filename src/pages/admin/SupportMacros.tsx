import { useState } from "react";
import { useSupportMacros, type SupportMacro } from "@/hooks/useSupportMacros";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { Plus, Zap, Trash2, ChevronRight } from "lucide-react";

const DEFAULT_PATCH = {
  credit_cents: 1000,
  status: "resolved",
  resolution_summary: "Applied quick credit macro",
};

export default function AdminSupportMacros() {
  const { macros, isLoading, createMacro, updateMacro, deleteMacro } = useSupportMacros();
  const [showCreate, setShowCreate] = useState(false);
  const [detailMacro, setDetailMacro] = useState<SupportMacro | null>(null);
  const [form, setForm] = useState({ name: "", description: "", patch: JSON.stringify(DEFAULT_PATCH, null, 2) });

  const handleCreate = () => {
    try {
      const patch = JSON.parse(form.patch);
      createMacro.mutate(
        { name: form.name, description: form.description, patch },
        {
          onSuccess: () => {
            toast.success("Macro created");
            setShowCreate(false);
            setForm({ name: "", description: "", patch: JSON.stringify(DEFAULT_PATCH, null, 2) });
          },
          onError: (e) => toast.error(e.message),
        }
      );
    } catch {
      toast.error("Invalid JSON in patch");
    }
  };

  const handleDelete = (id: string) => {
    deleteMacro.mutate(id, {
      onSuccess: () => { toast.success("Macro deleted"); setDetailMacro(null); },
      onError: (e) => toast.error(e.message),
    });
  };

  const toggleActive = (macro: SupportMacro) => {
    updateMacro.mutate(
      { id: macro.id, is_active: !macro.is_active },
      {
        onSuccess: () => toast.success(macro.is_active ? "Deactivated" : "Activated"),
        onError: (e) => toast.error(e.message),
      }
    );
  };

  return (
    <div className="p-6 max-w-4xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h2">Support Macros</h1>
          <p className="text-caption">Quick-apply policy patches for common actions</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Macro
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />)}</div>
      ) : macros.length === 0 ? (
        <Card className="p-8 text-center">
          <Zap className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No macros yet. Create one to speed up resolution.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {macros.map((m) => (
            <Card
              key={m.id}
              className="p-4 flex items-center gap-3 cursor-pointer press-feedback"
              onClick={() => setDetailMacro(m)}
            >
              <Zap className={`h-4 w-4 shrink-0 ${m.is_active ? "text-accent" : "text-muted-foreground"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{m.name}</span>
                  <Badge variant={m.is_active ? "default" : "outline"} className="text-[10px]">
                    {m.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {m.description && <p className="text-xs text-muted-foreground truncate">{m.description}</p>}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Card>
          ))}
        </div>
      )}

      {/* Create Sheet */}
      <Sheet open={showCreate} onOpenChange={setShowCreate}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader><SheetTitle>New Macro</SheetTitle></SheetHeader>
          <div className="space-y-4 mt-4">
            <Input placeholder="Macro name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Patch (JSON)</label>
              <Textarea rows={8} className="font-mono text-xs" value={form.patch} onChange={(e) => setForm(f => ({ ...f, patch: e.target.value }))} />
            </div>
            <Button className="w-full" disabled={!form.name || createMacro.isPending} onClick={handleCreate}>
              Create Macro
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Detail Sheet */}
      <Sheet open={!!detailMacro} onOpenChange={() => setDetailMacro(null)}>
        <SheetContent className="overflow-y-auto">
          {detailMacro && (
            <>
              <SheetHeader><SheetTitle>{detailMacro.name}</SheetTitle></SheetHeader>
              <div className="space-y-4 mt-4">
                {detailMacro.description && <p className="text-sm">{detailMacro.description}</p>}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Patch</label>
                  <pre className="bg-muted p-3 rounded-lg text-xs font-mono overflow-x-auto max-h-48 overflow-y-auto">
                    {JSON.stringify(detailMacro.patch, null, 2)}
                  </pre>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => toggleActive(detailMacro)} disabled={updateMacro.isPending}>
                    {detailMacro.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(detailMacro.id)} disabled={deleteMacro.isPending}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
