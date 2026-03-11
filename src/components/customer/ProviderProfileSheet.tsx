import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Shield, Star, CheckCircle, MapPin } from "lucide-react";

export interface ProviderInfo {
  id: string;
  name: string;
  avatar_url?: string | null;
  rating?: number | null;
  jobs_completed?: number;
  specialties?: string[];
  is_insured?: boolean;
  zone_name?: string;
}

interface ProviderProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: ProviderInfo | null;
}

export function ProviderProfileSheet({ open, onOpenChange, provider }: ProviderProfileSheetProps) {
  if (!provider) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh]">
        <SheetHeader>
          <SheetTitle className="text-left">Your Provider</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Provider identity */}
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              {provider.avatar_url ? (
                <img
                  src={provider.avatar_url}
                  alt={provider.name}
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold text-primary">
                  {provider.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="font-semibold text-lg">{provider.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {provider.rating != null && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-medium">{provider.rating.toFixed(1)}</span>
                  </div>
                )}
                {provider.jobs_completed != null && provider.jobs_completed > 0 && (
                  <span className="text-xs text-muted-foreground">
                    · {provider.jobs_completed} jobs completed
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1">
              <CheckCircle className="h-3 w-3 text-accent" />
              Verified Provider
            </Badge>
            {provider.is_insured && (
              <Badge variant="secondary" className="gap-1">
                <Shield className="h-3 w-3 text-primary" />
                Fully Insured
              </Badge>
            )}
            {provider.zone_name && (
              <Badge variant="secondary" className="gap-1">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                {provider.zone_name}
              </Badge>
            )}
          </div>

          {/* Specialties */}
          {provider.specialties && provider.specialties.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Specialties</p>
              <div className="flex flex-wrap gap-1.5">
                {provider.specialties.map((s) => (
                  <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Trust statement */}
          <div className="bg-muted/50 rounded-xl p-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              All Handled Home providers are background-checked, insured, and curated for quality.
              Your provider is rated by customers like you after every visit.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
