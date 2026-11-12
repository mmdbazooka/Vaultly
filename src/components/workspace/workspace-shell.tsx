"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowLeft,
  BarChart3,
  CalendarClock,
  ChevronRight,
  LayoutGrid,
  List,
  LockKeyhole,
  Menu,
  PieChart,
  Settings2,
  Target,
  WalletCards,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Brand, LocaleSwitch, ThemeToggle } from "@/components/brand";
import { cx, IconButton } from "@/components/ui";
import { localizedPath } from "@/lib/i18n";
import { MonthProvider } from "./month";
import { WorkspaceData } from "./workspace-data";

const routes = [
  { label: "overview", path: "/dashboard", icon: LayoutGrid },
  { label: "transactions", path: "/dashboard/transactions", icon: List },
  { label: "accounts", path: "/dashboard/accounts", icon: WalletCards },
  { label: "budgets", path: "/dashboard/budgets", icon: PieChart },
  { label: "goals", path: "/dashboard/goals", icon: Target },
  { label: "recurring", path: "/dashboard/recurring", icon: CalendarClock },
  { label: "insights", path: "/dashboard/insights", icon: BarChart3 },
  { label: "settings", path: "/dashboard/settings", icon: Settings2 },
] as const;

function useCurrentRoute() {
  const pathname = usePathname();
  const locale = useLocale();
  return (
    routes.find(
      (route) => localizedPath(locale, route.path) === localizedPath(locale, pathname),
    ) ?? routes[0]
  );
}

function WorkspaceNav({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations("nav");
  const common = useTranslations("common");
  const locale = useLocale();
  const selected = useCurrentRoute();

  return (
    <div className="flex min-h-full flex-col">
      <div className="mb-8 flex items-center justify-between gap-2 px-2">
        <Brand />
        {onNavigate && (
          <Dialog.Close asChild>
            <IconButton label={common("close")} icon={X} />
          </Dialog.Close>
        )}
      </div>
      <nav className="grid gap-1" aria-label={t("navigation")}>
        {routes.map(({ label, path, icon: Icon }) => (
          <Link
            key={label}
            className={cx("workspace-nav-link", label === "settings" && "mt-4")}
            aria-current={selected.label === label ? "page" : undefined}
            href={localizedPath(locale, path)}
            onClick={onNavigate}
          >
            <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
            <span>{t(label)}</span>
          </Link>
        ))}
      </nav>
      <div className="mt-auto grid gap-3 pt-8">
        <Link
          href={localizedPath(locale)}
          onClick={onNavigate}
          className="workspace-nav-link text-xs"
        >
          <ArrowLeft size={16} className="rtl:rotate-180" aria-hidden="true" />
          <span>{common("goHome")}</span>
        </Link>
        <div className="workspace-local">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-positive">
            <LockKeyhole size={15} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{t("localWorkspace")}</p>
            <p className="mt-0.5 text-[.68rem] leading-tight text-muted">{common("local")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const route = useCurrentRoute();

  return (
    <div className="workspace-shell">
      <aside className="workspace-sidebar">
        <WorkspaceNav />
      </aside>
      <div className="min-w-0">
        <header className="workspace-topbar">
          <div className="flex min-w-0 items-center gap-2">
            <Dialog.Root open={open} onOpenChange={setOpen}>
              <Dialog.Trigger asChild>
                <IconButton icon={Menu} label={t("menu")} className="lg:hidden" />
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="dialog-overlay" />
                <Dialog.Content className="workspace-drawer" aria-describedby={undefined}>
                  <Dialog.Title className="sr-only">{t("navigation")}</Dialog.Title>
                  <WorkspaceNav onNavigate={() => setOpen(false)} />
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <span className="hidden text-muted sm:inline">{t("workspace")}</span>
              <ChevronRight
                className="hidden text-muted sm:inline rtl:rotate-180"
                size={14}
                aria-hidden="true"
              />
              <span className="truncate font-semibold">{t(route.label)}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <LocaleSwitch />
            <ThemeToggle />
          </div>
        </header>
        <main id="main-content" className="workspace-content">
          <WorkspaceData>
            <MonthProvider>{children}</MonthProvider>
          </WorkspaceData>
        </main>
      </div>
    </div>
  );
}
