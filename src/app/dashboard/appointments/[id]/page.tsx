export const runtime = "edge";

import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import {
  Building2,
  CalendarClock,
  ChevronLeft,
  Clock,
  Home,
  NotebookPen,
  Pencil,
  Receipt,
  Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAppointment } from "@/lib/appointments/queries";
import {
  deriveLocation,
  locationLabel,
  statusLabel,
  statusVariant,
} from "@/lib/appointments/helpers";
import { updateAppointmentStatus } from "@/app/dashboard/appointments/actions";
import { getInvoiceByAppointment } from "@/lib/invoices/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const locationIcon = { PRIVAT: Home, POLICLINIC: Building2, ONLINE: Video } as const;

const STATUS_TRANSITIONS: Record<string, string[]> = {
  PROGRAMAT: ["CONFIRMAT", "ANULAT"],
  CONFIRMAT: ["FINALIZAT", "LIPSA", "ANULAT"],
  FINALIZAT: [],
  ANULAT: ["PROGRAMAT"],
  LIPSA: ["PROGRAMAT"],
};

export default async function AppointmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ demo?: string }>;
}) {
  const { id } = await params;
  const { demo } = await searchParams;
  const [appointment, existingInvoice] = await Promise.all([
    getAppointment(id),
    getInvoiceByAppointment(id),
  ]);
  if (!appointment) notFound();

  const location = deriveLocation(appointment);
  const LocIcon = locationIcon[location];
  const transitions = STATUS_TRANSITIONS[appointment.status] ?? [];
  const configured = isSupabaseConfigured();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <Link
        href="/dashboard/appointments"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Înapoi la programări
      </Link>

      {demo && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Mod demo: modificările de status nu sunt persistate.
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarClock className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">
              {format(new Date(appointment.appointment_date), "EEEE, d MMMM yyyy", { locale: ro })}
            </h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(appointment.appointment_date), "HH:mm")} ·{" "}
              {appointment.duration_minutes} min ·{" "}
              {appointment.is_external_duty ? "Gardă externă" : appointment.client?.full_name ?? "—"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={statusVariant[appointment.status as keyof typeof statusVariant]} className="text-sm px-3 py-1">
            {statusLabel[appointment.status as keyof typeof statusLabel] ?? appointment.status}
          </Badge>
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/appointments/${id}/edit`}>
              <Pencil className="h-4 w-4" />
              Editează
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Details card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Detalii programare</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
            <InfoRow
              icon={CalendarClock}
              label="Data"
              value={format(new Date(appointment.appointment_date), "EEEE, d MMMM yyyy HH:mm", { locale: ro })}
            />
            <InfoRow icon={Clock} label="Durată" value={`${appointment.duration_minutes} minute`} />
            <InfoRow
              icon={LocIcon}
              label="Locație"
              value={locationLabel[location]}
            />
            {appointment.meet_link && (
              <div>
                <p className="text-xs text-muted-foreground">Link Meet</p>
                <a
                  href={appointment.meet_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Deschide sesiunea
                </a>
              </div>
            )}
            {!appointment.is_external_duty && appointment.client && (
              <div>
                <p className="text-xs text-muted-foreground">Client</p>
                <Link
                  href={`/dashboard/clients/${appointment.client.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  {appointment.client.full_name}
                </Link>
                <p className="text-xs text-muted-foreground">{appointment.client.email}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions card */}
        <div className="space-y-4">
          {/* Status transitions */}
          {transitions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Schimbă status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {transitions.map((s) => (
                  <form key={s} action={updateAppointmentStatus}>
                    <input type="hidden" name="id" value={id} />
                    <input type="hidden" name="status" value={s} />
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={!configured}
                    >
                      → {statusLabel[s as keyof typeof statusLabel]}
                    </Button>
                  </form>
                ))}
                {!configured && (
                  <p className="text-xs text-muted-foreground">
                    Schimbările necesită Supabase configurat.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Note link */}
          {!appointment.is_external_duty && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Notă clinică</CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={`/dashboard/notes/${id}`}>
                    <NotebookPen className="h-4 w-4" />
                    Deschide nota
                  </Link>
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">
                  Nota este criptată end-to-end și necesită PIN pentru acces.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Invoice */}
          {!appointment.is_external_duty && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Factură</CardTitle>
              </CardHeader>
              <CardContent>
                {existingInvoice ? (
                  <>
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href={`/dashboard/invoices/${existingInvoice.id}`}>
                        <Receipt className="h-4 w-4" />
                        {existingInvoice.smartbill_series}/{existingInvoice.smartbill_number} · {existingInvoice.status}
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href={`/dashboard/invoices/new?appointmentId=${id}`}>
                        <Receipt className="h-4 w-4" />
                        Emite factură
                      </Link>
                    </Button>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Nicio factură emisă pentru această ședință.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  );
}
