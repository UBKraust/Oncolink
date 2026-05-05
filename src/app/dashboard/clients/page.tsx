import { Users, UserCheck, UserRoundPlus, TrendingUp, AlertCircle } from "lucide-react";
import { listClients } from "@/lib/clients/queries";
import { deriveClientLifecycle } from "@/lib/clients/lifecycle";
import { ClientsClient } from "@/components/clients/ClientsClient";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardPage, EmptyState, MetricCard, PageHeader, SetupBanner } from "@/components/app/page-shell";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  isServiceType,
  type ServiceType,
} from "@/lib/clients/service-track";

const OPERATIONAL_FILTER_PARAM_MAP = {
  review: "REVIEW",
  "gdpr-missing": "GDPR_MISSING",
  onboarding: "ONBOARDING_INCOMPLETE",
  "contract-missing": "CONTRACT_MISSING",
  "high-risk": "HIGH_RISK",
} as const;

type ClientsPageSearchParams = {
  q?: string;
  service?: string;
  filter?: string;
};

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<ClientsPageSearchParams>;
}) {
  const params = await searchParams;
  const configured = isSupabaseConfigured();
  const clients = await listClients();
  const initialSearchQuery = params.q?.trim() ?? "";
  const initialServiceFilter: ServiceType | "ALL" =
    isServiceType(params.service) && params.service !== "MIXED"
      ? params.service
      : "ALL";
  const initialOperationalFilter =
    params.filter && params.filter in OPERATIONAL_FILTER_PARAM_MAP
      ? OPERATIONAL_FILTER_PARAM_MAP[params.filter as keyof typeof OPERATIONAL_FILTER_PARAM_MAP]
      : "ALL";

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
      iconClassName: "bg-primary/10 text-primary",
      trend: `${anonymizedCount} anonimizat${anonymizedCount === 1 ? "" : "i"}`
    },
    {
      label: "În Onboarding",
      value: onboardingPending.toString(),
      icon: UserRoundPlus,
      iconClassName: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
      trend: "Lead-uri și dosare incomplete"
    },
    {
      label: "Prima Ședință",
      value: scheduledCount.toString(),
      icon: AlertCircle,
      iconClassName: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-100",
      trend: "Au programare, dar nu istoric clinic"
    },
    {
      label: "Pacienți Activi",
      value: activeCount.toString(),
      icon: UserCheck,
      iconClassName: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
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
          <MetricCard
            key={stat.label}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            iconClassName={stat.iconClassName}
            trend={
              <span className="inline-flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3 text-primary" />
                <span>{stat.trend}</span>
              </span>
            }
          />
        ))}
      </div>


      {configured ? (
        <ClientsClient
          initialClients={clients}
          initialSearchQuery={initialSearchQuery}
          initialServiceFilter={initialServiceFilter}
          initialOperationalFilter={initialOperationalFilter}
        />
      ) : (
        <Card className="rounded-[1.75rem] border-border/60 shadow-sm">
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
