"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function RealtimeDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const refreshTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const tables = ["appointments", "invoices", "clients", "cabinet_expenses", "patient_documents"];

    const scheduleRefresh = () => {
      if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
      refreshTimeout.current = setTimeout(() => {
        router.refresh();
      }, 250);
    };

    const channels = tables.map((table) =>
      supabase
        .channel(`realtime:${table}`)
        .on("postgres_changes", { event: "*", schema: "public", table }, scheduleRefresh)
        .subscribe(),
    );

    return () => {
      if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [supabase, router]);

  return null;
}
