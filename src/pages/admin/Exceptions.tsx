import { useAdminBilling } from "@/hooks/useAdminBilling";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageSkeleton } from "@/components/PageSkeleton";

export default function AdminExceptions() {
  const { exceptions, isLoading } = useAdminBilling();

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="px-4 py-6 space-y-4 animate-fade-in pb-20">
      <h1 className="text-2xl font-bold">Exceptions</h1>

      {exceptions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">No open exceptions. 🎉</p>
      ) : (
        <div className="space-y-2">
          {exceptions.map((ex) => (
            <Card key={ex.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={ex.severity === "HIGH" ? "destructive" : "secondary"} className="text-[10px]">
                    {ex.severity}
                  </Badge>
                  <span className="text-sm font-semibold">{ex.type.replace(/_/g, " ")}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {ex.entity_type} • Created {new Date(ex.created_at).toLocaleDateString()}
                </p>
                {ex.next_action && (
                  <p className="text-sm text-foreground">{ex.next_action}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
