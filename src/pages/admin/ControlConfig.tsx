import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminMembership } from "@/hooks/useAdminMembership";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Shield, Brain, Scale, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ConfigEntry {
  id: string;
  config_key: string;
  config_value: any;
  description: string | null;
  updated_at: string;
  updated_by_user_id: string | null;
}

/* Group configs by category prefix */
const CATEGORY_MAP: Record<string, { keys: string[]; label: string; icon: React.ElementType }> = {
  incentives: {
    label: "Incentive Caps",
    icon: Scale,
    keys: ["byoc_bonus_weekly_cap_cents", "referral_reward_cap_cents", "max_credits_per_customer_cents", "founding_partner_bonus_weeks"],
  },
  algorithm: {
    label: "Algorithm Params",
    icon: Brain,
    keys: ["quality_score_weights", "quality_band_thresholds", "tier_weights", "daily_capacity_cap", "assignment_competition_slider"],
  },
  policy: {
    label: "Policy Guardrails",
    icon: Shield,
    keys: ["emergency_override_ttl_hours", "dunning_max_steps", "no_show_penalty_points", "probation_score_threshold", "suspension_score_threshold", "max_buffer_percent"],
  },
};

function ConfigEditor({ entry, isSuperuser }: { entry: ConfigEntry; isSuperuser: boolean }) {
  const qc = useQueryClient();
  const isJson = typeof entry.config_value === "object";
  const [value, setValue] = useState(isJson ? JSON.stringify(entry.config_value, null, 2) : String(entry.config_value));
  const [dirty, setDirty] = useState(false);

  const saveMut = useMutation({
    mutationFn: async () => {
      let parsed: any;
      try {
        parsed = JSON.parse(value);
      } catch {
        parsed = value;
      }
      const { error } = await supabase
        .from("admin_system_config")
        .update({ config_value: parsed, updated_at: new Date().toISOString() })
        .eq("id", entry.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Updated ${entry.config_key}`);
      setDirty(false);
      qc.invalidateQueries({ queryKey: ["admin-system-config"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-mono font-medium">{entry.config_key}</p>
            {entry.description && (
              <p className="text-xs text-muted-foreground">{entry.description}</p>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground">
            Updated {format(new Date(entry.updated_at), "MMM d, HH:mm")}
          </span>
        </div>
        {isJson ? (
          <Textarea
            className="font-mono text-xs"
            rows={4}
            value={value}
            onChange={(e) => { setValue(e.target.value); setDirty(true); }}
            disabled={!isSuperuser}
          />
        ) : (
          <Input
            className="font-mono text-sm"
            value={value}
            onChange={(e) => { setValue(e.target.value); setDirty(true); }}
            disabled={!isSuperuser}
          />
        )}
        {isSuperuser && dirty && (
          <Button size="sm" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
            {saveMut.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
            Save
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function ControlConfig() {
  const { isSuperuser } = useAdminMembership();

  const { data: configs, isLoading } = useQuery({
    queryKey: ["admin-system-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_system_config")
        .select("*")
        .order("config_key");
      if (error) throw error;
      return data as ConfigEntry[];
    },
  });

  const categorized = useMemo(() => {
    if (!configs) return {};
    const result: Record<string, ConfigEntry[]> = {};
    for (const [cat, def] of Object.entries(CATEGORY_MAP)) {
      result[cat] = configs.filter((c) => def.keys.includes(c.config_key));
    }
    // "Other" for uncategorized
    const allCategorized = Object.values(CATEGORY_MAP).flatMap((d) => d.keys);
    const other = configs.filter((c) => !allCategorized.includes(c.config_key));
    if (other.length > 0) result["other"] = other;
    return result;
  }, [configs]);

  if (isLoading) {
    return (
      <div className="animate-fade-in p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-6 space-y-5">
      <div>
        <h1 className="text-h2 flex items-center gap-2">
          <Settings className="h-5 w-5" />
          System Configuration
        </h1>
        <p className="text-caption">
          Platform dials and guardrails. {isSuperuser ? "Superuser: you can edit values." : "Read-only for your role."}
        </p>
      </div>

      <Tabs defaultValue="incentives">
        <TabsList>
          {Object.entries(CATEGORY_MAP).map(([key, def]) => {
            const Icon = def.icon;
            return (
              <TabsTrigger key={key} value={key} className="gap-1.5 text-xs">
                <Icon className="h-3.5 w-3.5" />
                {def.label}
              </TabsTrigger>
            );
          })}
          {categorized["other"]?.length > 0 && (
            <TabsTrigger value="other" className="text-xs">Other</TabsTrigger>
          )}
        </TabsList>

        {Object.entries(categorized).map(([cat, entries]) => (
          <TabsContent key={cat} value={cat} className="space-y-3 mt-4">
            {entries.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No config entries found for this category. They'll appear once seeded.
                  </p>
                </CardContent>
              </Card>
            ) : (
              entries.map((entry) => (
                <ConfigEditor key={entry.id} entry={entry} isSuperuser={isSuperuser} />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}