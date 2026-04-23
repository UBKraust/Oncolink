import { redirect } from "next/navigation";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { NotesVaultProvider } from "@/components/notes/notes-context";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { QuickActionsWheel } from "@/components/dashboard/QuickActionsWheel";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  const userEmail = data.user.email ?? null;

  return (
    <NotesVaultProvider>
      <div className="flex min-h-svh bg-muted/30">
        <DashboardSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardTopbar userEmail={userEmail} demoMode={false} />
          <div className="flex-1 overflow-auto p-4 md:p-6">{children}</div>
        </div>
      </div>
      <QuickActionsWheel />
    </NotesVaultProvider>
  );
}
