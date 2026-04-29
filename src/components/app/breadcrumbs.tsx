import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length <= 1) {
    return null;
  }

  const mobileItems = [items[0], items[items.length - 1]].filter(Boolean) as BreadcrumbItem[];

  return (
    <nav aria-label="Breadcrumb" className={cn("text-xs text-muted-foreground", className)}>
      <ol className="hidden items-center gap-1.5 md:flex">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
              {item.href && !isCurrent ? (
                <Link href={item.href} className="rounded-sm underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isCurrent ? "page" : undefined}
                  className={cn(isCurrent ? "font-medium text-foreground" : "")}
                >
                  {item.label}
                </span>
              )}
              {!isCurrent && <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>

      <ol className="flex items-center gap-1.5 md:hidden">
        {mobileItems.map((item, index) => {
          const isCurrent = index === mobileItems.length - 1;
          return (
            <li key={`${item.label}-mobile-${index}`} className="inline-flex min-w-0 items-center gap-1.5">
              {item.href && !isCurrent ? (
                <Link href={item.href} className="rounded-sm underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isCurrent ? "page" : undefined} className="max-w-[160px] truncate font-medium text-foreground">
                  {item.label}
                </span>
              )}
              {!isCurrent && <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
