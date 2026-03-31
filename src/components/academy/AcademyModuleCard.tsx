import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AcademyModuleCardProps {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  estimatedMinutes: number;
  category: string;
  sectionCount: number;
  onClick: () => void;
}

export function AcademyModuleCard({
  title,
  subtitle,
  icon: Icon,
  estimatedMinutes,
  category,
  sectionCount,
  onClick,
}: AcademyModuleCardProps) {
  return (
    <Card
      className="p-4 cursor-pointer hover:border-primary/40 transition-colors group"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-sm truncate">{title}</h3>
            <Badge variant="outline" className="text-[10px] shrink-0">
              {category}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{subtitle}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {estimatedMinutes} min
            </span>
            <span className="text-xs text-muted-foreground">
              {sectionCount} sections
            </span>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-3" />
      </div>
    </Card>
  );
}
