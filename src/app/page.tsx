import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Ce`ai Pățit?</CardTitle>
          <CardDescription>
            Platformă ERP privată pentru cabinet de psihoterapie, construită cu
            accent pe confidențialitate și fluxuri dedicate de conformitate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Dashboard clinic, onboarding pacienți, documente legale, facturare,
            programări și fluxuri GDPR sunt deja integrate în aplicație.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/dashboard" className="block">
              <Button className="w-full">Deschide dashboard-ul</Button>
            </Link>
            <Link href="/book" className="block">
              <Button variant="outline" className="w-full">
                Testează booking-ul public
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
