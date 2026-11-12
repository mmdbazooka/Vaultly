"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  ChartNoAxesColumnIncreasing,
  FlaskConical,
  List,
  Target,
  WalletCards,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  IconTile,
  Metric,
  PageHeader,
  Panel,
  PanelHeader,
  Progress,
  TextLink,
} from "@/components/ui";
import { currentMonth, localDate, shiftMonth } from "@/lib/finance/dates";
import { emptyVault } from "@/lib/finance/model";
import {
  accountBalances,
  cashFlow,
  cashFlowHistory,
  dueFirst,
  monthlyActivity,
  newestFirst,
} from "@/lib/finance/selectors";
import { localizedPath } from "@/lib/i18n";
import { CashFlowChart, SpendingChart } from "./charts";
import { MonthControl, useMonth } from "./month";
import { categoryVisual, goalVisual, useFormats } from "./presentation";
import { RecentTransactions } from "./transaction-display";
import { AddTransaction, TransactionEditor } from "./transaction-editor";
import { useVaultData, useVaultWrite } from "./workspace-data";

export function OverviewPage() {
  const t = useTranslations();
  const locale = useLocale();
  const vault = useVaultData();
  const { month } = useMonth();
  const write = useVaultWrite();
  const [adding, setAdding] = useState(false);
  const [reset, setReset] = useState(false);
  const { currency } = vault.preferences;
  const format = useFormats(currency);
  const today = localDate();
  const balance = [...accountBalances(vault, today).values()].reduce(
    (sum, value) => sum + value,
    0,
  );
  const monthEntries = monthlyActivity(vault.transactions, month);
  const flow = cashFlow(monthEntries);
  const previous = cashFlow(monthlyActivity(vault.transactions, shiftMonth(month, -1)));
  const history = cashFlowHistory(vault.transactions, month);
  const recent = newestFirst(monthEntries).slice(0, 5);
  const upcoming = dueFirst(vault.recurring)
    .filter((entry) => entry.active)
    .slice(0, 3);

  return (
    <div className="workspace-page">
      <PageHeader
        title={t("overview.title")}
        description={t("overview.description")}
        context={format.date(today, { weekday: "long", month: "long", day: "numeric" })}
      >
        <MonthControl />
        <AddTransaction onClick={() => setAdding(true)} />
      </PageHeader>
      {vault.demo && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-line bg-surface px-3 py-2.5 sm:px-4">
          <FlaskConical size={17} className="shrink-0 text-positive" aria-hidden="true" />
          <p className="min-w-[13rem] flex-1 text-sm text-muted">
            <strong className="me-2 font-semibold text-foreground">{t("common.demo")}</strong>
            {t("overview.demoBody")}
          </p>
          <Button
            variant="ghost"
            className="!min-h-8 !py-1.5 text-positive"
            onClick={() => setReset(true)}
          >
            {t("overview.startFresh")}
          </Button>
        </div>
      )}
      <div className="grid gap-3 min-[375px]:grid-cols-2 xl:grid-cols-4">
        <Metric
          featured
          label={t("overview.balance")}
          value={format.money(balance)}
          detail={t("overview.across", { count: vault.accounts.length })}
          icon={WalletCards}
        />
        <Metric
          label={t("overview.monthIncome")}
          value={format.money(flow.income)}
          detail={t("overview.previous", { value: format.money(previous.income) })}
          icon={ArrowDownLeft}
        />
        <Metric
          label={t("overview.monthExpenses")}
          value={format.money(flow.expenses)}
          detail={t("overview.previous", { value: format.money(previous.expenses) })}
          icon={ArrowUpRight}
          tone="amber"
        />
        <Metric
          label={t("overview.monthNet")}
          value={format.money(flow.net)}
          detail={t("overview.leftOver")}
          icon={ChartNoAxesColumnIncreasing}
          tone="violet"
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <CashFlowChart data={history} currency={currency} />
        <SpendingChart entries={monthEntries} currency={currency} />
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHeader
            title={t("overview.recent")}
            action={
              <TextLink href={localizedPath(locale, "/dashboard/transactions")}>
                {t("common.viewAll")}
              </TextLink>
            }
          />
          {recent.length > 0 ? (
            <RecentTransactions entries={recent} />
          ) : (
            <EmptyState
              title={t("common.empty")}
              description={t("overview.noRecent")}
              icon={List}
            />
          )}
        </Panel>
        <div className="grid gap-4">
          <Panel>
            <PanelHeader
              title={t("overview.upcoming")}
              action={
                <TextLink href={localizedPath(locale, "/dashboard/recurring")}>
                  {t("common.viewAll")}
                </TextLink>
              }
            />
            {upcoming.length > 0 ? (
              <ul className="grid gap-3">
                {upcoming.map((item) => (
                  <li key={item.id} className="flex min-w-0 items-center gap-2.5">
                    <IconTile {...categoryVisual[item.category]} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{format.name(item)}</p>
                      <p
                        className={
                          "mt-0.5 text-xs " +
                          (item.nextDate < today ? "text-danger" : "text-muted")
                        }
                      >
                        {item.nextDate < today ? t("recurring.overdue") + " · " : ""}
                        {format.date(item.nextDate)}
                      </p>
                    </div>
                    <bdi className="text-sm font-semibold">{format.money(item.amount)}</bdi>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title={t("common.empty")}
                description={t("overview.noUpcoming")}
                icon={CalendarClock}
              />
            )}
          </Panel>
          <Panel>
            <PanelHeader
              title={t("overview.goals")}
              action={
                <TextLink href={localizedPath(locale, "/dashboard/goals")}>
                  {t("common.viewAll")}
                </TextLink>
              }
            />
            {vault.goals.length > 0 ? (
              <ul className="grid gap-4">
                {vault.goals.slice(0, 3).map((goal) => (
                  <li key={goal.id}>
                    <div className="mb-2 flex min-w-0 justify-between gap-2 text-sm">
                      <span className="truncate font-medium">{format.name(goal)}</span>
                      <bdi className="shrink-0 font-semibold text-positive">
                        {format.percent(goal.saved / goal.target)}
                      </bdi>
                    </div>
                    <Progress
                      value={(goal.saved / goal.target) * 100}
                      label={format.name(goal)}
                      tone={goalVisual[goal.style].tone}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title={t("common.empty")}
                description={t("overview.noGoals")}
                icon={Target}
              />
            )}
          </Panel>
        </div>
      </div>
      {adding && (
        <TransactionEditor
          defaultDate={month === currentMonth() ? today : month + "-01"}
          close={() => setAdding(false)}
        />
      )}
      <ConfirmDialog
        open={reset}
        close={() => setReset(false)}
        destructive
        pending={write.pending}
        title={t("settings.resetTitle")}
        description={t("settings.resetDescription")}
        action={t("overview.startFresh")}
        onConfirm={async () => {
          if (
            await write.save({
              replacement: emptyVault(currency),
              success: t("settings.resetDone"),
            })
          )
            setReset(false);
        }}
      />
    </div>
  );
}
