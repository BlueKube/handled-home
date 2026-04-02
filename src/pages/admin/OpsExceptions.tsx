import { useState } from "react";
import { PageSkeleton } from "@/components/PageSkeleton";
import { useOpsExceptions, type OpsExceptionFilters, type OpsExceptionWithRelations } from "@/hooks/useOpsExceptions";
import { OpsExceptionQueue } from "@/components/admin/ops/OpsExceptionQueue";
import { OpsExceptionDetailPanel } from "@/components/admin/ops/OpsExceptionDetailPanel";

export default function OpsExceptions() {
  const [filters, setFilters] = useState<OpsExceptionFilters>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: exceptions, isLoading, isError } = useOpsExceptions(filters);

  if (isLoading) return <PageSkeleton />;

  if (isError) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-destructive">Failed to load exceptions. Please refresh the page.</p>
      </div>
    );
  }

  const selected = exceptions?.find((e) => e.id === selectedId) ?? null;

  return (
    <div className="flex h-[calc(100vh-3rem)] animate-fade-in">
      {/* Queue panel */}
      <div className={`${selectedId ? "w-1/2 border-r" : "w-full"} overflow-y-auto transition-all`}>
        <OpsExceptionQueue
          exceptions={exceptions ?? []}
          filters={filters}
          onFilterChange={setFilters}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>

      {/* Detail panel */}
      {selectedId && (
        <div className="w-1/2 overflow-y-auto">
          <OpsExceptionDetailPanel
            exceptionId={selectedId}
            onClose={() => setSelectedId(null)}
          />
        </div>
      )}
    </div>
  );
}
