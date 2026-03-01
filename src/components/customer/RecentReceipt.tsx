import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface RecentReceiptProps {
  job: {
    id: string;
    scheduled_date: string | null;
    status: string;
  } | null;
}

export function RecentReceipt({ job }: RecentReceiptProps) {
  const navigate = useNavigate();

  if (!job) {
    // Placeholder card
    return (
      <Card className="p-4 bg-muted/30 border-dashed">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-muted-foreground/50" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">Your Handled Receipts</p>
            <p className="text-xs text-muted-foreground/70">
              After your first visit, you'll see proof-of-work receipts here.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className="p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
      onClick={() => navigate(`/customer/visits/${job.id}`)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium">Last Visit</p>
            <p className="text-xs text-muted-foreground">
              {job.scheduled_date ? format(new Date(job.scheduled_date), "MMM d, yyyy") : "Completed"}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-xs gap-1">
          View
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    </Card>
  );
}
