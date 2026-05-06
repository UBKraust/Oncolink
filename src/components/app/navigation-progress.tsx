"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const routeKeyRef = useRef(routeKey);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Complete progress when navigation finishes (pathname changes)
  useEffect(() => {
    if (routeKeyRef.current === routeKey) return;
    routeKeyRef.current = routeKey;
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    setWidth(100);
    finishTimerRef.current = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 400);
  }, [routeKey]);

  // Start progress when a nav link is clicked
  useEffect(() => {
    function onAnchorClick(e: MouseEvent) {
      const anchor = (e.target as Element).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href?.startsWith("/")) return;
      if (href === routeKeyRef.current || href === pathname) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (anchor.getAttribute("target") === "_blank") return;

      if (intervalRef.current) clearInterval(intervalRef.current);
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
      setVisible(true);
      setWidth(0);

      let w = 0;
      intervalRef.current = setInterval(() => {
        // Ease toward 85% asymptotically — never reaches it before nav completes
        w = Math.min(w + (85 - w) * 0.1 + 1, 85);
        setWidth(Math.round(w));
      }, 80);
    }

    document.addEventListener("click", onAnchorClick);
    return () => document.removeEventListener("click", onAnchorClick);
  }, [pathname]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[9999] h-[2px] bg-primary"
      style={{
        width: `${width}%`,
        opacity: visible ? 1 : 0,
        transition: visible
          ? `width ${width >= 100 ? 250 : 80}ms ${width >= 100 ? "ease-out" : "linear"}, opacity 200ms`
          : "opacity 300ms, width 0ms",
        boxShadow: "0 0 10px 0 color-mix(in oklab, var(--color-primary) 60%, transparent)",
      }}
    />
  );
}
