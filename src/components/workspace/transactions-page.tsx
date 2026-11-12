"use client";

import { ChevronLeft, ChevronRight, Download, List, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import {
  Button,
  EmptyState,
  IconButton,
  Input,
  PageHeader,
  Panel,
  Select,
} from "@/components/ui";
import { expenseCategories, incomeCategories } from "@/lib/finance/catalog";
import { currentMonth } from "@/lib/finance/dates";
import { downloadText, transactionsCsv } from "@/lib/finance/export";
import type { Transaction } from "@/lib/finance/model";
import { removeRecord } from "@/lib/finance/operations";
import { newestFirst } from "@/lib/finance/selectors";
import { DeleteDialog, RecordActions } from "./forms";
import { MonthControl, useMonth } from "./month";
import { useFormats } from "./presentation";
import { TransactionAmount, TransactionTitle } from "./transaction-display";
import { AddTransaction, TransactionEditor } from "./transaction-editor";
import { useVaultData } from "./workspace-data";

const PAGE_SIZE = 12;
const initialFilters = { text: "", kind: "", category: "", account: "", period: "" };
type Filters = typeof initialFilters;
const kinds = ["expense", "income", "transfer"] as const;

function Ledger() {
  const t = useTranslations();
  const locale = useLocale();
  const vault = useVaultData();
  const { month } = useMonth();
  const format = useFormats(vault.preferences.currency);
  const params = useSearchParams();
  const [filters, setFilters] = useState<Filters>(() => ({
    ...initialFilters,
    account: vault.accounts.find((account) => account.id === params.get("account"))?.id ?? "",
  }));
  const [page, setPage] = useState(0);
  const [editor, setEditor] = useState<Transaction | "new" | null>(null);
  const [deleting, setDeleting] = useState<Transaction>();

  const accounts = new Map(vault.accounts.map((account) => [account.id, format.name(account)]));
  const categories =
    filters.kind === "expense"
      ? expenseCategories
      : filters.kind === "income"
        ? incomeCategories
        : [...expenseCategories, ...incomeCategories];
  const labels = (entry: Transaction) => ({
    name: format.name(entry),
    account: accounts.get(entry.accountId) ?? "",
    destination: entry.kind === "transfer" ? (accounts.get(entry.toAccountId) ?? "") : "",
  });
  const accountLabel = (entry: Transaction) => {
    const { account, destination } = labels(entry);
    return destination ? account + " → " + destination : account;
  };
  const term = filters.text.trim().toLocaleLowerCase(locale);
  const matching = newestFirst(
    vault.transactions.filter((entry) => {
      if (filters.kind && entry.kind !== filters.kind) return false;
      if (
        filters.category &&
        (entry.kind === "transfer" || entry.category !== filters.category)
      )
        return false;
      if (filters.period && !entry.date.startsWith(month + "-")) return false;
      if (
        filters.account &&
        entry.accountId !== filters.account &&
        (entry.kind !== "transfer" || entry.toAccountId !== filters.account)
      )
        return false;
      return (
        !term ||
        [format.name(entry), entry.note, accountLabel(entry)].some((text) =>
          text.toLocaleLowerCase(locale).includes(term),
        )
      );
    }),
  );
  const lastPage = Math.max(0, Math.ceil(matching.length / PAGE_SIZE) - 1);
  const displayedPage = Math.min(page, lastPage);
  const visible = matching.slice(displayedPage * PAGE_SIZE, (displayedPage + 1) * PAGE_SIZE);
  const filtered = Object.values(filters).some(Boolean);

  function change(key: keyof Filters, value: string) {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
      ...(key === "kind" ? { category: "" } : {}),
    }));
    setPage(0);
  }

  function clear() {
    setFilters(initialFilters);
    setPage(0);
  }

  function exportCsv() {
    downloadText(
      "vaultly-transactions.csv",
      transactionsCsv(matching, labels),
      "text/csv;charset=utf-8",
    );
    toast.success(t("transactions.exportDone"));
  }

  return (
    <div className="workspace-page">
      <PageHeader title={t("transactions.title")} description={t("transactions.description")}>
        <Button onClick={exportCsv} disabled={matching.length === 0}>
          <Download size={16} aria-hidden="true" />
          {t("transactions.export")}
        </Button>
        <AddTransaction onClick={() => setEditor("new")} />
      </PageHeader>
      <Panel className="!p-0">
        <div className="grid gap-3 p-4 sm:p-5">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(12rem,1.65fr)_repeat(4,minmax(0,1fr))]">
            <label className="relative sm:col-span-2 xl:col-span-1">
              <span className="sr-only">{t("transactions.search")}</span>
              <Search
                size={17}
                className="pointer-events-none absolute start-3 top-3.5 text-muted"
                aria-hidden="true"
              />
              <Input
                type="search"
                placeholder={t("transactions.searchPlaceholder")}
                className="!ps-9"
                value={filters.text}
                onChange={(event) => change("text", event.target.value)}
              />
            </label>
            <Select
              aria-label={t("transactions.type")}
              value={filters.kind}
              onChange={(event) => change("kind", event.target.value)}
            >
              <option value="">{t("transactions.allTypes")}</option>
              {kinds.map((kind) => (
                <option key={kind} value={kind}>
                  {t(`common.${kind}`)}
                </option>
              ))}
            </Select>
            <Select
              aria-label={t("common.category")}
              value={filters.category}
              disabled={filters.kind === "transfer"}
              onChange={(event) => change("category", event.target.value)}
            >
              <option value="">{t("transactions.allCategories")}</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {t(`categories.${category}`)}
                </option>
              ))}
            </Select>
            <Select
              aria-label={t("common.account")}
              value={filters.account}
              onChange={(event) => change("account", event.target.value)}
            >
              <option value="">{t("transactions.allAccounts")}</option>
              {vault.accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {format.name(account)}
                </option>
              ))}
            </Select>
            <Select
              aria-label={t("common.month")}
              value={filters.period}
              onChange={(event) => change("period", event.target.value)}
            >
              <option value="">{t("transactions.allMonths")}</option>
              <option value="selected">{t("transactions.selectedMonth")}</option>
            </Select>
          </div>
          {(filtered || filters.period) && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button variant="ghost" onClick={clear}>
                {t("common.clear")}
              </Button>
              {filters.period && <MonthControl />}
            </div>
          )}
        </div>
        {visible.length === 0 ? (
          <div className="border-t border-line">
            <EmptyState
              icon={List}
              title={t("transactions.empty")}
              description={t("transactions.emptyHint")}
            />
          </div>
        ) : (
          <>
            <div className="hidden sm:block">
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th scope="col">{t("transactions.name")}</th>
                    <th scope="col" className="hidden lg:table-cell">
                      {t("common.account")}
                    </th>
                    <th scope="col">{t("common.date")}</th>
                    <th scope="col" className="text-end">
                      {t("common.amount")}
                    </th>
                    <th scope="col">
                      <span className="sr-only">{t("common.actions")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((entry) => (
                    <tr key={entry.id}>
                      <td className="max-w-[19rem]">
                        <TransactionTitle
                          entry={entry}
                          subtitle={
                            entry.kind === "transfer"
                              ? t("common.transfer")
                              : t(`categories.${entry.category}`)
                          }
                        />
                      </td>
                      <td
                        className="hidden max-w-48 truncate text-muted lg:table-cell"
                        title={accountLabel(entry)}
                      >
                        {accountLabel(entry)}
                      </td>
                      <td className="whitespace-nowrap text-muted">
                        {format.date(entry.date, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="whitespace-nowrap text-end">
                        <TransactionAmount entry={entry} />
                      </td>
                      <td className="w-1">
                        <RecordActions
                          name={format.name(entry)}
                          edit={() => setEditor(entry)}
                          remove={() => setDeleting(entry)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-line border-t border-line px-3 sm:hidden">
              {visible.map((entry) => (
                <li className="grid gap-2 py-3" key={entry.id}>
                  <div className="flex items-center justify-between gap-2">
                    <TransactionTitle
                      entry={entry}
                      subtitle={
                        entry.kind === "transfer"
                          ? t("common.transfer")
                          : t(`categories.${entry.category}`)
                      }
                    />
                    <div className="shrink-0 text-end text-sm">
                      <TransactionAmount entry={entry} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-xs text-muted">
                      {accountLabel(entry)} · {format.date(entry.date)}
                    </p>
                    <RecordActions
                      name={format.name(entry)}
                      edit={() => setEditor(entry)}
                      remove={() => setDeleting(entry)}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line p-3.5 sm:px-5">
              <p className="text-xs text-muted">
                {t("transactions.result", {
                  start: displayedPage * PAGE_SIZE + 1,
                  end: displayedPage * PAGE_SIZE + visible.length,
                  count: matching.length,
                })}
              </p>
              <div className="flex items-center gap-1">
                <IconButton
                  label={t("common.previous")}
                  icon={locale === "fa" ? ChevronRight : ChevronLeft}
                  disabled={displayedPage === 0}
                  onClick={() => setPage(displayedPage - 1)}
                />
                <IconButton
                  label={t("common.next")}
                  icon={locale === "fa" ? ChevronLeft : ChevronRight}
                  disabled={displayedPage === lastPage}
                  onClick={() => setPage(displayedPage + 1)}
                />
              </div>
            </div>
          </>
        )}
      </Panel>
      {editor && (
        <TransactionEditor
          entry={editor === "new" ? undefined : editor}
          defaultDate={filters.period && month !== currentMonth() ? month + "-01" : undefined}
          defaultAccount={filters.account || undefined}
          close={() => setEditor(null)}
        />
      )}
      <DeleteDialog
        record={deleting && { id: deleting.id, name: format.name(deleting) }}
        close={() => setDeleting(undefined)}
        update={(current, id) => ({
          ...current,
          transactions: removeRecord(current.transactions, id),
        })}
      />
    </div>
  );
}

export function TransactionsPage() {
  return (
    <Suspense>
      <Ledger />
    </Suspense>
  );
}
