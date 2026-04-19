import { Construction } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ComingSoonProps {
  title: string;
  description: string;
  nextSteps?: string[];
}

export function ComingSoon({ title, description, nextSteps }: ComingSoonProps) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start gap-3 space-y-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Construction className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </CardHeader>
        {nextSteps && nextSteps.length > 0 ? (
          <CardContent>
            <p className="mb-2 text-sm font-medium">Pași următori</p>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              {nextSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}
