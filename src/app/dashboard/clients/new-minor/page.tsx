import Link from "next/link";
import { ChevronLeft, Baby } from "lucide-react";

import { MinorOnboardingForm } from "@/components/clients/MinorOnboardingForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NewMinorClientPage() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <Link
        href="/dashboard/clients"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Înapoi la clienți
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Baby className="h-5 w-5 text-primary" />
            Pacient Minor Nou
          </CardTitle>
          <CardDescription>
            Onboarding pacient minor — date personale, date părinți / tutori legali,
            status marital și documente legale de custodie.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MinorOnboardingForm />
        </CardContent>
      </Card>
    </div>
  );
}
