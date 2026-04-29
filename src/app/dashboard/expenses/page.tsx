import { listExpenses } from "./actions";
import { ExpensesClient } from "@/components/expenses/ExpensesClient";
import { DashboardPage, PageHeader, SetupBanner } from "@/components/app/page-shell";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = params.year ? parseInt(params.year) : now.getFullYear();
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1;
  const configured = isSupabaseConfigured();

  const expenses = await listExpenses(year, month);

  return (
    <DashboardPage className="max-w-5xl">
      <PageHeader
        title="Cheltuieli cabinet"
        description="Gestionează cheltuielile deductibile și păstrează bonurile fiscale într-un flux clar pentru contabilitate."
      />

      {!configured ? (
        <SetupBanner description="Cheltuielile nu mai folosesc date mock. Configurează Supabase pentru a salva și vizualiza înregistrările reale." />
      ) : null}

      <ExpensesClient initialExpenses={expenses} initialYear={year} initialMonth={month} />
    </DashboardPage>
  );
}
