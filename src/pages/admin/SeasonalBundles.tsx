import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { useAdminBundles, type AdminBundle } from "@/hooks/useAdminBundles";
import { BundleRow } from "@/components/admin/bundles/BundleRow";
import { BundleEditSheet } from "@/components/admin/bundles/BundleEditSheet";
import { QueryErrorCard } from "@/components/QueryErrorCard";

export default function SeasonalBundles() {
  const [editing, setEditing] = useState<AdminBundle | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { isLoading, isError, refetch, grouped } = useAdminBundles();

  const handleNew = () => {
    setEditing(null);
    setSheetOpen(true);
  };

  const handleEdit = (b: AdminBundle) => {
    setEditing(b);
    setSheetOpen(true);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-h2">Seasonal Bundles</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Curate seasonal bundles. Customers see active bundles in matching zones during
            the configured window.
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-1" /> New bundle
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      ) : isError ? (
        <QueryErrorCard
          message="Couldn't load bundles."
          onRetry={() => refetch()}
        />
      ) : (
        <>
          <BundleSection
            title="Active"
            bundles={grouped.active}
            emptyMessage="No active bundles. Promote a draft to flip it on."
            onEdit={handleEdit}
          />
          <BundleSection
            title="Drafts"
            bundles={grouped.draft}
            emptyMessage="No drafts. Tap New bundle to start one."
            onEdit={handleEdit}
          />
          <BundleSection
            title="Archived"
            bundles={grouped.archived}
            emptyMessage="No archived bundles."
            onEdit={handleEdit}
          />
        </>
      )}

      <BundleEditSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        bundle={editing}
      />
    </div>
  );
}

interface SectionProps {
  title: string;
  bundles: AdminBundle[];
  emptyMessage: string;
  onEdit: (b: AdminBundle) => void;
}

function BundleSection({ title, bundles, emptyMessage, onEdit }: SectionProps) {
  return (
    <section>
      <h2 className="text-h3 mb-3">
        {title}{" "}
        <span className="text-sm text-muted-foreground font-normal">
          ({bundles.length})
        </span>
      </h2>
      {bundles.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <Card className="p-0 divide-y divide-border">
          {bundles.map((b) => (
            <BundleRow key={b.id} bundle={b} onEdit={onEdit} />
          ))}
        </Card>
      )}
    </section>
  );
}
