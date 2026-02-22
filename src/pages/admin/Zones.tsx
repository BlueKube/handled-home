import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RegionsTab } from "@/components/admin/RegionsTab";
import { ZonesTab } from "@/components/admin/ZonesTab";
import { InsightsTab } from "@/components/admin/InsightsTab";
import { ZoneFormSheet } from "@/components/admin/ZoneFormSheet";

export default function AdminZones() {
  const [tab, setTab] = useState("zones");
  const [createWithZip, setCreateWithZip] = useState<string[] | undefined>();
  const [createOpen, setCreateOpen] = useState(false);

  const handleCreateFromInsight = (zip: string) => {
    setCreateWithZip([zip]);
    setCreateOpen(true);
    setTab("zones");
  };

  return (
    <div className="animate-fade-in space-y-4 pb-24">
      <div>
        <h1 className="text-h2">Regions & Zones</h1>
        <p className="text-caption">Territory governance, coverage, and capacity.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full">
          <TabsTrigger value="regions" className="flex-1">Regions</TabsTrigger>
          <TabsTrigger value="zones" className="flex-1">Zones</TabsTrigger>
          <TabsTrigger value="insights" className="flex-1">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="regions" className="mt-4">
          <RegionsTab />
        </TabsContent>

        <TabsContent value="zones" className="mt-4">
          <ZonesTab />
        </TabsContent>

        <TabsContent value="insights" className="mt-4">
          <InsightsTab onCreateZoneWithZip={handleCreateFromInsight} />
        </TabsContent>
      </Tabs>

      <ZoneFormSheet open={createOpen} onOpenChange={setCreateOpen} prefillZips={createWithZip} />
    </div>
  );
}
