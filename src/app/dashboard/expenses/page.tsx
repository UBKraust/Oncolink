import { Banknote } from "lucide-react";
import { listExpenses } from "./actions";
import { ExpensesClient } from "@/components/expenses/ExpensesClient";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = params.year ? parseInt(params.year) : now.getFullYear();
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1;

  const expenses = await listExpenses(year, month);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Banknote className="h-6 w-6 text-primary" />
            Cheltuieli Cabinet
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestionează cheltuielile deductibile și încarcă bonurile fiscale pentru contabilitate.
          </p>
        </div>
      </div>

      <ExpensesClient initialExpenses={expenses} initialYear={year} initialMonth={month} />
    </div>
  );
}
