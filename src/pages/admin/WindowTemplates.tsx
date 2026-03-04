import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useWindowTemplates, useCreateWindowTemplate, useUpdateWindowTemplate, useDeleteWindowTemplate, type WindowTemplate } from "@/hooks/useWindowTemplates";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Clock, CalendarClock, Edit2 } from "lucide-react";
import { toast } from "sonner";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatTime12(t: string): string {
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${mStr ?? "00"} ${suffix}`;
}

function TemplateFormSheet({
  template,
  open,
  onOpenChange,
  zones,
}: {
  template: WindowTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zones: { id: string; name: string }[];
}) {
  const create = useCreateWindowTemplate();
  const update = useUpdateWindowTemplate();
  const isEdit = !!template;

  const [zoneId, setZoneId] = useState(template?.zone_id ?? zones[0]?.id ?? "");
  const [categoryKey, setCategoryKey] = useState(template?.category_key ?? "");
  const [windowLabel, setWindowLabel] = useState(template?.window_label ?? "");
  const [windowStart, setWindowStart] = useState(template?.window_start ?? "09:00");
  const [windowEnd, setWindowEnd] = useState(template?.window_end ?? "12:00");
  const [dayOfWeek, setDayOfWeek] = useState<string>(
    template?.day_of_week != null ? String(template.day_of_week) : "all"
  );
  const [isActive, setIsActive] = useState(template?.is_active ?? true);

  const handleSave = () => {
    if (!zoneId || !categoryKey.trim() || !windowLabel.trim()) {
      toast.error("Zone, category, and label are required");
      return;
    }
    const payload = {
      zone_id: zoneId,
      category_key: categoryKey.trim(),
      window_label: windowLabel.trim(),
      window_start: windowStart,
      window_end: windowEnd,
      day_of_week: dayOfWeek === "all" ? null : parseInt(dayOfWeek, 10),
      is_active: isActive,
    };

    if (isEdit) {
      update.mutate(
        { id: template!.id, updates: payload },
        {
          onSuccess: () => { toast.success("Template updated"); onOpenChange(false); },
          onError: (e) => toast.error(e.message),
        }
      );
    } else {
      create.mutate(payload, {
        onSuccess: () => { toast.success("Template created"); onOpenChange(false); },
        onError: (e) => toast.error(e.message),
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit Window Template" : "New Window Template"}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4 pb-20">
          <div>
            <Label>Zone *</Label>
            <Select value={zoneId} onValueChange={setZoneId}>
              <SelectTrigger><SelectValue placeholder="Select zone" /></SelectTrigger>
              <SelectContent>
                {zones.map((z) => (
                  <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Category Key *</Label>
            <Input value={categoryKey} onChange={(e) => setCategoryKey(e.target.value)} placeholder="e.g. cleaning, lawn" />
          </div>
          <div>
            <Label>Window Label *</Label>
            <Input value={windowLabel} onChange={(e) => setWindowLabel(e.target.value)} placeholder="e.g. Morning (9–12)" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Time</Label>
              <Input type="time" value={windowStart} onChange={(e) => setWindowStart(e.target.value)} />
            </div>
            <div>
              <Label>End Time</Label>
              <Input type="time" value={windowEnd} onChange={(e) => setWindowEnd(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Day of Week</Label>
            <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All days</SelectItem>
                {DAY_LABELS.map((label, i) => (
                  <SelectItem key={i} value={String(i)}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label>Active</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
        <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 bg-card border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={create.isPending || update.isPending}>
            {isEdit ? "Save" : "Create"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default function WindowTemplates() {
  const [selectedZone, setSelectedZone] = useState<string>("all");
  const { data: templates, isLoading } = useWindowTemplates(selectedZone === "all" ? undefined : selectedZone);
  const deleteTemplate = useDeleteWindowTemplate();

  const { data: zones = [] } = useQuery({
    queryKey: ["zones_list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("zones").select("id, name").order("name");
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WindowTemplate | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleEdit = (t: WindowTemplate) => {
    setEditingTemplate(t);
    setFormOpen(true);
  };

  const handleDelete = () => {
    if (!deleteConfirmId) return;
    deleteTemplate.mutate(deleteConfirmId, {
      onSuccess: () => { toast.success("Template deleted"); setDeleteConfirmId(null); },
      onError: (e) => toast.error(e.message),
    });
  };

  // Group by category
  const byCategory = new Map<string, WindowTemplate[]>();
  (templates ?? []).forEach((t) => {
    const existing = byCategory.get(t.category_key) ?? [];
    existing.push(t);
    byCategory.set(t.category_key, existing);
  });

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h2">Window Templates</h1>
          <p className="text-sm text-muted-foreground">Manage appointment window slots by zone and category</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => { setEditingTemplate(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" /> New Template
        </Button>
      </div>

      <div>
        <Label className="text-xs">Filter by zone</Label>
        <Select value={selectedZone} onValueChange={setSelectedZone}>
          <SelectTrigger className="w-[240px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All zones</SelectItem>
            {zones.map((z) => (
              <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : byCategory.size === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CalendarClock className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No window templates configured</p>
          <p className="text-xs mt-1">Create templates to define available appointment windows</p>
        </div>
      ) : (
        Array.from(byCategory.entries()).map(([category, items]) => (
          <Card key={category}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm capitalize">{category.replace(/_/g, " ")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-2 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium">{t.window_label}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime12(t.window_start)}–{formatTime12(t.window_end)}
                    </span>
                    {t.day_of_week != null && (
                      <Badge variant="outline" className="text-[10px]">
                        {DAY_LABELS[t.day_of_week]}
                      </Badge>
                    )}
                    {!t.is_active && (
                      <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(t)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteConfirmId(t.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}

      <TemplateFormSheet
        template={editingTemplate}
        open={formOpen}
        onOpenChange={setFormOpen}
        zones={zones}
      />

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template?</AlertDialogTitle>
            <AlertDialogDescription>This will remove the window template. Existing booked windows are not affected.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
