import { useState } from "react";
import { PageSkeleton } from "@/components/PageSkeleton";
import { useOpsExceptions, type OpsExceptionFilters } from "@/hooks/useOpsExceptions";
import { OpsExceptionQueue } from "@/components/admin/ops/OpsExceptionQueue";
import { OpsExceptionDetailPanel } from "@/components/admin/ops/OpsExceptionDetailPanel";

export default function AdminExceptions() {
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

  return (
    <div className="flex h-[calc(100vh-3rem)] animate-fade-in">
      <div className={`${selectedId ? "w-1/2 border-r" : "w-full"} overflow-y-auto transition-all`}>
        <OpsExceptionQueue
          exceptions={exceptions ?? []}
          filters={filters}
          onFilterChange={setFilters}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>

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
