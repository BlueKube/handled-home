import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateRegion, useUpdateRegion, type Region } from "@/hooks/useRegions";
import { toast } from "sonner";

interface RegionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  region?: Region | null;
}

export function RegionFormDialog({ open, onOpenChange, region }: RegionFormDialogProps) {
  const [name, setName] = useState("");
  const [state, setState] = useState("CA");
  const [status, setStatus] = useState("active");

  const createRegion = useCreateRegion();
  const updateRegion = useUpdateRegion();
  const isEdit = !!region;

  useEffect(() => {
    if (region) {
      setName(region.name);
      setState((region as any).state || "CA");
      setStatus(region.status);
    } else {
      setName("");
      setState("CA");
      setStatus("active");
    }
  }, [region, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      if (isEdit) {
        await updateRegion.mutateAsync({ id: region!.id, name: name.trim(), state, status });
        toast.success("Region updated");
      } else {
        await createRegion.mutateAsync({ name: name.trim(), state, status });
        toast.success("Region created");
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save region");
    }
  };

  const isPending = createRegion.isPending || updateRegion.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Region" : "New Region"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="region-name">Name</Label>
            <Input id="region-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Los Angeles County" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="region-state">State</Label>
            <Input id="region-state" value={state} onChange={(e) => setState(e.target.value)} placeholder="CA" required />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
