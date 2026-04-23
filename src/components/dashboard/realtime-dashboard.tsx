"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * This component enables real-time updates for the dashboard.
 * It listens for changes in key tables and refreshes the page data
 * using Next.js router.refresh() which re-runs server components.
 */
export function RealtimeDashboard() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // 1. Define the tables to watch
    const tables = ["appointments", "invoices", "clients", "cabinet_expenses", "patient_documents"];

    // 2. Subscribe to each table
    const channels = tables.map((table) => {
      return supabase
        .channel(`realtime:${table}`)
        .on(
          "postgres_changes",
          {
            event: "*", // Listen to INSERT, UPDATE, and DELETE
            schema: "public",
            table: table,
          },
          (payload) => {
            console.log(`Realtime change detected in ${table}:`, payload);
            // Refresh the server component data
            router.refresh();
          }
        )
        .subscribe();
    });

    // 3. Cleanup on unmount
    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [supabase, router]);

  return null; // This component doesn't render anything
}
