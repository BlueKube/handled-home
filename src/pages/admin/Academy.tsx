import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Search } from "lucide-react";
import { AcademyModuleCard } from "@/components/academy/AcademyModuleCard";
import {
  ACADEMY_MODULES,
  ACADEMY_CATEGORIES,
  type AcademyCategory,
} from "@/constants/academy-modules";

const ALL_CATEGORIES = Object.keys(ACADEMY_CATEGORIES) as AcademyCategory[];

export default function AdminAcademy() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<AcademyCategory | "all">("all");

  const filtered = useMemo(() => {
    return ACADEMY_MODULES.filter((m) => {
      const matchesSearch =
        !search ||
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        m.subtitle.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        activeCategory === "all" || m.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  const totalMinutes = ACADEMY_MODULES.reduce((sum, m) => sum + m.estimatedMinutes, 0);

  return (
    <div className="animate-fade-in p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <GraduationCap className="h-7 w-7 text-primary" />
            <h1 className="text-h2">Academy</h1>
          </div>
          <p className="text-caption max-w-2xl">
            Operator training for the Handled Home admin console. Written by veterans,
            for new hires. Each module teaches not just <em>what</em> buttons to click,
            but <em>when</em> to click them — and what happens when you don't.
          </p>
        </div>
        <div className="text-right text-sm text-muted-foreground shrink-0">
          <p>{ACADEMY_MODULES.length} modules</p>
          <p>~{Math.round(totalMinutes / 60)} hours total</p>
        </div>
      </div>

      {/* Search + Category Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search modules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={activeCategory === "all" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setActiveCategory("all")}
          >
            All
          </Badge>
          {ALL_CATEGORIES.map((cat) => (
            <Badge
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setActiveCategory(cat)}
            >
              {ACADEMY_CATEGORIES[cat].label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Module Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No modules match your search.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeCategory === "all" ? (
            /* Group by category when showing all */
            ALL_CATEGORIES.map((cat) => {
              const catModules = filtered.filter((m) => m.category === cat);
              if (catModules.length === 0) return null;
              return (
                <div key={cat} className="space-y-3">
                  <div>
                    <h2 className="text-sm font-semibold">{ACADEMY_CATEGORIES[cat].label}</h2>
                    <p className="text-xs text-muted-foreground">{ACADEMY_CATEGORIES[cat].description}</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {catModules.map((m) => (
                      <AcademyModuleCard
                        key={m.id}
                        id={m.id}
                        title={m.title}
                        subtitle={m.subtitle}
                        icon={m.icon}
                        estimatedMinutes={m.estimatedMinutes}
                        category={ACADEMY_CATEGORIES[m.category].label}
                        sectionCount={m.sections.length || 0}
                        onClick={() => navigate(`/admin/academy/${m.id}`)}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filtered.map((m) => (
                <AcademyModuleCard
                  key={m.id}
                  id={m.id}
                  title={m.title}
                  subtitle={m.subtitle}
                  icon={m.icon}
                  estimatedMinutes={m.estimatedMinutes}
                  category={ACADEMY_CATEGORIES[m.category].label}
                  sectionCount={m.sections.length || 0}
                  onClick={() => navigate(`/admin/academy/${m.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
