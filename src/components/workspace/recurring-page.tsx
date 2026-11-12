"use client";

import {
  CalendarClock,
  CalendarDays,
  Check,
  CircleDollarSign,
  Pause,
  Play,
  Plus,
  Repeat2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  Button,
  buttonClass,
  ConfirmDialog,
  EmptyState,
  Field,
  FormActions,
  IconTile,
  Input,
  Metric,
  Modal,
  PageHeader,
  Panel,
  Select,
} from "@/components/ui";
import { cadences, expenseCategories } from "@/lib/finance/catalog";
import { daysBetween, localDate } from "@/lib/finance/dates";
import { recurringSchema, type Recurring } from "@/lib/finance/model";
import { parseMoney } from "@/lib/finance/money";
import { putRecord, recordPayment, removeRecord, VaultError } from "@/lib/finance/operations";
import { dueFirst, monthlyRecurring } from "@/lib/finance/selectors";
import { localizedPath } from "@/lib/i18n";
import { AmountField, DeleteDialog, RecordActions, formValue } from "./forms";
import { categoryVisual, useFormats } from "./presentation";
import { useVaultData, useVaultWrite } from "./workspace-data";

function RecurringEditor({ item, close }: { item?: Recurring; close: () => void }) {
  const t = useTranslations();
  const { accounts, preferences } = useVaultData();
  const format = useFormats(preferences.currency);
  const [problem, setProblem] = useState("");
  const write = useVaultWrite();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const amount = parseMoney(formValue(form, "amount"));
    if (amount === null || amount <= 0) {
      setProblem(t("common.invalidAmount"));
      return;
    }
    const nextDate = formValue(form, "nextDate");
    const result = recurringSchema.safeParse({
      id: item?.id ?? crypto.randomUUID(),
      name: formValue(form, "name"),
      amount,
      nextDate,
      anchorDay: item?.nextDate === nextDate ? item.anchorDay : Number(nextDate.slice(8)),
      accountId: formValue(form, "account"),
      category: formValue(form, "category"),
      cadence: formValue(form, "cadence"),
      active: item?.active ?? true,
    });
    if (!result.success) {
      setProblem(t("errors.invalid"));
      return;
    }
    setProblem("");
    if (
      await write.save({
        update: (vault) => ({
          ...vault,
          recurring: putRecord(vault.recurring, result.data, !!item),
        }),
      })
    )
      close();
  }

  return (
    <Modal
      open
      title={t(item ? "recurring.edit" : "recurring.add")}
      description={t("recurring.formHint")}
      onOpenChange={(open) => !open && close()}
    >
      <form onSubmit={submit} className="grid gap-4">
        <Field label={t("common.name")}>
          <Input
            name="name"
            defaultValue={item ? format.name(item) : ""}
            placeholder={t("recurring.placeholder")}
            maxLength={80}
            required
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <AmountField label={t("common.amount")} amount={item?.amount} />
          <Field label={t("common.nextDue")}>
            <Input
              type="date"
              name="nextDate"
              defaultValue={item?.nextDate ?? localDate()}
              required
            />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("recurring.cadence")}>
            <Select name="cadence" defaultValue={item?.cadence ?? "monthly"}>
              {cadences.map((cadence) => (
                <option key={cadence} value={cadence}>
                  {t(`recurring.${cadence}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("common.account")}>
            <Select
              name="account"
              defaultValue={item?.accountId ?? accounts[0]?.id ?? ""}
              required
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {format.name(account)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label={t("common.category")}>
          <Select name="category" defaultValue={item?.category ?? ""} required>
            <option value="" disabled>
              {t("common.select")}
            </option>
            {expenseCategories.map((category) => (
              <option key={category} value={category}>
                {t(`categories.${category}`)}
              </option>
            ))}
          </Select>
        </Field>
        {problem && (
          <p role="alert" className="text-sm text-danger">
            {problem}
          </p>
        )}
        <FormActions
          close={close}
          pending={write.pending}
          label={item ? undefined : t("recurring.add")}
        />
      </form>
    </Modal>
  );
}

export function RecurringPage() {
  const t = useTranslations();
  const locale = useLocale();
  const vault = useVaultData();
  const format = useFormats(vault.preferences.currency);
  const write = useVaultWrite();
  const [editor, setEditor] = useState<Recurring | "new" | null>(null);
  const [deleting, setDeleting] = useState<Recurring>();
  const [paying, setPaying] = useState<Recurring>();
  const today = localDate();
  const items = dueFirst(vault.recurring);
  const active = items.filter((item) => item.active);
  const soon = active.filter((item) => {
    const distance = daysBetween(today, item.nextDate);
    return distance >= 0 && distance <= 7;
  }).length;
  const accountNames = new Map(
    vault.accounts.map((account) => [account.id, format.name(account)]),
  );

  async function toggle(item: Recurring) {
    await write.save({
      update: (current) => {
        const record = current.recurring.find(({ id }) => id === item.id);
        if (!record || record.active !== item.active) throw new VaultError("stale");
        return {
          ...current,
          recurring: putRecord(current.recurring, { ...record, active: !record.active }, true),
        };
      },
    });
  }

  return (
    <div className="workspace-page">
      <PageHeader title={t("recurring.title")} description={t("recurring.description")}>
        {vault.accounts.length > 0 ? (
          <Button variant="primary" onClick={() => setEditor("new")}>
            <Plus size={17} aria-hidden="true" />
            {t("recurring.add")}
          </Button>
        ) : (
          <Link
            href={localizedPath(locale, "/dashboard/accounts")}
            className={buttonClass("primary")}
            title={t("recurring.noAccounts")}
          >
            <Plus size={17} aria-hidden="true" />
            {t("common.addAnAccount")}
          </Link>
        )}
      </PageHeader>
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric
          label={t("recurring.monthlyEstimate")}
          value={format.money(monthlyRecurring(items))}
          icon={CircleDollarSign}
          featured
        />
        <Metric
          label={t("recurring.activePayments")}
          value={format.count(active.length)}
          icon={Repeat2}
          tone="blue"
        />
        <Metric
          label={t("recurring.dueSoon")}
          value={format.count(soon)}
          icon={CalendarDays}
          tone="amber"
        />
      </div>
      {items.length ? (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {items.map((item) => {
            const name = format.name(item);
            const overdue = item.active && item.nextDate < today;
            return (
              <Panel key={item.id} className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-2">
                  <IconTile {...categoryVisual[item.category]} />
                  <RecordActions
                    name={name}
                    edit={() => setEditor(item)}
                    remove={() => setDeleting(item)}
                  />
                </div>
                <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="display break-words text-xl font-semibold">{name}</h2>
                    <p className="mt-1 text-xs text-muted">
                      {accountNames.get(item.accountId)} · {t(`recurring.${item.cadence}`)}
                    </p>
                  </div>
                  <bdi className="display text-xl font-semibold tabular-nums">
                    {format.money(item.amount)}
                  </bdi>
                </div>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 rounded-xl bg-raised p-3 text-xs">
                  <span className="flex items-center gap-1.5 text-muted">
                    <CalendarDays size={15} aria-hidden="true" />
                    {t("common.nextDue")}{" "}
                    <strong className="ms-1 text-foreground">
                      {format.date(item.nextDate, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </strong>
                  </span>
                  <span
                    className={
                      "font-semibold " +
                      (overdue ? "text-danger" : item.active ? "text-positive" : "text-muted")
                    }
                  >
                    {t(
                      overdue
                        ? "recurring.overdue"
                        : item.active
                          ? "recurring.active"
                          : "recurring.paused",
                    )}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {item.active && (
                    <Button onClick={() => setPaying(item)}>
                      <Check size={16} aria-hidden="true" />
                      {t("recurring.markPaid")}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    disabled={write.pending}
                    onClick={() => void toggle(item)}
                  >
                    {item.active ? (
                      <Pause size={16} aria-hidden="true" />
                    ) : (
                      <Play size={16} aria-hidden="true" />
                    )}
                    {t(item.active ? "recurring.pause" : "recurring.resume")}
                  </Button>
                </div>
              </Panel>
            );
          })}
        </div>
      ) : (
        <Panel>
          <EmptyState
            title={t("recurring.empty")}
            description={t("recurring.emptyHint")}
            icon={CalendarClock}
          />
        </Panel>
      )}
      {editor && (
        <RecurringEditor
          item={editor === "new" ? undefined : editor}
          close={() => setEditor(null)}
        />
      )}
      <DeleteDialog
        record={deleting && { id: deleting.id, name: format.name(deleting) }}
        close={() => setDeleting(undefined)}
        update={(current, id) => ({
          ...current,
          recurring: removeRecord(current.recurring, id),
        })}
      />
      {paying && (
        <ConfirmDialog
          open
          title={t("recurring.paidTitle", { name: format.name(paying) })}
          description={t("recurring.paidDescription", { amount: format.money(paying.amount) })}
          action={t("recurring.markPaid")}
          close={() => setPaying(undefined)}
          pending={write.pending}
          onConfirm={async () => {
            if (
              await write.save({
                update: (current) =>
                  recordPayment(current, paying, crypto.randomUUID(), localDate()),
                success: t("recurring.paid"),
              })
            )
              setPaying(undefined);
          }}
        />
      )}
    </div>
  );
}
