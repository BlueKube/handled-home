import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProviderOrg } from "@/hooks/useProviderOrg";
import { useProviderCoverage } from "@/hooks/useProviderCoverage";
import { useProviderCapabilities } from "@/hooks/useProviderCapabilities";
import { useByocInviteLinks } from "@/hooks/useByocInviteLinks";
import { useSkuLevels } from "@/hooks/useSkuLevels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2, Link2 } from "lucide-react";
import { toast } from "sonner";

const CADENCES = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "once", label: "Once" },
];

export default function ByocCreateLink() {
  const navigate = useNavigate();
  const { org } = useProviderOrg();
  const { coverage } = useProviderCoverage(org?.id);
  const { capabilities } = useProviderCapabilities(org?.id);
  const { createLink } = useByocInviteLinks();

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedSku, setSelectedSku] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [cadence, setCadence] = useState("weekly");

  // Derive available categories from enabled capabilities
  const enabledCategories = capabilities
    .filter((c: any) => c.is_enabled)
    .map((c: any) => c.capability_key)
    .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);

  // Derive available zones from coverage
  const availableZones = coverage.map((c: any) => ({
    id: c.zone_id,
    name: c.zones?.name || c.zone_id,
  }));
  const uniqueZones = availableZones.filter(
    (z: any, i: number, a: any[]) => a.findIndex((x) => x.id === z.id) === i
  );

  // Get SKUs for selected category
  const skusForCategory = capabilities
    .filter((c: any) => c.is_enabled && c.capability_key === selectedCategory)
    .map((c: any) => ({ id: c.sku_id, name: c.service_skus?.name || c.sku_id }));

  // Get levels for selected SKU
  const levelsQuery = useSkuLevels(selectedSku || null);
  const levels = levelsQuery.data;

  const canCreate = selectedCategory && selectedZone;

  const handleCreate = async () => {
    if (!canCreate) return;
    try {
      const result = await createLink.mutateAsync({
        category_key: selectedCategory,
        zone_id: selectedZone,
        sku_id: selectedSku || undefined,
        default_level_id: selectedLevel || undefined,
        default_cadence: cadence,
      });
      toast.success("Invite link created!");
      navigate("/provider/byoc");
    } catch (err: any) {
      toast.error(err.message || "Failed to create link");
    }
  };

  return (
    <div className="animate-fade-in p-4 pb-24 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/provider/byoc")} aria-label="Back to BYOC center">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-h2">Create Invite Link</h1>
          <p className="text-caption mt-0.5">Generate a link for your existing customers</p>
        </div>
      </div>

      {/* Category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Service Category *</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {enabledCategories.map((cat: string) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedSku("");
                  setSelectedLevel("");
                }}
                className="capitalize"
              >
                {cat.replace(/_/g, " ")}
              </Button>
            ))}
          </div>
          {enabledCategories.length === 0 && (
            <p className="text-sm text-muted-foreground">No enabled categories found.</p>
          )}
        </CardContent>
      </Card>

      {/* Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Service Zone *</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {uniqueZones.map((zone: any) => (
              <Button
                key={zone.id}
                variant={selectedZone === zone.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedZone(zone.id)}
              >
                {zone.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SKU (optional) */}
      {selectedCategory && skusForCategory.length > 0 && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-base">Service (optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={!selectedSku ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedSku("");
                  setSelectedLevel("");
                }}
              >
                Any
              </Button>
              {skusForCategory.map((sku: any) => (
                <Button
                  key={sku.id}
                  variant={selectedSku === sku.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedSku(sku.id);
                    setSelectedLevel("");
                  }}
                >
                  {sku.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Level (optional, if SKU selected) */}
      {selectedSku && levelsQuery.isLoading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
      {selectedSku && !levelsQuery.isLoading && levels && levels.length > 0 && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-base">Default Level (optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={!selectedLevel ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedLevel("")}
              >
                Auto
              </Button>
              {levels.map((level: any) => (
                <Button
                  key={level.id}
                  variant={selectedLevel === level.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedLevel(level.id)}
                >
                  {level.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cadence */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Default Cadence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {CADENCES.map((c) => (
              <Button
                key={c.value}
                variant={cadence === c.value ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setCadence(c.value)}
              >
                {c.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create */}
      <Button
        className="w-full"
        disabled={!canCreate || createLink.isPending}
        onClick={handleCreate}
      >
        {createLink.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Link2 className="h-4 w-4 mr-2" />
        )}
        Create Invite Link
      </Button>
    </div>
  );
}
