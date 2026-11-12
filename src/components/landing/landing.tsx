"use client";

import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarClock,
  Check,
  CircleDollarSign,
  Code2,
  CreditCard,
  LayoutGrid,
  LockKeyhole,
  PieChart,
  Target,
  WalletCards,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Brand, LocaleSwitch, ThemeToggle } from "@/components/brand";
import { buttonClass, IconTile, Panel, Progress } from "@/components/ui";
import { formatMoney } from "@/lib/finance/money";
import { localizedPath } from "@/lib/i18n";

const navPreview = [
  { key: "overview", icon: LayoutGrid },
  { key: "transactions", icon: WalletCards },
  { key: "budgets", icon: PieChart },
  { key: "goals", icon: Target },
] as const;

const previewMonths = [
  { income: 49, expenses: 35 },
  { income: 66, expenses: 40 },
  { income: 58, expenses: 43 },
  { income: 80, expenses: 50 },
  { income: 73, expenses: 39 },
  { income: 92, expenses: 56 },
];

function DashboardLink({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("landing");
  return (
    <Link
      href={localizedPath(locale, "/dashboard")}
      className={buttonClass("primary", className)}
    >
      {t("open")}
      {compact ? (
        <ArrowUpRight size={16} className="rtl:rotate-[-90deg]" aria-hidden="true" />
      ) : (
        <ArrowRight size={18} className="rtl:rotate-180" aria-hidden="true" />
      )}
    </Link>
  );
}

function ProductPreview() {
  const locale = useLocale();
  const t = useTranslations("landing");
  const nav = useTranslations("nav");
  const c = useTranslations("common");
  const money = (amount: number) => formatMoney(amount, "USD", locale);

  return (
    <section className="preview-shell" aria-label={t("preview")}>
      <div className="preview-chrome flex items-center justify-between gap-2 px-4 py-3 text-xs">
        <div aria-hidden="true" className="flex gap-1.5">
          <span className="size-2 rounded-full bg-[#64735f]" />
          <span className="size-2 rounded-full bg-[#64735f]" />
          <span className="size-2 rounded-full bg-[#64735f]" />
        </div>
        <span className="preview-muted flex items-center gap-1.5">
          <LockKeyhole size={12} aria-hidden="true" /> {t("sample")}
        </span>
      </div>
      <div className="grid md:grid-cols-[11.5rem_minmax(0,1fr)] lg:grid-cols-[13rem_minmax(0,1fr)]">
        <div className="preview-rail p-4 lg:p-5">
          <div className="mb-7 flex items-center gap-2 font-semibold" aria-hidden="true">
            <span className="brand-mark scale-90" /> Vaultly
          </div>
          <ul className="grid gap-1 text-sm" aria-hidden="true">
            {navPreview.map(({ key, icon: Icon }, index) => (
              <li key={key} className="preview-nav" data-current={index === 0 || undefined}>
                <Icon size={17} />
                {nav(key)}
              </li>
            ))}
          </ul>
        </div>
        <div className="grid gap-3 p-3.5 sm:gap-4 sm:p-5 lg:p-7">
          <div className="flex items-center justify-between gap-3">
            <h2 className="display text-xl font-semibold sm:text-2xl">{nav("overview")}</h2>
            <span className="preview-muted text-xs">{t("previewPeriod")}</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3">
            <div className="preview-card preview-card--lime">
              <div className="flex items-center justify-between gap-1 text-xs sm:text-sm">
                {t("previewBalance")}
                <WalletCards size={16} className="hidden sm:block" aria-hidden="true" />
              </div>
              <p className="display mt-2 break-all text-xl font-semibold tracking-tight sm:text-3xl">
                <bdi>{money(1_824_560)}</bdi>
              </p>
            </div>
            <div className="preview-card">
              <div className="preview-muted text-xs sm:text-sm">{t("previewNet")}</div>
              <p className="display mt-2 break-all text-xl font-semibold tracking-tight sm:text-3xl">
                <bdi>{money(286_000)}</bdi>
              </p>
            </div>
            <div className="preview-card hidden lg:block">
              <div className="preview-muted text-sm">{t("previewGoal")}</div>
              <p className="display mt-2 text-3xl font-semibold tracking-tight">
                <bdi>{new Intl.NumberFormat(locale, { style: "percent" }).format(0.68)}</bdi>
              </p>
            </div>
          </div>
          <div className="preview-card">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{t("previewChart")}</p>
              <div className="preview-muted flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <i className="size-2 rounded-full bg-[#cfe782]" aria-hidden="true" />
                  {c("income")}
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="size-2 rounded-full bg-[#68866a]" aria-hidden="true" />
                  {c("expenses")}
                </span>
              </div>
            </div>
            <div
              className="preview-chart grid h-24 grid-cols-6 gap-2 px-2 sm:h-36 sm:px-7"
              aria-hidden="true"
            >
              {previewMonths.map(({ income, expenses }) => (
                <div
                  key={income}
                  className="flex h-full items-end justify-center gap-1 sm:gap-1.5"
                >
                  <i style={{ "--bar-height": income + "%" } as CSSProperties} />
                  <i style={{ "--bar-height": expenses + "%" } as CSSProperties} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const features = [
  { id: "ledger", icon: WalletCards, tone: "blue" },
  { id: "budget", icon: PieChart, tone: "violet" },
  { id: "goals", icon: Target, tone: "green" },
  { id: "recurring", icon: CalendarClock, tone: "amber" },
] as const;

function FeatureExample({ id }: { id: (typeof features)[number]["id"] }) {
  const locale = useLocale();
  const t = useTranslations();
  const money = (minor: number) => formatMoney(minor, "USD", locale, 0);

  if (id === "ledger") {
    return (
      <div className="grid w-full gap-2.5">
        {[
          { text: t("samples.payroll"), value: 465_000, icon: CircleDollarSign, tone: "green" },
          { text: t("samples.groceries"), value: -17_200, icon: CreditCard, tone: "blue" },
        ].map(({ text, value, icon, tone }) => (
          <div key={text} className="flex min-w-0 items-center gap-2 text-xs sm:text-sm">
            <IconTile
              icon={icon}
              tone={tone === "green" ? "green" : "blue"}
              className="!size-8"
            />
            <span className="min-w-0 flex-1 truncate">{text}</span>
            <bdi className={value > 0 ? "font-semibold text-positive" : "font-semibold"}>
              {money(value)}
            </bdi>
          </div>
        ))}
      </div>
    );
  }

  if (id === "recurring") {
    return (
      <div className="flex w-full items-center gap-3 text-sm">
        <IconTile icon={CalendarClock} tone="amber" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{t("samples.internet")}</p>
          <p className="mt-1 text-xs text-muted">{t("recurring.monthly")}</p>
        </div>
        <bdi className="font-semibold">{money(6900)}</bdi>
      </div>
    );
  }

  const label = id === "budget" ? t("categories.groceries") : t("samples.emergency");
  const value = id === "budget" ? 46 : 68;
  return (
    <div className="grid w-full gap-3">
      <div className="flex items-center justify-between gap-2 text-sm font-semibold">
        <span>{label}</span>
        <bdi>{new Intl.NumberFormat(locale, { style: "percent" }).format(value / 100)}</bdi>
      </div>
      <Progress label={label} value={value} tone={id === "budget" ? "violet" : "green"} />
    </div>
  );
}

export function Landing() {
  const t = useTranslations("landing");
  const locale = useLocale();
  const c = useTranslations("common");

  return (
    <>
      <header className="site-header">
        <div className="site-width flex min-h-18 items-center justify-between gap-2">
          <Brand />
          <nav
            className="hidden items-center gap-7 text-sm font-medium text-muted md:flex"
            aria-label={useTranslations("nav")("main")}
          >
            <a className="hover:text-foreground" href="#features">
              {t("features")}
            </a>
            <a className="hover:text-foreground" href="#privacy">
              {t("privacy")}
            </a>
          </nav>
          <div className="flex items-center gap-0.5 sm:gap-2">
            <LocaleSwitch />
            <ThemeToggle />
            <DashboardLink className="ms-1 hidden sm:inline-flex" compact />
          </div>
        </div>
      </header>
      <main id="main-content" className="site-width pb-12 pt-2 sm:pb-16">
        <section className="hero-shell">
          <div className="hero-art" aria-hidden="true">
            <Image
              src="/vault-hero.webp"
              alt=""
              fill
              preload
              unoptimized
              sizes="(max-width: 767px) 100vw, 65vw"
            />
          </div>
          <div className="hero-copy">
            <p className="hero-kicker">{t("label")}</p>
            <h1 className="display hero-title">
              {t("headline1")}
              <br />
              <em>{t("headline2")}</em>
            </h1>
            <p className="hero-subtitle mt-5 max-w-[26rem] leading-relaxed">{t("subtitle")}</p>
            <div className="mt-6 flex flex-wrap gap-2.5 sm:mt-8">
              <DashboardLink className="min-h-12 px-4" />
              <a
                href="#features"
                className={buttonClass("secondary", "hero-secondary min-h-12 px-4")}
              >
                {t("explore")}
              </a>
            </div>
          </div>
        </section>
        <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 px-2 py-5 text-xs font-medium text-muted sm:justify-start sm:text-sm">
          <span className="flex items-center gap-2">
            <Check className="text-positive" size={16} aria-hidden="true" />
            {t("noAccount")}
          </span>
          <span className="flex items-center gap-2">
            <LockKeyhole className="text-positive" size={15} aria-hidden="true" />
            {c("local")}
          </span>
          <span className="ms-auto hidden items-center gap-2 sm:flex">
            <BarChart3 className="text-positive" size={16} aria-hidden="true" />
            {t("preview")}
          </span>
        </div>
        <ProductPreview />

        <section id="features" className="py-16 sm:py-24">
          <div className="mb-7 max-w-[44rem] sm:mb-10">
            <h2 className="display landing-section-title">{t("featuresHeading")}</h2>
            <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">
              {t("featuresDescription")}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            {features.map(({ id, icon, tone }) => (
              <Panel key={id} className="feature-card flex flex-col !p-5 sm:!p-6">
                <IconTile icon={icon} tone={tone} />
                <h3 className="display mt-4 text-2xl font-semibold tracking-tight">
                  {t(
                    (id + "Title") as
                      "ledgerTitle" | "budgetTitle" | "goalsTitle" | "recurringTitle",
                  )}
                </h3>
                <p className="mb-4 mt-2 max-w-md text-sm leading-relaxed text-muted">
                  {t(
                    (id + "Description") as
                      | "ledgerDescription"
                      | "budgetDescription"
                      | "goalsDescription"
                      | "recurringDescription",
                  )}
                </p>
                <div className="feature-illustration mt-auto flex items-center px-4 py-3 sm:px-5">
                  <FeatureExample id={id} />
                </div>
              </Panel>
            ))}
          </div>
        </section>

        <section
          id="privacy"
          className="privacy-card mb-8 grid items-center gap-5 rounded-3xl border border-line px-6 py-9 sm:mb-14 sm:grid-cols-[auto_minmax(0,1fr)] sm:px-10 sm:py-13"
        >
          <IconTile icon={LockKeyhole} className="!size-15" />
          <div>
            <h2 className="display text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("privacyTitle")}
            </h2>
            <p className="mt-2 max-w-[46rem] leading-relaxed text-muted">
              {t("privacyDescription")}
            </p>
          </div>
        </section>
        <section className="final-card flex flex-col items-start justify-between gap-6 px-6 py-10 sm:flex-row sm:items-center sm:px-11 sm:py-14">
          <div>
            <h2 className="display text-3xl font-semibold tracking-tight sm:text-5xl">
              {t("finalTitle")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed sm:text-base">{t("finalDescription")}</p>
          </div>
          <DashboardLink className="min-h-12 px-4" />
        </section>
      </main>
      <footer className="border-t border-line">
        <div className="site-width flex flex-wrap items-center justify-between gap-4 py-7">
          <div className="flex flex-wrap items-center gap-4">
            <Brand />
            <p className="text-sm text-muted">{t("footer")}</p>
          </div>
          <a className="text-link" href="https://github.com/mmdbazooka/Vaultly" lang={locale}>
            <Code2 size={17} aria-hidden="true" />
            {t("github")}
          </a>
        </div>
      </footer>
    </>
  );
}
