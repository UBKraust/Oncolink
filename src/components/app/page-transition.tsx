"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Forces a fresh animation on every navigation by keying on pathname.
// React recreates the DOM node on key change, guaranteeing animate-in fires.
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div
      key={pathname}
      className="animate-in fade-in slide-in-from-bottom-2 duration-200 ease-out"
    >
      {children}
    </div>
  );
}
