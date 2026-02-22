import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function CustomerDashboard() {
  const { user } = useAuth();
  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-1">Your home is handled.</h1>
      <p className="text-muted-foreground mb-6">Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}.</p>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <CalendarDays className="h-5 w-5 text-accent" />
            <CardTitle className="text-base">Next Service Day</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Tuesday</p>
            <p className="text-sm text-muted-foreground">No services selected yet</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <CardTitle className="text-base">Recent Visits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-muted-foreground">No completed visits yet</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
