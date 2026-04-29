import type { SVGProps } from "react";
import { Users, UserCheck, UserRoundPlus, TrendingUp } from "lucide-react";
import { listClients } from "@/lib/clients/queries";
import { deriveClientLifecycle } from "@/lib/clients/lifecycle";
import { ClientsClient } from "@/components/clients/ClientsClient";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DashboardPage, EmptyState, PageHeader, SetupBanner } from "@/components/app/page-shell";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function ClientsPage() {
  const configured = isSupabaseConfigured();
  const clients = await listClients();

  const lifecycleList = clients.map((client) =>
    deriveClientLifecycle(client, client.appointments ?? []),
  );
  const activeCount = lifecycleList.filter((lifecycle) => lifecycle.status === "ACTIV").length;
  const scheduledCount = lifecycleList.filter((lifecycle) => lifecycle.status === "PROGRAMAT").length;
  const onboardingPending = lifecycleList.filter((lifecycle) =>
    ["LEAD", "ONBOARDING"].includes(lifecycle.status),
  ).length;
  const anonymizedCount = lifecycleList.filter((lifecycle) => lifecycle.status === "ANONIMIZAT").length;

  const stats = [
    {
      label: "Total Pacienți",
      value: clients.length.toString(),
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      trend: `${anonymizedCount} anonimizat${anonymizedCount === 1 ? "" : "i"}`
    },
    {
      label: "În Onboarding",
      value: onboardingPending.toString(),
      icon: UserRoundPlus,
      color: "text-amber-600",
      bg: "bg-amber-50",
      trend: "Lead-uri și dosare incomplete"
    },
    {
      label: "Prima Ședință",
      value: scheduledCount.toString(),
      icon: AlertCircle,
      color: "text-sky-600",
      bg: "bg-sky-50",
      trend: "Au programare, dar nu istoric clinic"
    },
    {
      label: "Pacienți Activi",
      value: activeCount.toString(),
      icon: UserCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      trend: "Au deja cel puțin o ședință finalizată"
    }
  ];

  return (
    <DashboardPage className="space-y-8 pb-20">
      <PageHeader
        title="Consolă pacienți"
        description="Gestionare dosare, status legal și evidență clinică centralizată."
      />

      {!configured ? (
        <SetupBanner description="Pacienții reali apar aici după configurarea Supabase. Am eliminat datele demo din această secțiune." />
      ) : null}

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


      {configured ? (
        <ClientsClient initialClients={clients} />
      ) : (
        <Card className="rounded-[2rem] border-border/60 shadow-sm">
          <CardContent className="p-0">
            <EmptyState
              title="Registrul de pacienți este gol momentan"
              description="Configurează conexiunea Supabase pentru a încărca pacienții existenți și a începe onboarding-ul din interfața reală."
            />
          </CardContent>
        </Card>
      )}
    </DashboardPage>
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
