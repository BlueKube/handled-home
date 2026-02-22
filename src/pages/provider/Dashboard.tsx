import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Clock } from "lucide-react";

export default function ProviderDashboard() {
  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-1">Provider Dashboard</h1>
      <p className="text-muted-foreground mb-6">Your jobs for today.</p>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Briefcase className="h-5 w-5 text-accent" />
            <CardTitle className="text-base">Today's Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-muted-foreground">No jobs assigned today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Clock className="h-5 w-5 text-accent" />
            <CardTitle className="text-base">Estimated Time</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0 min</p>
            <p className="text-sm text-muted-foreground">No scheduled work</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
