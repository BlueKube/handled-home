import { useState } from "react";
import { Share2, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShareCardSheet } from "@/components/customer/ShareCardSheet";
import { useFrequencyCapCheck } from "@/hooks/useGrowthEvents";

interface PostJobSharePromptProps {
  jobId: string;
  zoneId?: string;
  category?: string;
}

const DISMISS_KEY = "share_prompt_dismissed_";

export function PostJobSharePrompt({ jobId, zoneId, category }: PostJobSharePromptProps) {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem(DISMISS_KEY + jobId) === "1";
  });
  const [shareOpen, setShareOpen] = useState(false);
  const capCheck = useFrequencyCapCheck("post_job_share", "share_per_week", zoneId, category);

  if (dismissed || capCheck.data?.suppressed) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY + jobId, "1");
    setDismissed(true);
  };

  return (
    <>
      <Card className="p-4 flex items-center justify-between bg-primary/5 border-primary/20">
        <div className="flex items-center gap-3 flex-1">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Share2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Share your results with neighbors?</p>
            <p className="text-xs text-muted-foreground">Let them see what Handled Home can do.</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button size="sm" variant="default" onClick={() => setShareOpen(true)}>
            Share
          </Button>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </Card>

      <ShareCardSheet
        open={shareOpen}
        onOpenChange={setShareOpen}
        jobId={jobId}
        zoneId={zoneId}
        category={category}
      />
    </>
  );
}
