import {
  Activity,
  BarChart3,
  BotMessageSquare,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  ClipboardPen,
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
    title: "Activitate zilnică",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard/appointments", label: "Programări", icon: CalendarCheck },
      { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
      { href: "/dashboard/notes", label: "Note clinice", icon: NotebookPen },
      { href: "/dashboard/clients", label: "Clienți", icon: Users },
    ],
  },
  {
    title: "Clinic & Documente",
    items: [
      { href: "/dashboard/assessments", label: "Evaluări", icon: ClipboardList },
      { href: "/dashboard/forms", label: "Fișe & Rapoarte", icon: ClipboardPen },
      { href: "/dashboard/documents", label: "Documente", icon: FileText },
      { href: "/dashboard/vault", label: "Seif cabinet", icon: Lock },
    ],
  },
  {
    title: "Financiar & Admin",
    items: [
      { href: "/dashboard/invoices", label: "Facturi", icon: Receipt },
      { href: "/dashboard/expenses", label: "Cheltuieli", icon: Wallet },
      { href: "/dashboard/billing", label: "Financiar lunar", icon: BarChart3 },
      { href: "/dashboard/review", label: "Raport clinic lunar", icon: CalendarRange },
      { href: "/dashboard/cas", label: "Modul CAS", icon: Hospital },
    ],
  },
  {
    title: "Configurare & Legal",
    items: [
      { href: "/dashboard/activity", label: "Registru activitate", icon: Activity },
      { href: "/dashboard/compliance", label: "Conformitate", icon: Scale },
      { href: "/dashboard/ai", label: "Asistent AI", icon: BotMessageSquare },
      { href: "/dashboard/settings", label: "Setări", icon: Settings },
    ],
  },
];
