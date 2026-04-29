import {
  Activity,
  BarChart3,
  BotMessageSquare,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  FileText,
  Hospital,
  LayoutDashboard,
  Lock,
  NotebookPen,
  Receipt,
  Scale,
  Settings,
  Users,
  Wallet,
} from "lucide-react";

export const dashboardNavGroups = [
  {
    title: "Activitate Zilnică",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard/appointments", label: "Programări", icon: CalendarCheck },
      { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
      { href: "/dashboard/notes", label: "Note clinice", icon: NotebookPen },
      { href: "/dashboard/ai", label: "Asistent AI", icon: BotMessageSquare },
    ],
  },
  {
    title: "Management Clienți",
    items: [
      { href: "/dashboard/clients", label: "Clienți", icon: Users },
      { href: "/dashboard/documents", label: "Documente", icon: FileText },
      { href: "/dashboard/assessments", label: "Evaluări", icon: ClipboardList },
      { href: "/dashboard/vault", label: "Seif Cabinet", icon: Lock },
    ],
  },
  {
    title: "Financiar & Administrativ",
    items: [
      { href: "/dashboard/invoices", label: "Facturi", icon: Receipt },
      { href: "/dashboard/expenses", label: "Cheltuieli", icon: Wallet },
      { href: "/dashboard/billing", label: "Raportare Lună", icon: BarChart3 },
      { href: "/dashboard/review", label: "Sumar Lunar", icon: CalendarRange },
      { href: "/dashboard/cas", label: "Modul CAS", icon: Hospital },
    ],
  },
  {
    title: "Legal & Configurare",
    items: [
      { href: "/dashboard/activity", label: "Registru", icon: Activity },
      { href: "/dashboard/compliance", label: "Conformitate", icon: Scale },
      { href: "/dashboard/settings", label: "Setări", icon: Settings },
    ],
  },
];
