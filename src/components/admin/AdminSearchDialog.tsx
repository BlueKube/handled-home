import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminSearch, type SearchResult } from "@/hooks/useAdminSearch";
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, ClipboardCheck, CreditCard } from "lucide-react";

const TYPE_ICONS: Record<SearchResult["type"], React.ElementType> = {
  customer: Users,
  provider: Shield,
  job: ClipboardCheck,
  subscription: CreditCard,
};

const TYPE_LABELS: Record<SearchResult["type"], string> = {
  customer: "Customer",
  provider: "Provider",
  job: "Job",
  subscription: "Subscription",
};

export function AdminSearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const nav = useNavigate();

  const { data: results, isLoading } = useAdminSearch(query);

  // ⌘K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleSelect = useCallback((href: string) => {
    setOpen(false);
    setQuery("");
    nav(href);
  }, [nav]);

  // Group results by type
  const grouped = (results ?? []).reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  return (
    <>
      {/* Trigger button in command bar */}
      <div
        className="hidden md:flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5 text-sm text-muted-foreground max-w-xs w-full cursor-pointer hover:bg-muted transition-colors"
        onClick={() => setOpen(true)}
      >
        <span className="truncate">Search customers, providers, jobs…</span>
        <kbd className="ml-auto text-[10px] bg-background rounded px-1.5 py-0.5 border border-border font-mono">⌘K</kbd>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search by name, email, phone, job ID…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {query.length < 2 ? (
            <CommandEmpty>Type at least 2 characters to search…</CommandEmpty>
          ) : isLoading ? (
            <CommandEmpty>Searching…</CommandEmpty>
          ) : (results ?? []).length === 0 ? (
            <CommandEmpty>No results found.</CommandEmpty>
          ) : (
            Object.entries(grouped).map(([type, items]) => {
              const Icon = TYPE_ICONS[type as SearchResult["type"]];
              return (
                <CommandGroup key={type} heading={TYPE_LABELS[type as SearchResult["type"]]}>
                  {items.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={`${item.label} ${item.detail}`}
                      onSelect={() => handleSelect(item.href)}
                      className="cursor-pointer"
                    >
                      <Icon className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{item.label}</span>
                        {item.detail && (
                          <span className="ml-2 text-muted-foreground text-xs">{item.detail}</span>
                        )}
                      </div>
                      <Badge variant="outline" className="text-[10px] px-1 py-0 shrink-0">
                        {TYPE_LABELS[item.type]}
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
