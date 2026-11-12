"use client";

import { ChartNoAxesColumnIncreasing, PieChart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type CSSProperties } from "react";
import { EmptyState, Panel, PanelHeader } from "@/components/ui";
import type { Currency, Transaction } from "@/lib/finance/model";
import { cashFlowHistory, spendingByCategory } from "@/lib/finance/selectors";
import { useFormats } from "./presentation";

type CashPoint = ReturnType<typeof cashFlowHistory>[number];
const swatches = [
  "var(--chart-income)",
  "var(--tone-blue)",
  "var(--tone-amber)",
  "var(--tone-violet)",
  "var(--tone-rose)",
  "var(--tone-neutral)",
];

export function CashFlowChart({ data, currency }: { data: CashPoint[]; currency: Currency }) {
  const t = useTranslations();
  const format = useFormats(currency);
  const [selected, setSelected] = useState<string>();
  const maximum = Math.max(1, ...data.map((point) => Math.max(point.income, point.expenses)));
  const active = data.find((point) => point.month === selected) ?? data.at(-1);
  const height = (amount: number) =>
    amount === 0 ? "0%" : Math.max(3, (amount / maximum) * 92) + "%";

  return (
    <Panel>
      <PanelHeader
        title={t("overview.cashFlow")}
        description={t("overview.lastMonths", { count: data.length })}
        action={
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <i className="chart-legend chart-legend--income" aria-hidden="true" />
              {t("common.income")}
            </span>
            <span className="flex items-center gap-1.5">
              <i className="chart-legend chart-legend--expenses" aria-hidden="true" />
              {t("common.expenses")}
            </span>
          </div>
        }
      />
      {maximum === 1 && data.every((point) => point.income === 0 && point.expenses === 0) ? (
        <EmptyState title={t("common.empty")} icon={ChartNoAxesColumnIncreasing} />
      ) : (
        <>
          <div className="cashflow-chart">
            {data.map((point) => {
              const month = format.date(point.month, { month: "short" });
              return (
                <button
                  key={point.month}
                  type="button"
                  className="cashflow-point"
                  aria-pressed={point.month === active?.month}
                  onClick={() => setSelected(point.month)}
                  aria-label={t("insights.chartPoint", {
                    month,
                    income: format.money(point.income),
                    expenses: format.money(point.expenses),
                  })}
                >
                  <span className="cashflow-bars" aria-hidden="true">
                    <i style={{ height: height(point.income) }} />
                    <i style={{ height: height(point.expenses) }} />
                  </span>
                  <span className="cashflow-month">{month}</span>
                </button>
              );
            })}
          </div>
          {active && (
            <div
              className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 text-xs text-muted"
              aria-live="polite"
            >
              <span className="font-semibold text-foreground">
                {format.date(active.month, { month: "long" })}
              </span>
              <span>
                {t("common.income")}{" "}
                <bdi className="ms-0.5 font-semibold text-foreground">
                  {format.money(active.income, 0)}
                </bdi>
              </span>
              <span>
                {t("common.expenses")}{" "}
                <bdi className="ms-0.5 font-semibold text-foreground">
                  {format.money(active.expenses, 0)}
                </bdi>
              </span>
            </div>
          )}
        </>
      )}
    </Panel>
  );
}

export function SpendingChart({
  entries,
  currency,
}: {
  entries: Transaction[];
  currency: Currency;
}) {
  const t = useTranslations();
  const format = useFormats(currency);
  const groups = spendingByCategory(entries);
  const total = groups.reduce((amount, item) => amount + item.amount, 0);
  const top = groups
    .slice(0, 4)
    .map(({ category, amount }) => ({ label: t(`categories.${category}`), amount }));
  const remainder = groups.slice(4).reduce((amount, item) => amount + item.amount, 0);
  if (remainder > 0) top.push({ label: t("overview.otherCategories"), amount: remainder });

  const slices: { label: string; amount: number; color: string; range: string }[] = [];
  let start = 0;
  for (const [index, item] of top.entries()) {
    const end = start + (item.amount / total) * 360;
    const color = swatches[index];
    slices.push({ ...item, color, range: color + " " + start + "deg " + end + "deg" });
    start = end;
  }

  return (
    <Panel className="spending-panel">
      <PanelHeader title={t("overview.byCategory")} />
      {total === 0 ? (
        <EmptyState
          title={t("common.empty")}
          description={t("overview.noSpending")}
          icon={PieChart}
        />
      ) : (
        <div className="spending-layout">
          <p className="sr-only">
            {t("overview.spent")} {format.money(total)}
          </p>
          <div
            className="donut"
            aria-hidden="true"
            style={
              {
                "--donut":
                  "conic-gradient(" + slices.map((slice) => slice.range).join(",") + ")",
              } as CSSProperties
            }
          >
            <div className="donut-center">
              <span className="text-[.68rem] leading-tight text-muted">
                {t("overview.spent")}
              </span>
              <bdi className="mt-1 max-w-full break-all px-2 text-sm font-bold">
                {format.money(total, 0)}
              </bdi>
            </div>
          </div>
          <ul className="grid gap-2.5">
            {slices.map(({ label, amount, color }) => (
              <li key={label} className="flex min-w-0 items-center gap-2 text-xs">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate text-muted" title={label}>
                  {label}
                </span>
                <bdi className="font-semibold tabular-nums">{format.money(amount, 0)}</bdi>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}
