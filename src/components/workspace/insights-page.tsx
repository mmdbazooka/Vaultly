"use client";

import { BarChart3, ChartPie, Percent, TrendingDown } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  EmptyState,
  IconTile,
  Metric,
  PageHeader,
  Panel,
  PanelHeader,
  Progress,
} from "@/components/ui";
import {
  cashFlow,
  cashFlowHistory,
  monthlyActivity,
  spendingByCategory,
} from "@/lib/finance/selectors";
import { CashFlowChart } from "./charts";
import { MonthControl, useMonth } from "./month";
import { categoryVisual, useFormats } from "./presentation";
import { useVaultData } from "./workspace-data";

export function InsightsPage() {
  const t = useTranslations();
  const vault = useVaultData();
  const { month } = useMonth();
  const { currency } = vault.preferences;
  const format = useFormats(currency);
  const monthEntries = monthlyActivity(vault.transactions, month);
  const groups = spendingByCategory(monthEntries);
  const history = cashFlowHistory(vault.transactions, month);
  const current = cashFlow(monthEntries);
  const average = Math.round(
    history.reduce((sum, point) => sum + point.expenses, 0) / history.length,
  );
  const top = groups[0];

  return (
    <div className="workspace-page">
      <PageHeader title={t("insights.title")} description={t("insights.description")}>
        <MonthControl />
      </PageHeader>
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric
          label={t("insights.savingsRate")}
          value={current.rate === null ? "—" : format.percent(current.rate)}
          detail={t("insights.savingsHint")}
          icon={Percent}
          featured
        />
        <Metric
          label={t("insights.avgExpense")}
          value={format.money(average)}
          detail={t("insights.averagePeriod")}
          icon={TrendingDown}
          tone="amber"
        />
        <Metric
          label={t("insights.topCategory")}
          value={top ? t(`categories.${top.category}`) : "—"}
          detail={top ? format.money(top.amount) : t("overview.noSpending")}
          icon={ChartPie}
          tone="violet"
        />
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <CashFlowChart data={history} currency={currency} />
        <Panel>
          <PanelHeader title={t("overview.byCategory")} description={t("insights.share")} />
          {groups.length > 0 ? (
            <ul className="grid gap-3.5">
              {groups.map(({ category, amount }) => {
                const label = t(`categories.${category}`);
                const visual = categoryVisual[category];
                return (
                  <li key={category} className="flex items-center gap-2.5">
                    <IconTile {...visual} className="!size-8" />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                        <span className="min-w-0 truncate font-medium">{label}</span>
                        <bdi className="shrink-0 font-semibold">{format.money(amount)}</bdi>
                      </div>
                      <Progress
                        value={(amount / current.expenses) * 100}
                        label={label}
                        tone={visual.tone}
                      />
                    </div>
                    <bdi className="w-10 shrink-0 text-end text-xs text-muted">
                      {format.percent(amount / current.expenses)}
                    </bdi>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              title={t("common.empty")}
              description={t("overview.noSpending")}
              icon={ChartPie}
            />
          )}
        </Panel>
      </div>
      <Panel className="!p-0">
        <div className="px-5 pt-5">
          <PanelHeader
            title={t("insights.monthlyBreakdown")}
            action={<IconTile icon={BarChart3} />}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="ledger-table whitespace-nowrap">
            <thead>
              <tr>
                <th scope="col">{t("common.month")}</th>
                <th scope="col" className="text-end">
                  {t("common.income")}
                </th>
                <th scope="col" className="text-end">
                  {t("common.expenses")}
                </th>
                <th scope="col" className="text-end">
                  {t("insights.net")}
                </th>
              </tr>
            </thead>
            <tbody>
              {history.toReversed().map((point) => (
                <tr key={point.month}>
                  <td className="font-medium">
                    {format.date(point.month, { month: "short", year: "numeric" })}
                  </td>
                  <td className="text-end">
                    <bdi>{format.money(point.income)}</bdi>
                  </td>
                  <td className="text-end">
                    <bdi>{format.money(point.expenses)}</bdi>
                  </td>
                  <td
                    className={
                      "text-end font-semibold " +
                      (point.net < 0 ? "text-danger" : "text-positive")
                    }
                  >
                    <bdi>{format.money(point.net)}</bdi>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
