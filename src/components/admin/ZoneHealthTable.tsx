import { useState, useMemo } from "react";
import { useZoneHealthRolling, type ZoneHealthRollingRow } from "@/hooks/useZoneHealthRolling";
import { useAssignmentConfig } from "@/hooks/useAssignmentConfig";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowUpDown } from "lucide-react";

type SortKey = "zone_name" | "jobs_today" | "unassigned_locked" | "reschedule_rate" | "proof_missing_rate" | "issue_count_7d" | "open_exceptions";

const COLUMNS: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "zone_name", label: "Zone" },
  { key: "jobs_today", label: "Jobs Today", align: "right" },
  { key: "unassigned_locked", label: "Unassigned", align: "right" },
  { key: "reschedule_rate", label: "Resched %", align: "right" },
  { key: "proof_missing_rate", label: "Proof Missing %", align: "right" },
  { key: "issue_count_7d", label: "Issues (7d)", align: "right" },
  { key: "open_exceptions", label: "Open Exc.", align: "right" },
];

interface CellThresholds {
  max_unassigned_locked: number;
  max_reschedule_rate_locked: number;
  max_proof_missing_rate: number;
  max_open_exceptions: number;
}

const CELL_DEFAULTS: CellThresholds = {
  max_unassigned_locked: 0,
  max_reschedule_rate_locked: 5,
  max_proof_missing_rate: 10,
  max_open_exceptions: 5,
};

function parseCellThresholds(config: any[]): CellThresholds {
  const t = { ...CELL_DEFAULTS };
  for (const row of config) {
    const key = row.config_key as string;
    const val = typeof row.config_value === "number" ? row.config_value : Number(row.config_value);
    if (isNaN(val)) continue;
    if (key === "autopilot_max_unassigned_locked") t.max_unassigned_locked = val;
    else if (key === "autopilot_max_reschedule_rate_locked") t.max_reschedule_rate_locked = val;
    else if (key === "autopilot_max_proof_missing_rate") t.max_proof_missing_rate = val;
    else if (key === "autopilot_max_open_exceptions") t.max_open_exceptions = val;
  }
  return t;
}

function cellAlert(key: SortKey, row: ZoneHealthRollingRow, t: CellThresholds): boolean {
  if (key === "unassigned_locked") return row.unassigned_locked > t.max_unassigned_locked;
  if (key === "reschedule_rate") return row.reschedule_rate > t.max_reschedule_rate_locked;
  if (key === "proof_missing_rate") return row.proof_missing_rate > t.max_proof_missing_rate;
  if (key === "open_exceptions") return row.open_exceptions > t.max_open_exceptions;
  return false;
}

export function ZoneHealthTable() {
  const { data: zones, isLoading } = useZoneHealthRolling();
  const { data: configRows } = useAssignmentConfig();
  const [sortKey, setSortKey] = useState<SortKey>("open_exceptions");
  const [sortAsc, setSortAsc] = useState(false);

  const thresholds = useMemo(() => parseCellThresholds(configRows ?? []), [configRows]);

  if (isLoading) return <Skeleton className="h-48 rounded-xl" />;
  if (!zones || zones.length === 0) return null;

  const sorted = [...zones].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === "string") return sortAsc ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
    return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Zone Health (Rolling 7 Days)
        </h2>
      </div>
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50">
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "px-3 py-2 font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none",
                      col.align === "right" ? "text-right" : "text-left"
                    )}
                    onClick={() => toggleSort(col.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key && (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr
                  key={row.zone_id}
                  className="border-t hover:bg-muted/30 transition-colors"
                >
                  <td className="px-3 py-2 font-medium">{row.zone_name}</td>
                  <td className="px-3 py-2 text-right">{row.jobs_today}</td>
                  <td className={cn("px-3 py-2 text-right", cellAlert("unassigned_locked", row, thresholds) && "text-destructive font-semibold")}>
                    {row.unassigned_locked}
                    {row.unassigned_locked > 0 && (
                      <Badge variant="destructive" className="ml-1 text-[9px] px-1 py-0">!</Badge>
                    )}
                  </td>
                  <td className={cn("px-3 py-2 text-right", cellAlert("reschedule_rate", row, thresholds) && "text-destructive font-semibold")}>
                    {row.reschedule_rate}%
                  </td>
                  <td className={cn("px-3 py-2 text-right", cellAlert("proof_missing_rate", row, thresholds) && "text-destructive font-semibold")}>
                    {row.proof_missing_rate}%
                  </td>
                  <td className="px-3 py-2 text-right">{row.issue_count_7d}</td>
                  <td className={cn("px-3 py-2 text-right", cellAlert("open_exceptions", row, thresholds) && "text-destructive font-semibold")}>
                    {row.open_exceptions}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
