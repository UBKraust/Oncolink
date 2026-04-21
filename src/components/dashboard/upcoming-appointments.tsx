import { CalendarRange } from "lucide-react";
import { AppointmentRow } from "@/components/dashboard/appointment-row";
import type { DashboardAppointment } from "@/lib/mock/dashboard";

export function UpcomingAppointments({ appointments }: { appointments: DashboardAppointment[] }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-50">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
          <CalendarRange className="h-4 w-4 text-primary" />
          Săptămâna următoare
        </h3>
        <p className="text-[11px] text-slate-400 font-medium mt-0.5">Următoarele programări confirmate</p>
      </div>
      <div className="p-4 space-y-2">
        {appointments.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">Nicio programare în vedere.</p>
        ) : (
          appointments.map((a) => <AppointmentRow key={a.id} appointment={a} showDate />)
        )}
      </div>
    </div>
  );
}
