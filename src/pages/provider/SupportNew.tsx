import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateTicket } from "@/hooks/useCreateTicket";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, CheckCircle2, Send } from "lucide-react";
import { toast } from "sonner";

const PROVIDER_CATEGORIES = [
  { key: "payment", label: "Payment Issue", description: "Missing or incorrect payment", severity: "high" },
  { key: "scheduling", label: "Scheduling Problem", description: "Job timing or route concerns", severity: "medium" },
  { key: "customer_issue", label: "Customer Issue", description: "Problem at a customer's property", severity: "medium" },
  { key: "equipment", label: "Equipment / Supplies", description: "Need supplies or equipment support", severity: "low" },
  { key: "account", label: "Account / Settings", description: "Profile, coverage, or compliance help", severity: "low" },
  { key: "other", label: "Other", description: "Something else not listed above", severity: "medium" },
] as const;

type Step = "category" | "details" | "submitted";

export default function ProviderSupportNew() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("category");
  const [category, setCategory] = useState<(typeof PROVIDER_CATEGORIES)[number] | null>(null);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const createTicket = useCreateTicket();

  const handleCategorySelect = (cat: (typeof PROVIDER_CATEGORIES)[number]) => {
    setCategory(cat);
    setStep("details");
  };

  const handleSubmit = async () => {
    if (!category) return;
    if (description.trim().length < 10) {
      setError("Description must be at least 10 characters");
      return;
    }
    setError("");
    try {
      await createTicket.mutateAsync({
        ticket_type: "provider_request",
        category: category.key,
        customer_note: description.trim(),
        severity: category.severity,
      });
      setStep("submitted");
    } catch (err: any) {
      toast.error(err.message || "Failed to create ticket");
    }
  };

  if (step === "submitted") {
    return (
      <div className="animate-fade-in p-4 pb-24 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <CheckCircle2 className="h-16 w-16 text-success mb-4" />
        <h1 className="text-h2 mb-2">Ticket Submitted</h1>
        <p className="text-muted-foreground mb-6">
          Our team will review your request and respond within 24–48 hours.
        </p>
        <Button className="w-full" onClick={() => navigate("/provider/support")}>
          Back to Support
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-4 pb-24 space-y-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => step === "details" ? setStep("category") : navigate("/provider/support")}
          aria-label="Go back"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-h2">{step === "category" ? "New Ticket" : "Describe the Issue"}</h1>
          <p className="text-caption mt-0.5">
            {step === "category" ? "What do you need help with?" : category?.label}
          </p>
        </div>
      </div>

      {step === "category" && (
        <div className="space-y-3">
          {PROVIDER_CATEGORIES.map((cat) => (
            <Card
              key={cat.key}
              className="p-4 press-feedback cursor-pointer hover:border-primary/20"
              onClick={() => handleCategorySelect(cat)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleCategorySelect(cat); } }}
            >
              <p className="text-sm font-medium">{cat.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
            </Card>
          ))}
        </div>
      )}

      {step === "details" && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description *</label>
            <Textarea
              placeholder="Describe the issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              className="resize-none"
              rows={5}
            />
            <div className="flex justify-between">
              {error ? (
                <p className="text-xs text-destructive">{error}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Minimum 10 characters</p>
              )}
              <p className="text-xs text-muted-foreground">{description.length}/500</p>
            </div>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={createTicket.isPending}
          >
            <Send className="h-4 w-4 mr-2" />
            {createTicket.isPending ? "Submitting..." : "Submit Ticket"}
          </Button>
        </div>
      )}
    </div>
  );
}
