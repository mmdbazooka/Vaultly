"use client";

import { CalendarDays, CheckCircle2, Flag, PiggyBank, Plus, Target } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import {
  Button,
  EmptyState,
  Field,
  FormActions,
  IconTile,
  Input,
  Metric,
  Modal,
  PageHeader,
  Panel,
  Progress,
  Select,
} from "@/components/ui";
import { goalStyles } from "@/lib/finance/catalog";
import { goalSchema, type Goal } from "@/lib/finance/model";
import { parseMoney } from "@/lib/finance/money";
import { putRecord, removeRecord, VaultError } from "@/lib/finance/operations";
import { AmountField, DeleteDialog, RecordActions, formValue } from "./forms";
import { goalVisual, useFormats } from "./presentation";
import { useVaultData, useVaultWrite } from "./workspace-data";

function GoalEditor({ goal, close }: { goal?: Goal; close: () => void }) {
  const t = useTranslations();
  const { preferences } = useVaultData();
  const format = useFormats(preferences.currency);
  const [problem, setProblem] = useState("");
  const write = useVaultWrite();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const target = parseMoney(formValue(form, "target"));
    const saved = parseMoney(formValue(form, "saved"));
    if (target === null || target <= 0 || saved === null || saved < 0) {
      setProblem(t("common.invalidAmount"));
      return;
    }
    const result = goalSchema.safeParse({
      id: goal?.id ?? crypto.randomUUID(),
      name: formValue(form, "name"),
      style: formValue(form, "style"),
      deadline: formValue(form, "deadline") || null,
      target,
      saved,
    });
    if (!result.success) {
      setProblem(t("errors.invalid"));
      return;
    }
    setProblem("");
    if (
      await write.save({
        update: (vault) => ({ ...vault, goals: putRecord(vault.goals, result.data, !!goal) }),
      })
    )
      close();
  }

  return (
    <Modal
      open
      title={t(goal ? "goals.edit" : "goals.add")}
      description={t("goals.formHint")}
      onOpenChange={(open) => !open && close()}
    >
      <form onSubmit={submit} className="grid gap-4">
        <Field label={t("common.name")}>
          <Input
            name="name"
            defaultValue={goal ? format.name(goal) : ""}
            placeholder={t("goals.placeholder")}
            maxLength={80}
            required
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <AmountField label={t("goals.target")} name="target" amount={goal?.target} />
          <AmountField label={t("goals.saved")} name="saved" amount={goal?.saved ?? 0} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("goals.style")}>
            <Select name="style" defaultValue={goal?.style ?? "safety"}>
              {goalStyles.map((style) => (
                <option value={style} key={style}>
                  {t(`goals.${style}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("goals.deadline")} hint={t("common.optional")}>
            <Input type="date" name="deadline" defaultValue={goal?.deadline ?? ""} />
          </Field>
        </div>
        {problem && (
          <p role="alert" className="text-sm text-danger">
            {problem}
          </p>
        )}
        <FormActions
          close={close}
          pending={write.pending}
          label={goal ? undefined : t("goals.add")}
        />
      </form>
    </Modal>
  );
}

function Contribute({ goal, close }: { goal: Goal; close: () => void }) {
  const t = useTranslations();
  const { preferences } = useVaultData();
  const format = useFormats(preferences.currency);
  const write = useVaultWrite();
  const [problem, setProblem] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = parseMoney(formValue(new FormData(event.currentTarget), "amount"));
    if (amount === null || amount <= 0) {
      setProblem(t("common.invalidAmount"));
      return;
    }
    setProblem("");
    if (
      await write.save({
        success: t("goals.contributed"),
        update: (vault) => {
          const current = vault.goals.find(({ id }) => id === goal.id);
          if (!current) throw new VaultError("stale");
          return {
            ...vault,
            goals: putRecord(vault.goals, { ...current, saved: current.saved + amount }, true),
          };
        },
      })
    )
      close();
  }

  return (
    <Modal
      open
      title={t("goals.contribution")}
      description={t("goals.contributeHelp", { name: format.name(goal) })}
      onOpenChange={(open) => !open && close()}
    >
      <form onSubmit={submit} className="grid gap-4">
        <AmountField label={t("common.amount")} />
        {problem && (
          <p role="alert" className="text-sm text-danger">
            {problem}
          </p>
        )}
        <FormActions close={close} pending={write.pending} label={t("goals.contribution")} />
      </form>
    </Modal>
  );
}

export function GoalsPage() {
  const t = useTranslations();
  const { preferences, goals } = useVaultData();
  const format = useFormats(preferences.currency);
  const [editor, setEditor] = useState<Goal | "new" | null>(null);
  const [deleting, setDeleting] = useState<Goal>();
  const [contribution, setContribution] = useState<Goal>();
  const totalSaved = goals.reduce((sum, goal) => sum + goal.saved, 0);
  const totalTarget = goals.reduce((sum, goal) => sum + goal.target, 0);
  const completed = goals.filter((goal) => goal.saved >= goal.target).length;

  return (
    <div className="workspace-page">
      <PageHeader title={t("goals.title")} description={t("goals.description")}>
        <Button variant="primary" onClick={() => setEditor("new")}>
          <Plus size={17} aria-hidden="true" />
          {t("goals.add")}
        </Button>
      </PageHeader>
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric
          label={t("goals.totalSaved")}
          value={format.money(totalSaved)}
          icon={PiggyBank}
          featured
        />
        <Metric
          label={t("goals.totalTarget")}
          value={format.money(totalTarget)}
          icon={Target}
          tone="blue"
        />
        <Metric
          label={t("goals.completed")}
          value={format.count(completed) + " / " + format.count(goals.length)}
          icon={Flag}
          tone="violet"
        />
      </div>
      {goals.length ? (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {goals.map((goal) => {
            const name = format.name(goal);
            const ratio = goal.saved / goal.target;
            const visual = goalVisual[goal.style];
            return (
              <Panel key={goal.id} className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-2">
                  <IconTile {...visual} />
                  <RecordActions
                    name={name}
                    edit={() => setEditor(goal)}
                    remove={() => setDeleting(goal)}
                  />
                </div>
                <div>
                  <h2 className="display break-words text-2xl font-semibold">{name}</h2>
                  {goal.deadline && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                      <CalendarDays size={14} aria-hidden="true" />
                      {format.date(goal.deadline, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </div>
                <div className="mt-auto">
                  <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-muted">
                      {t("goals.progress", {
                        saved: format.money(goal.saved),
                        target: format.money(goal.target),
                      })}
                    </span>
                    <bdi className="font-bold text-positive">{format.percent(ratio)}</bdi>
                  </div>
                  <Progress value={ratio * 100} label={name} tone={visual.tone} />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Button onClick={() => setContribution(goal)}>
                    <Plus size={15} aria-hidden="true" />
                    {t("goals.contribution")}
                  </Button>
                  {ratio >= 1 && (
                    <p className="flex items-center gap-1 text-xs font-medium text-positive">
                      <CheckCircle2 size={15} aria-hidden="true" />
                      {t("goals.complete")}
                    </p>
                  )}
                </div>
              </Panel>
            );
          })}
        </div>
      ) : (
        <Panel>
          <EmptyState
            title={t("goals.empty")}
            description={t("goals.emptyHint")}
            icon={Target}
          />
        </Panel>
      )}
      {editor && (
        <GoalEditor
          goal={editor === "new" ? undefined : editor}
          close={() => setEditor(null)}
        />
      )}
      {contribution && (
        <Contribute goal={contribution} close={() => setContribution(undefined)} />
      )}
      <DeleteDialog
        record={deleting && { id: deleting.id, name: format.name(deleting) }}
        close={() => setDeleting(undefined)}
        update={(vault, id) => ({ ...vault, goals: removeRecord(vault.goals, id) })}
      />
    </div>
  );
}
