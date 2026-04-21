export const runtime = "edge";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isSupabaseConfigured } from "@/lib/supabase/config";

import { signInWithPassword } from "./actions";

const errorMessages: Record<string, string> = {
  not_configured:
    "Supabase nu este configurat. Completează .env.local cu NEXT_PUBLIC_SUPABASE_URL și ANON_KEY.",
  missing_fields: "Introdu email și parolă.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const configured = isSupabaseConfigured();
  const errorText = error ? (errorMessages[error] ?? decodeURIComponent(error)) : null;

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Oncolink</CardTitle>
          <CardDescription>
            Autentificare terapeut. Doar utilizatorii creați în Supabase pot accesa
            dashboard-ul.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!configured ? (
            <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              Mod demo activ — Supabase nu este încă legat. Autentificarea va fi
              activată după ce populezi <code>.env.local</code>. Poți deschide
              oricum{" "}
              <Link href="/dashboard" className="font-medium underline">
                /dashboard
              </Link>{" "}
              pentru preview.
            </div>
          ) : null}

          {errorText ? (
            <div className="mb-4 rounded-md border border-rose-300 bg-rose-50 p-3 text-xs text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
              {errorText}
            </div>
          ) : null}

          <form action={signInWithPassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={!configured}
                placeholder="terapeut@cabinet.ro"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Parolă</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={!configured}
              />
            </div>
            <Button type="submit" className="w-full" disabled={!configured}>
              Autentificare
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
