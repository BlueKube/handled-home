import { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCreateTicket } from "@/hooks/useCreateTicket";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SupportCategoryTile, getAllCategories, type SupportCategory } from "@/components/support/SupportCategoryTile";
import { ArrowLeft, CheckCircle2, Camera, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Step = "category" | "details" | "submitted";

export default function CustomerSupportNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetJobId = searchParams.get("job_id") || undefined;

  const [step, setStep] = useState<Step>("category");
  const [category, setCategory] = useState<SupportCategory | null>(null);
  const [note, setNote] = useState("");
  const [createdTicketId, setCreatedTicketId] = useState<string | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createTicket = useCreateTicket();

  const ticketTypeMap: Record<SupportCategory, string> = {
    quality: "quality",
    missed: "missed_item",
    damage: "damage",
    billing: "billing",
    safety: "safety",
    routine_change: "routine_change",
  };

  const severityMap: Record<SupportCategory, string> = {
    quality: "medium",
    missed: "medium",
    damage: "high",
    billing: "low",
    safety: "critical",
    routine_change: "low",
  };

  const handleCategorySelect = (cat: SupportCategory) => {
    setCategory(cat);
    setStep("details");
  };

  const handleSubmit = async () => {
    if (!category || !note.trim()) return;

    try {
      const ticket = await createTicket.mutateAsync({
        ticket_type: ticketTypeMap[category],
        category,
        job_id: presetJobId,
        customer_note: note.trim(),
        severity: severityMap[category],
      });
      setCreatedTicketId(ticket.id);

      // Upload photos if any
      for (const file of photoFiles) {
        const path = `tickets/${ticket.id}/${Date.now()}_${file.name}`;
        const { error: uploadErr } = await supabase.storage
          .from("support-attachments")
          .upload(path, file);
        if (!uploadErr) {
          await supabase.from("support_attachments").insert({
            ticket_id: ticket.id,
            storage_path: path,
            file_type: file.type.startsWith("image/") ? "image" : "document",
            uploaded_by_user_id: (await supabase.auth.getUser()).data.user?.id,
            uploaded_by_role: "customer",
          });
        }
      }

      setStep("submitted");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="px-4 py-6 pb-24 max-w-lg mx-auto space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 -ml-2"
          onClick={() => {
            if (step === "details") setStep("category");
            else navigate("/customer/support");
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          {step === "details" ? "Back" : "Support"}
        </Button>
      </div>

      {/* Step: Category */}
      {step === "category" && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-h2">What happened?</h1>
            <p className="text-caption">Choose the type of issue</p>
          </div>
          <div className="space-y-2">
            {getAllCategories().map((cat) => (
              <SupportCategoryTile
                key={cat}
                category={cat}
                selected={category === cat}
                onClick={handleCategorySelect}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step: Details */}
      {step === "details" && category && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-h2">Tell us more</h1>
            <p className="text-caption">
              {category === "damage"
                ? "Describe the damage and we'll get it sorted"
                : "A quick note helps us resolve this faster"}
            </p>
          </div>

          {presetJobId && (
            <Card className="p-3 bg-secondary/50">
              <p className="text-xs text-muted-foreground">Linked to a recent visit</p>
            </Card>
          )}

          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 500))}
            placeholder="Describe what happened…"
            rows={4}
            autoFocus
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{note.length}/500</span>
          </div>

          {/* P3: Photo upload */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                setPhotoFiles((prev) => [...prev, ...files].slice(0, 5));
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => fileInputRef.current?.click()}
              disabled={photoFiles.length >= 5}
            >
              <Camera className="h-4 w-4" />
              {photoFiles.length > 0 ? `${photoFiles.length} photo(s)` : "Add photos"}
            </Button>
            {photoFiles.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {photoFiles.map((f, i) => (
                  <div key={i} className="relative">
                    <img
                      src={URL.createObjectURL(f)}
                      alt=""
                      className="h-16 w-16 rounded-lg object-cover border"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoFiles((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            className="w-full"
            disabled={!note.trim() || createTicket.isPending}
            onClick={handleSubmit}
          >
            {createTicket.isPending ? "Submitting…" : "Submit"}
          </Button>
        </div>
      )}

      {/* Step: Submitted */}
      {step === "submitted" && (
        <div className="text-center py-12 space-y-4">
          <CheckCircle2 className="h-14 w-14 text-success mx-auto" />
          <div className="space-y-1">
            <p className="text-lg font-semibold">We're on it</p>
            <p className="text-sm text-muted-foreground">
              You'll hear from us soon. We'll try to resolve this as fast as possible.
            </p>
          </div>
          <div className="flex gap-2 justify-center">
            {createdTicketId && (
              <Button
                variant="outline"
                onClick={() => navigate(`/customer/support/tickets/${createdTicketId}`)}
              >
                View ticket
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate("/customer/support")}>
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
