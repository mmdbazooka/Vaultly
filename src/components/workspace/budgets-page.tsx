"use client";

import { ArrowUpRight, CircleAlert, PieChart, Plus, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import {
  Button,
  EmptyState,
  Field,
  FormActions,
  IconTile,
  Metric,
  Modal,
  PageHeader,
  Panel,
  Progress,
  Select,
} from "@/components/ui";
import { expenseCategories } from "@/lib/finance/catalog";
import { budgetSchema, type Budget } from "@/lib/finance/model";
import { parseMoney } from "@/lib/finance/money";
import { putBudget, removeRecord } from "@/lib/finance/operations";
import { plannedBudget } from "@/lib/finance/selectors";
import { AmountField, DeleteDialog, RecordActions, formValue } from "./forms";
import { MonthControl, useMonth } from "./month";
import { categoryVisual, useFormats } from "./presentation";
import { useVaultData, useVaultWrite } from "./workspace-data";

function BudgetEditor({
  month,
  budget,
  close,
}: {
  month: string;
  budget?: Budget;
  close: () => void;
}) {
  const t = useTranslations();
  const vault = useVaultData();
  const format = useFormats(vault.preferences.currency);
  const [problem, setProblem] = useState("");
  const write = useVaultWrite();
  const occupied = new Set(
    vault.budgets
      .filter((item) => item.month === month && item.id !== budget?.id)
      .map((item) => item.category),
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const limit = parseMoney(formValue(form, "amount"));
    if (limit === null || limit <= 0) {
      setProblem(t("common.invalidAmount"));
      return;
    }
    const result = budgetSchema.safeParse({
      id: budget?.id ?? crypto.randomUUID(),
      month,
      category: formValue(form, "category"),
      limit,
    });
    if (!result.success) {
      setProblem(t("errors.invalid"));
      return;
    }
    setProblem("");
    if (await write.save({ update: (current) => putBudget(current, result.data, !!budget) }))
      close();
  }

  return (
    <Modal
      open
      title={t(budget ? "budgets.edit" : "budgets.add")}
      description={t("budgets.formHint", {
        month: format.date(month, { month: "long", year: "numeric" }),
      })}
      onOpenChange={(open) => !open && close()}
    >
      <form onSubmit={submit} className="grid gap-4">
        <Field label={t("common.category")}>
          <Select name="category" defaultValue={budget?.category ?? ""} required>
            <option value="" disabled>
              {t("common.select")}
            </option>
            {expenseCategories
              .filter((category) => !occupied.has(category))
              .map((category) => (
                <option key={category} value={category}>
                  {t(`categories.${category}`)}
                </option>
              ))}
          </Select>
        </Field>
        <AmountField label={t("budgets.limit")} amount={budget?.limit} />
        {problem && (
          <p role="alert" className="text-sm text-danger">
            {problem}
          </p>
        )}
        <FormActions
          close={close}
          pending={write.pending}
          label={budget ? undefined : t("budgets.add")}
        />
      </form>
    </Modal>
  );
}

export function BudgetsPage() {
  const t = useTranslations();
  const vault = useVaultData();
  const { month } = useMonth();
  const format = useFormats(vault.preferences.currency);
  const [editor, setEditor] = useState<{ month: string; budget?: Budget }>();
  const [deleting, setDeleting] = useState<Budget>();
  const plans = plannedBudget(vault.budgets, vault.transactions, month);
  const limit = plans.reduce((sum, item) => sum + item.limit, 0);
  const spent = plans.reduce((sum, item) => sum + item.spent, 0);
  const remaining = limit - spent;

  return (
    <div className="workspace-page">
      <PageHeader title={t("budgets.title")} description={t("budgets.description")}>
        <MonthControl />
        <Button
          variant="primary"
          onClick={() => setEditor({ month })}
          disabled={plans.length >= expenseCategories.length}
        >
          <Plus size={17} aria-hidden="true" />
          {t("budgets.add")}
        </Button>
      </PageHeader>
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric
          label={t("budgets.planned")}
          value={format.money(limit)}
          icon={PieChart}
          featured
        />
        <Metric
          label={t("budgets.used")}
          value={format.money(spent)}
          icon={ArrowUpRight}
          tone="amber"
        />
        <Metric
          label={t(remaining < 0 ? "budgets.overspent" : "budgets.remaining")}
          value={format.money(Math.abs(remaining))}
          icon={remaining < 0 ? CircleAlert : Wallet}
          tone={remaining < 0 ? "rose" : "green"}
        />
      </div>
      {plans.length ? (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {plans.map((plan) => {
            const name = t(`categories.${plan.category}`);
            const { icon, tone } = categoryVisual[plan.category];
            const left = plan.limit - plan.spent;
            const ratio = plan.spent / plan.limit;
            return (
              <Panel key={plan.id}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <IconTile icon={icon} tone={tone} />
                    <h2 className="font-semibold">{name}</h2>
                  </div>
                  <RecordActions
                    name={name}
                    edit={() => setEditor({ month, budget: plan })}
                    remove={() => setDeleting(plan)}
                  />
                </div>
                <div className="mb-3 mt-6 flex flex-wrap items-end justify-between gap-2">
                  <p className="text-sm text-muted">
                    {t("budgets.usedOf", {
                      spent: format.money(plan.spent),
                      limit: format.money(plan.limit),
                    })}
                  </p>
                  <bdi
                    className={"font-semibold " + (left < 0 ? "text-danger" : "text-positive")}
                  >
                    {format.percent(ratio)}
                  </bdi>
                </div>
                <Progress value={ratio * 100} label={name} tone={left < 0 ? "rose" : tone} />
                <p
                  className={
                    "mt-2.5 text-xs font-medium " + (left < 0 ? "text-danger" : "text-muted")
                  }
                >
                  {t(left < 0 ? "budgets.over" : "budgets.left", {
                    amount: format.money(Math.abs(left)),
                  })}
                </p>
              </Panel>
            );
          })}
        </div>
      ) : (
        <Panel>
          <EmptyState
            icon={PieChart}
            title={t("budgets.empty")}
            description={t("budgets.emptyHint")}
          />
        </Panel>
      )}
      {editor && <BudgetEditor {...editor} close={() => setEditor(undefined)} />}
      <DeleteDialog
        record={deleting && { id: deleting.id, name: t(`categories.${deleting.category}`) }}
        close={() => setDeleting(undefined)}
        update={(current, id) => ({ ...current, budgets: removeRecord(current.budgets, id) })}
      />
    </div>
  );
}
