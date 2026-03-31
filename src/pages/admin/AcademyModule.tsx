import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Clock, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AcademySectionRenderer } from "@/components/academy/AcademySection";
import { ACADEMY_MODULES, ACADEMY_CATEGORIES } from "@/constants/academy-modules";

export default function AdminAcademyModule() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();

  const moduleData = ACADEMY_MODULES.find((m) => m.id === moduleId);

  if (!moduleData) {
    return (
      <div className="animate-fade-in p-6 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/academy")}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Academy
        </Button>
        <div className="text-center py-12 text-muted-foreground">
          <p>Module not found.</p>
        </div>
      </div>
    );
  }

  const Icon = moduleData.icon;
  const hasSections = moduleData.sections.length > 0;

  return (
    <div className="animate-fade-in p-6 space-y-6 max-w-4xl">
      {/* Back nav */}
      <Button variant="ghost" size="sm" onClick={() => navigate("/admin/academy")}>
        <ChevronLeft className="h-4 w-4 mr-1" /> Back to Academy
      </Button>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-h2">{moduleData.title}</h1>
            <div className="flex items-center gap-3 mt-0.5">
              <Badge variant="outline" className="text-[10px]">
                {ACADEMY_CATEGORIES[moduleData.category].label}
              </Badge>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {moduleData.estimatedMinutes} min read
              </span>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{moduleData.subtitle}</p>
      </div>

      <Separator />

      {/* Content */}
      {hasSections ? (
        <div className="space-y-8">
          {moduleData.sections.map((section) => (
            <AcademySectionRenderer key={section.id} section={section} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 space-y-4">
          <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <p className="font-medium">Module Coming Soon</p>
            <p className="text-sm text-muted-foreground mt-1">
              This training module is being developed. Check back soon for the full guide
              with annotated screenshots, pro tips, and senior operator advice.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
