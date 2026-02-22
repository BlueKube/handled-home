import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  module: string;
  description: string;
  children?: ReactNode;
}

export function PlaceholderPage({ title, module, description, children }: PlaceholderPageProps) {
  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-1">{title}</h1>
      <p className="text-sm text-muted-foreground mb-6">{module}</p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Construction className="h-5 w-5 text-accent" />
            Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{description}</p>
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
