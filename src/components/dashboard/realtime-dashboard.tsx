"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const REFRESH_DEBOUNCE_MS = 750;

const ROUTE_REFRESH_SCOPES: Record<string, string[]> = {
  appointments: ["appointments"],
  invoices: ["invoices"],
  clients: ["clients"],
  expenses: ["cabinet_expenses"],
  documents: ["patient_documents"],
  dashboard: ["appointments", "invoices", "clients", "cabinet_expenses", "patient_documents"],
};

function getRouteScope(pathname: string): string[] {
  const normalizedPathname = pathname.toLowerCase();
  const matchedKey = Object.keys(ROUTE_REFRESH_SCOPES).find((key) => normalizedPathname.includes(key));
  return matchedKey ? ROUTE_REFRESH_SCOPES[matchedKey] : ROUTE_REFRESH_SCOPES.dashboard;
}

/**
 * This component enables real-time updates for the dashboard.
 * It listens for changes in key tables and refreshes the page data
 * using Next.js router.refresh() which re-runs server components.
 */
export function RealtimeDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRefreshTablesRef = useRef(new Set<string>());
  const metricsRef = useRef({ eventsInMinute: 0, refreshesInMinute: 0 });

  const watchedTablesForRoute = useMemo(() => getRouteScope(pathname || "/"), [pathname]);

  useEffect(() => {
    const isDev = process.env.NODE_ENV !== "production";

    const logMetrics = () => {
      if (!isDev) {
        return;
      }

      console.debug(
        `[RealtimeDashboard] events/min=${metricsRef.current.eventsInMinute} refreshes/min=${metricsRef.current.refreshesInMinute} route=${pathname}`
      );
      metricsRef.current.eventsInMinute = 0;
      metricsRef.current.refreshesInMinute = 0;
    };

    const metricsInterval = setInterval(logMetrics, 60_000);

    const scheduleRefresh = (table: string) => {
      pendingRefreshTablesRef.current.add(table);

      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = setTimeout(() => {
        if (pendingRefreshTablesRef.current.size === 0) {
          return;
        }

        router.refresh();
        metricsRef.current.refreshesInMinute += 1;

        if (isDev) {
          console.debug(
            `[RealtimeDashboard] refresh triggered for route=${pathname} tables=${Array.from(
              pendingRefreshTablesRef.current
            ).join(",")}`
          );
        }

        pendingRefreshTablesRef.current.clear();
        refreshTimeoutRef.current = null;
      }, REFRESH_DEBOUNCE_MS);
    };

    const channels = watchedTablesForRoute.map((table) => {
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
            metricsRef.current.eventsInMinute += 1;

            if (isDev) {
              console.debug(`[RealtimeDashboard] change detected in ${table}:`, payload.eventType);
            }

            // Debounced route-scoped refresh. If a widget needs high-frequency updates,
            // prefer targeted client-side state updates instead of router.refresh().
            scheduleRefresh(table);
          }
        )
        .subscribe();
    });

    return () => {
      clearInterval(metricsInterval);

      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [pathname, router, supabase, watchedTablesForRoute]);

  return null; // This component doesn't render anything
}
