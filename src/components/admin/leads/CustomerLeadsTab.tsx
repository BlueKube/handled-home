import { UserCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomerLead, STATUS_COLORS, CUSTOMER_STATUS_OPTIONS } from "./types";

export function CustomerLeadsTab({ leads, isLoading, isError, onUpdateStatus }: {
  leads: CustomerLead[];
  isLoading: boolean;
  isError: boolean;
  onUpdateStatus: (id: string, status: string) => void;
}) {
  if (isLoading) return <div className="space-y-2 mt-4"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>;
  if (isError) return <Card className="mt-4"><CardContent className="py-8 text-center"><p className="text-sm text-destructive">Failed to load customer leads.</p></CardContent></Card>;

  if (leads.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="py-12 text-center">
          <UserCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">No customer leads yet</p>
          <p className="text-xs text-muted-foreground mt-1">Customer leads from the moving wizard and waitlist will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-4 border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Email</th>
              <th className="text-left p-3 font-medium">Phone</th>
              <th className="text-left p-3 font-medium">ZIP</th>
              <th className="text-left p-3 font-medium">Source</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-3 font-medium">{lead.email}</td>
                <td className="p-3 text-xs text-muted-foreground">{lead.phone || "—"}</td>
                <td className="p-3">{lead.zip_code}</td>
                <td className="p-3">
                  <Badge variant="outline" className="text-xs capitalize">{lead.source}</Badge>
                </td>
                <td className="p-3">
                  <Select value={lead.status} onValueChange={(s) => onUpdateStatus(lead.id, s)}>
                    <SelectTrigger className="h-7 w-28">
                      <Badge className={`text-xs ${STATUS_COLORS[lead.status] ?? ""}`}>{lead.status}</Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {CUSTOMER_STATUS_OPTIONS.filter((s) => s !== "all").map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-3 text-xs text-muted-foreground">
                  {new Date(lead.created_at).toLocaleDateString()}
                  {lead.notified_at && (
                    <span className="block text-[10px] text-violet-500">
                      Notified {new Date(lead.notified_at).toLocaleDateString()}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
