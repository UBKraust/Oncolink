import { Button } from "@/components/ui/button";
import { SetupBanner } from "@/components/app/page-shell";
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
    "Supabase nu este configurat. Completează .env.local cu NEXT_PUBLIC_SUPABASE_URL și PUBLISHABLE_KEY.",
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
    <main className="min-h-svh bg-[radial-gradient(circle_at_top,_rgba(14,116,144,0.08),_transparent_30%),linear-gradient(180deg,_rgba(248,250,252,0.95),_rgba(241,245,249,0.7))] p-6">
      <div className="mx-auto flex min-h-[calc(100svh-3rem)] max-w-5xl items-center justify-center">
      <Card className="w-full max-w-md rounded-[2rem] border-border/60 shadow-xl shadow-slate-200/50">
        <CardHeader>
          <CardTitle className="text-2xl font-black tracking-tight text-primary">Ce`ai Pățit?</CardTitle>
          <CardDescription>
            Autentificare terapeut. Doar utilizatorii creați în Supabase pot accesa
            dashboard-ul.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!configured ? (
            <div className="mb-4">
              <SetupBanner description="Completează variabilele Supabase în `.env.local` pentru a activa autentificarea și datele reale." />
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
      </div>
    </main>
  );
}
