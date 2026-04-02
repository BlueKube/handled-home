import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Referral, STATUS_COLORS, REFERRAL_STATUS_OPTIONS } from "./types";

export function ReferralsTab({ referrals, isLoading, isError, onUpdateStatus }: {
  referrals: Referral[];
  isLoading: boolean;
  isError: boolean;
  onUpdateStatus: (id: string, status: string) => void;
}) {
  if (isLoading) return <div className="space-y-2 mt-4"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>;
  if (isError) return <Card className="mt-4"><CardContent className="py-8 text-center"><p className="text-sm text-destructive">Failed to load referrals.</p></CardContent></Card>;

  if (referrals.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="py-12 text-center">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">No referrals yet</p>
          <p className="text-xs text-muted-foreground mt-1">Provider-to-provider referrals from the "Know someone?" form will appear here.</p>
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
              <th className="text-left p-3 font-medium">Referred By</th>
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-left p-3 font-medium">Contact</th>
              <th className="text-left p-3 font-medium">Category</th>
              <th className="text-left p-3 font-medium">ZIP</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {referrals.map((ref) => (
              <tr key={ref.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-3 text-xs">{ref.referrer_email}</td>
                <td className="p-3 font-medium">{ref.referred_name}</td>
                <td className="p-3 text-xs">{ref.referred_contact}</td>
                <td className="p-3">
                  <Badge variant="outline" className="text-xs capitalize">
                    {ref.referred_category.replace(/_/g, " ")}
                  </Badge>
                </td>
                <td className="p-3">{ref.zip_code}</td>
                <td className="p-3">
                  <Select value={ref.status} onValueChange={(s) => onUpdateStatus(ref.id, s)}>
                    <SelectTrigger className="h-7 w-28">
                      <Badge className={`text-xs ${STATUS_COLORS[ref.status] ?? ""}`}>{ref.status}</Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {REFERRAL_STATUS_OPTIONS.filter((s) => s !== "all").map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-3 text-xs text-muted-foreground">{new Date(ref.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
