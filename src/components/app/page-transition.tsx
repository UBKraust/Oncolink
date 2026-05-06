"use client";

import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

// Forces a fresh animation on every navigation by keying on pathname.
// React recreates the DOM node on key change, guaranteeing animate-in fires.
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const transitionKey = `${pathname}?${searchParams.toString()}`;

  return (
    <div
      key={transitionKey}
      className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out"
    >
      {children}
    </div>
  );
}
