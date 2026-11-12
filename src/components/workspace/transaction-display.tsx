"use client";

import { useTranslations } from "next-intl";
import { IconTile } from "@/components/ui";
import type { Transaction } from "@/lib/finance/model";
import { transactionVisual, useFormats } from "./presentation";
import { useVaultData } from "./workspace-data";

export function TransactionTitle({
  entry,
  subtitle,
}: {
  entry: Transaction;
  subtitle?: string;
}) {
  const { preferences } = useVaultData();
  const format = useFormats(preferences.currency);
  const visual = transactionVisual(entry);
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <IconTile {...visual} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold" title={format.name(entry)}>
          {format.name(entry)}
        </p>
        {subtitle && <p className="mt-0.5 truncate text-xs text-muted">{subtitle}</p>}
      </div>
    </div>
  );
}

export function TransactionAmount({ entry }: { entry: Transaction }) {
  const { preferences } = useVaultData();
  const format = useFormats(preferences.currency);
  const amount = entry.kind === "expense" ? -entry.amount : entry.amount;
  return (
    <bdi
      className={
        "font-semibold tabular-nums " + (entry.kind === "income" ? "text-positive" : "")
      }
    >
      {entry.kind === "income" && "+"}
      {format.money(amount)}
    </bdi>
  );
}

export function RecentTransactions({ entries }: { entries: Transaction[] }) {
  const t = useTranslations();
  const { preferences } = useVaultData();
  const format = useFormats(preferences.currency);
  return (
    <ul className="divide-y divide-line">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="flex min-w-0 items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
        >
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
            <p className="mt-0.5 text-xs text-muted">{format.date(entry.date)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
