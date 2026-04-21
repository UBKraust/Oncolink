import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import { AppointmentRow } from "@/components/dashboard/appointment-row";
import type { DashboardAppointment } from "@/lib/mock/dashboard";

export function AppointmentsToday({ appointments }: { appointments: DashboardAppointment[] }) {
  const nonDuty = appointments.filter(a => !a.isExternalDuty).length;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
        <div>
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            Programul de azi
          </h3>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            {appointments.length
              ? `${appointments.length} programări · include gărzi externe`
              : "Nicio programare astăzi"}
          </p>
        </div>
        <Link
          href="/dashboard/appointments/new"
          className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1.5 text-[11px] font-black text-primary hover:bg-primary/20 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Adaugă
        </Link>
      </div>
      <div className="p-4 space-y-2">
        {appointments.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">Agendă liberă.</p>
        ) : (
          appointments.map((a) => <AppointmentRow key={a.id} appointment={a} />)
        )}
      </div>
    </div>
  );
}
