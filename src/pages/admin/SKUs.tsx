import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search } from "lucide-react";
import { useSkus } from "@/hooks/useSkus";
import type { ServiceSku } from "@/hooks/useSkus";
import { SkuListCard } from "@/components/admin/SkuListCard";
import { SkuFormSheet } from "@/components/admin/SkuFormSheet";
import { SkuDetailSheet } from "@/components/admin/SkuDetailSheet";

export default function AdminSKUs() {
  const [statusTab, setStatusTab] = useState("all");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingSku, setEditingSku] = useState<ServiceSku | null>(null);
  const [detailSku, setDetailSku] = useState<ServiceSku | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: skus = [], isLoading } = useSkus({
    status: statusTab,
    search: search || undefined,
  });

  const handleEdit = (sku: ServiceSku) => {
    setDetailOpen(false);
    setEditingSku(sku);
    setFormOpen(true);
  };

  const handleDetail = (sku: ServiceSku) => {
    setDetailSku(sku);
    setDetailOpen(true);
  };

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-h2">SKU Catalog</h1>
        <Button size="sm" className="gap-1.5" onClick={() => { setEditingSku(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" /> New SKU
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search SKUs..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs value={statusTab} onValueChange={setStatusTab}>
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="paused">Paused</TabsTrigger>
        </TabsList>

        <TabsContent value={statusTab} className="mt-4">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading…</p>
          ) : skus.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No SKUs found.</p>
          ) : (
            <div className="grid gap-3">
              {skus.map(sku => (
                <SkuListCard key={sku.id} sku={sku} onClick={() => handleDetail(sku)} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <SkuFormSheet sku={editingSku} open={formOpen} onOpenChange={setFormOpen} />
      <SkuDetailSheet sku={detailSku} open={detailOpen} onOpenChange={setDetailOpen} onEdit={handleEdit} />
    </div>
  );
}
