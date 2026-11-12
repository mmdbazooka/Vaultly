"use client";

import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  Button,
  buttonClass,
  Field,
  FormActions,
  Input,
  Modal,
  Select,
  TextArea,
} from "@/components/ui";
import { expenseCategories, incomeCategories } from "@/lib/finance/catalog";
import { localDate } from "@/lib/finance/dates";
import { transactionSchema, type Transaction } from "@/lib/finance/model";
import { parseMoney } from "@/lib/finance/money";
import { putTransaction } from "@/lib/finance/operations";
import { localizedPath } from "@/lib/i18n";
import { AmountField, formValue } from "./forms";
import { useFormats } from "./presentation";
import { useVaultData, useVaultWrite } from "./workspace-data";

const kinds = [
  { kind: "expense", icon: ArrowUpRight },
  { kind: "income", icon: ArrowDownLeft },
  { kind: "transfer", icon: ArrowLeftRight },
] as const;

export function TransactionEditor({
  entry,
  close,
  defaultDate,
  defaultAccount,
}: {
  entry?: Transaction;
  close: () => void;
  defaultDate?: string;
  defaultAccount?: string;
}) {
  const t = useTranslations();
  const { accounts, preferences } = useVaultData();
  const format = useFormats(preferences.currency);
  const [kind, setKind] = useState<Transaction["kind"]>(entry?.kind ?? "expense");
  const [problem, setProblem] = useState("");
  const write = useVaultWrite();
  const categories = kind === "income" ? incomeCategories : expenseCategories;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const amount = parseMoney(formValue(form, "amount"));
    if (amount === null || amount <= 0) {
      setProblem(t("common.invalidAmount"));
      return;
    }

    const accountId = formValue(form, "account");
    const toAccountId = formValue(form, "destination");
    if (kind === "transfer" && accountId === toAccountId) {
      setProblem(t("errors.sameAccount"));
      return;
    }
    const result = transactionSchema.safeParse({
      id: entry?.id ?? crypto.randomUUID(),
      kind,
      accountId,
      amount,
      date: formValue(form, "date"),
      name: formValue(form, "name"),
      note: formValue(form, "note"),
      ...(kind === "transfer" ? { toAccountId } : { category: formValue(form, "category") }),
    });
    if (!result.success) {
      setProblem(t("errors.invalid"));
      return;
    }

    setProblem("");
    if (await write.save({ update: (vault) => putTransaction(vault, result.data, !!entry) }))
      close();
  }

  return (
    <Modal
      open
      onOpenChange={(open) => !open && close()}
      title={t(entry ? "transactions.edit" : "transactions.add")}
      description={t("transactions.addHelp")}
    >
      <form className="grid gap-4" onSubmit={submit}>
        <div
          role="group"
          aria-label={t("transactions.type")}
          className="segmented grid grid-cols-3"
        >
          {kinds.map(({ kind: value, icon: Icon }) => (
            <button
              type="button"
              key={value}
              aria-pressed={kind === value}
              disabled={value === "transfer" && accounts.length < 2}
              onClick={() => {
                setKind(value);
                setProblem("");
              }}
            >
              <Icon size={15} aria-hidden="true" />
              {t(("common." + value) as "common.expense" | "common.income" | "common.transfer")}
            </button>
          ))}
        </div>
        <Field label={t("transactions.name")}>
          <Input
            name="name"
            placeholder={t("transactions.namePlaceholder")}
            defaultValue={entry ? format.name(entry) : ""}
            maxLength={80}
            required
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <AmountField label={t("common.amount")} amount={entry?.amount} />
          <Field label={t("common.date")}>
            <Input
              type="date"
              name="date"
              defaultValue={entry?.date ?? defaultDate ?? localDate()}
              required
            />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={kind === "transfer" ? t("common.from") : t("common.account")}>
            <Select
              name="account"
              defaultValue={entry?.accountId ?? defaultAccount ?? accounts[0]?.id ?? ""}
              required
            >
              {accounts.map((account) => (
                <option value={account.id} key={account.id}>
                  {format.name(account)}
                </option>
              ))}
            </Select>
          </Field>
          {kind === "transfer" ? (
            <Field label={t("transactions.destination")}>
              <Select
                name="destination"
                defaultValue={entry?.kind === "transfer" ? entry.toAccountId : ""}
                required
              >
                <option value="" disabled>
                  {t("common.select")}
                </option>
                {accounts.map((account) => (
                  <option value={account.id} key={account.id}>
                    {format.name(account)}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <Field label={t("common.category")}>
              <Select
                key={kind}
                name="category"
                defaultValue={entry?.kind === kind ? entry.category : ""}
                required
              >
                <option value="" disabled>
                  {t("common.select")}
                </option>
                {categories.map((category) => (
                  <option value={category} key={category}>
                    {t(("categories." + category) as `categories.${typeof category}`)}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </div>
        <Field label={t("transactions.note") + " (" + t("common.optional") + ")"}>
          <TextArea name="note" maxLength={240} defaultValue={entry?.note} />
        </Field>
        {problem && (
          <p className="text-sm text-danger" role="alert">
            {problem}
          </p>
        )}
        <FormActions
          pending={write.pending}
          close={close}
          label={entry ? undefined : t("transactions.add")}
        />
      </form>
    </Modal>
  );
}

export function AddTransaction({ onClick }: { onClick: () => void }) {
  const t = useTranslations();
  const locale = useLocale();
  const { accounts } = useVaultData();
  if (accounts.length === 0) {
    return (
      <Link
        href={localizedPath(locale, "/dashboard/accounts")}
        className={buttonClass("primary")}
        title={t("transactions.noAccounts")}
      >
        <Plus size={17} aria-hidden="true" />
        {t("common.addAnAccount")}
      </Link>
    );
  }
  return (
    <Button variant="primary" onClick={onClick}>
      <Plus size={17} aria-hidden="true" />
      {t("transactions.add")}
    </Button>
  );
}
