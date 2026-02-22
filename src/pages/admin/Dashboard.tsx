import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, MapPin, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1">Admin Console</h1>
      <p className="text-muted-foreground mb-6">Operations overview.</p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Users className="h-5 w-5 text-accent" />
            <CardTitle className="text-base">Customers</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">0</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <DollarSign className="h-5 w-5 text-accent" />
            <CardTitle className="text-base">MRR</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">$0</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <MapPin className="h-5 w-5 text-accent" />
            <CardTitle className="text-base">Active Zones</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">0</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            <CardTitle className="text-base">Utilization</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">0%</p></CardContent>
        </Card>
      </div>
    </div>
  );
}
