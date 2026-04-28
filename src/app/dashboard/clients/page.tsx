import { Users, UserCheck, UserX, TrendingUp } from "lucide-react";
import { listClients } from "@/lib/clients/queries";
import { ClientsClient } from "@/components/clients/ClientsClient";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function ClientsPage() {
  const clients = await listClients();

  const activeCount = clients.filter((c) => !c.notes_anonymized_at).length;
  const anonCount = clients.length - activeCount;
  const onboardingPending = clients.filter(c => !c.notes_anonymized_at && !c.gdpr_consent_signed).length;

  const stats = [
    {
      label: "Total Pacienți",
      value: clients.length.toString(),
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      trend: "+4 luna asta"
    },
    {
      label: "Pacienți Activi",
      value: activeCount.toString(),
      icon: UserCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      trend: "85% rată retenție"
    },
    {
      label: "Onboarding Incomplet",
      value: onboardingPending.toString(),
      icon: AlertCircle,
      color: "text-amber-600",
      bg: "bg-amber-50",
      trend: "Necesită atenție"
    },
    {
      label: "Anonimizați",
      value: anonCount.toString(),
      icon: UserX,
      color: "text-slate-600",
      bg: "bg-slate-100",
      trend: "GDPR Compliant"
    }
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col gap-1">
         <h1 className="text-3xl font-black tracking-tight text-slate-900">Consolă Pacienți</h1>
         <p className="text-sm font-medium text-slate-500">Gestionare dosare, status legal și evidență clinică centralizată.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={cn("p-3 rounded-2xl", stat.bg)}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                   <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5">
                 <TrendingUp className="h-3 w-3 text-emerald-500" />
                 <span className="text-[10px] font-bold text-slate-500">{stat.trend}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>


      {/* Main Content Area */}
      <ClientsClient initialClients={clients} />
    </div>
  );
}

function AlertCircle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}
import type { SVGProps } from "react";
