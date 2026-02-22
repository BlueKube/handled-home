import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, CheckCircle, Clock, AlertCircle, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProviderApplication } from "@/hooks/useProviderApplication";
import { useZoneReadiness, ZoneReadinessResult } from "@/hooks/useZoneReadiness";

const CATEGORIES = [
  { value: "lawn_care", label: "Lawn Care" },
  { value: "cleaning", label: "House Cleaning" },
  { value: "pool", label: "Pool Service" },
  { value: "pest_control", label: "Pest Control" },
  { value: "landscaping", label: "Landscaping" },
  { value: "handyman", label: "Handyman" },
];

const STATUS_ICONS: Record<string, any> = {
  open: <CheckCircle className="h-5 w-5 text-green-600" />,
  soft_launch: <Sparkles className="h-5 w-5 text-primary" />,
  waitlist: <Clock className="h-5 w-5 text-amber-500" />,
  not_supported: <AlertCircle className="h-5 w-5 text-muted-foreground" />,
};

const STATUS_MESSAGES: Record<string, { title: string; desc: string }> = {
  open: { title: "You're eligible!", desc: "Complete onboarding to start earning." },
  soft_launch: { title: "Limited spots available", desc: "Apply now for priority access." },
  waitlist: { title: "Not open yet", desc: "Invite customers to accelerate your launch." },
  not_supported: { title: "Area not served", desc: "We'll notify you when we expand here." },
};

export default function ProviderApply() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("");
  const [zipInput, setZipInput] = useState("");
  const [zipCodes, setZipCodes] = useState<string[]>([]);
  const [readiness, setReadiness] = useState<ZoneReadinessResult | null>(null);

  const { application, submitApplication } = useProviderApplication();
  const zoneCheck = useZoneReadiness();

  const addZip = () => {
    const zip = zipInput.trim();
    if (zip && /^\d{5}$/.test(zip) && !zipCodes.includes(zip)) {
      setZipCodes([...zipCodes, zip]);
      setZipInput("");
    }
  };

  const removeZip = (zip: string) => setZipCodes(zipCodes.filter((z) => z !== zip));

  const checkAndSubmit = async () => {
    const result = await zoneCheck.mutateAsync({ zip_codes: zipCodes, category });
    setReadiness(result);

    if (result.status === "open" || result.status === "soft_launch") {
      submitApplication.mutate({ category, zip_codes: zipCodes });
    } else {
      submitApplication.mutate({ category, zip_codes: zipCodes });
    }
  };

  // If they already have an application, show status
  if (application.data && !readiness) {
    const app = application.data;
    const msg = STATUS_MESSAGES[app.status] ?? STATUS_MESSAGES.waitlist;
    return (
      <div className="px-4 py-6 space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-xl font-bold">Application</h1>
        </div>
        <Card>
          <CardContent className="py-6 text-center space-y-3">
            {STATUS_ICONS[app.status] ?? STATUS_ICONS.waitlist}
            <h2 className="text-lg font-semibold">{msg.title}</h2>
            <p className="text-sm text-muted-foreground">{msg.desc}</p>
            <Badge variant="outline" className="capitalize">{app.status}</Badge>
            {app.status === "approved" && (
              <Button onClick={() => navigate("/provider/onboarding")} className="w-full mt-4">
                Start Onboarding
              </Button>
            )}
            {app.status === "waitlisted" && (
              <Button onClick={() => navigate("/provider/referrals")} variant="outline" className="w-full mt-4">
                Invite Customers to Unlock
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-xl font-bold">Apply to Handled Home</h1>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">What do you do?</h2>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((c) => (
              <Card
                key={c.value}
                className={`cursor-pointer transition-colors ${category === c.value ? "border-primary bg-primary/5" : "hover:bg-accent/50"}`}
                onClick={() => setCategory(c.value)}
              >
                <CardContent className="py-4 text-center">
                  <p className="text-sm font-medium">{c.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button className="w-full" disabled={!category} onClick={() => setStep(2)}>
            Continue
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Where do you work?</h2>
          <p className="text-sm text-muted-foreground">Enter the zip codes you serve.</p>

          <div className="flex gap-2">
            <Input
              placeholder="Enter zip code"
              value={zipInput}
              onChange={(e) => setZipInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addZip()}
              maxLength={5}
            />
            <Button variant="outline" onClick={addZip}>Add</Button>
          </div>

          {zipCodes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {zipCodes.map((z) => (
                <Badge key={z} variant="secondary" className="cursor-pointer" onClick={() => removeZip(z)}>
                  <MapPin className="h-3 w-3 mr-1" /> {z} ×
                </Badge>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button className="flex-1" disabled={zipCodes.length === 0} onClick={() => setStep(3)}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 3 && !readiness && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Review & Submit</h2>
          <Card>
            <CardContent className="py-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Category</span>
                <span className="text-sm font-medium capitalize">{category.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Zip Codes</span>
                <span className="text-sm font-medium">{zipCodes.join(", ")}</span>
              </div>
            </CardContent>
          </Card>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
            <Button className="flex-1" onClick={checkAndSubmit} disabled={zoneCheck.isPending || submitApplication.isPending}>
              {zoneCheck.isPending ? "Checking..." : "Submit Application"}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && readiness && (
        <div className="space-y-4">
          <Card>
            <CardContent className="py-6 text-center space-y-3">
              {STATUS_ICONS[readiness.status]}
              <h2 className="text-lg font-semibold">{STATUS_MESSAGES[readiness.status].title}</h2>
              <p className="text-sm text-muted-foreground">{STATUS_MESSAGES[readiness.status].desc}</p>
              {readiness.status === "open" && (
                <Button onClick={() => navigate("/provider/onboarding")} className="w-full mt-4">
                  Start Onboarding
                </Button>
              )}
              {readiness.status === "waitlist" && (
                <Button onClick={() => navigate("/provider/referrals")} variant="outline" className="w-full mt-4">
                  Start Inviting Customers
                </Button>
              )}
              {(readiness.status === "soft_launch" || readiness.status === "not_supported") && (
                <Button onClick={() => navigate("/provider/referrals")} variant="outline" className="w-full mt-4">
                  Go to Growth Hub
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
