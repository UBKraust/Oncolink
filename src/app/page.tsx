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
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Oncolink</CardTitle>
          <CardDescription>
            Platformă ERP privată pentru cabinet de psihoterapie — GDPR &amp; CPR
            compliant.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Scaffold inițial. Modulele (Calendar, Facturare SmartBill, EHR,
            Notificări) urmează a fi activate la cerere.
          </p>
          <Link href="/login" className="block">
            <Button className="w-full">Autentificare</Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
