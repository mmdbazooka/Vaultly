"use client";

import { ArrowDownLeft, ArrowUpRight, Plus, WalletCards } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
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
  Select,
  TextLink,
} from "@/components/ui";
import { accountTypes } from "@/lib/finance/catalog";
import { accountSchema, type Account } from "@/lib/finance/model";
import { parseMoney } from "@/lib/finance/money";
import { putRecord, removeAccount } from "@/lib/finance/operations";
import { accountBalances } from "@/lib/finance/selectors";
import { localizedPath } from "@/lib/i18n";
import { AmountField, DeleteDialog, RecordActions, formValue } from "./forms";
import { accountVisual, useFormats } from "./presentation";
import { useVaultData, useVaultWrite } from "./workspace-data";

function AccountEditor({ account, close }: { account?: Account; close: () => void }) {
  const t = useTranslations();
  const { preferences } = useVaultData();
  const format = useFormats(preferences.currency);
  const [problem, setProblem] = useState("");
  const write = useVaultWrite();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const opening = parseMoney(formValue(form, "opening"));
    if (opening === null) {
      setProblem(t("common.invalidAmount"));
      return;
    }
    const result = accountSchema.safeParse({
      id: account?.id ?? crypto.randomUUID(),
      name: formValue(form, "name"),
      type: formValue(form, "type"),
      opening,
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
          accounts: putRecord(vault.accounts, result.data, !!account),
        }),
      })
    )
      close();
  }

  return (
    <Modal
      open
      title={t(account ? "accounts.edit" : "accounts.add")}
      description={t("accounts.formHint")}
      onOpenChange={(open) => !open && close()}
    >
      <form onSubmit={submit} className="grid gap-4">
        <Field label={t("common.name")}>
          <Input
            name="name"
            defaultValue={account ? format.name(account) : ""}
            placeholder={t("accounts.placeholder")}
            maxLength={80}
            required
          />
        </Field>
        <Field label={t("accounts.type")}>
          <Select name="type" defaultValue={account?.type ?? "checking"}>
            {accountTypes.map((type) => (
              <option key={type} value={type}>
                {t(`accounts.${type}`)}
              </option>
            ))}
          </Select>
        </Field>
        <AmountField
          label={t("accounts.opening")}
          amount={account?.opening ?? 0}
          name="opening"
        />
        {problem && (
          <p role="alert" className="text-sm text-danger">
            {problem}
          </p>
        )}
        <FormActions
          close={close}
          pending={write.pending}
          label={account ? undefined : t("accounts.add")}
        />
      </form>
    </Modal>
  );
}

export function AccountsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const vault = useVaultData();
  const format = useFormats(vault.preferences.currency);
  const [editor, setEditor] = useState<Account | "new" | null>(null);
  const [deleting, setDeleting] = useState<Account>();
  const balances = accountBalances(vault);
  const values = [...balances.values()];
  const positive = values.reduce((sum, value) => sum + Math.max(value, 0), 0);
  const negative = values.reduce((sum, value) => sum + Math.min(value, 0), 0);

  return (
    <div className="workspace-page">
      <PageHeader title={t("accounts.title")} description={t("accounts.description")}>
        <Button variant="primary" onClick={() => setEditor("new")}>
          <Plus size={17} aria-hidden="true" />
          {t("accounts.add")}
        </Button>
      </PageHeader>
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric
          label={t("accounts.net")}
          value={format.money(positive + negative)}
          icon={WalletCards}
          featured
        />
        <Metric
          label={t("accounts.assets")}
          value={format.money(positive)}
          icon={ArrowDownLeft}
        />
        <Metric
          label={t("accounts.liabilities")}
          value={format.money(negative)}
          icon={ArrowUpRight}
          tone="rose"
        />
      </div>
      {vault.accounts.length ? (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {vault.accounts.map((account) => {
            const name = format.name(account);
            const balance = balances.get(account.id) ?? 0;
            return (
              <Panel className="account-card" key={account.id}>
                <div
                  data-tone={accountVisual[account.type].tone}
                  className="account-card-art"
                  aria-hidden="true"
                />
                <div className="relative flex items-start justify-between gap-2">
                  <IconTile {...accountVisual[account.type]} />
                  <RecordActions
                    name={name}
                    edit={() => setEditor(account)}
                    remove={() => setDeleting(account)}
                  />
                </div>
                <div className="relative mt-4">
                  <p className="text-xs font-medium text-muted">
                    {t(`accounts.${account.type}`)}
                  </p>
                  <h2 className="display mt-1 break-words text-xl font-semibold">{name}</h2>
                  <p className="mt-6 text-xs text-muted">{t("accounts.current")}</p>
                  <p
                    className={
                      "display mt-1 break-all text-3xl font-semibold tabular-nums " +
                      (balance < 0 ? "text-danger" : "")
                    }
                  >
                    <bdi>{format.money(balance)}</bdi>
                  </p>
                </div>
                <div className="relative mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                  <span className="text-xs text-muted">
                    {t("accounts.opening")}{" "}
                    <bdi className="ms-1 font-semibold text-foreground">
                      {format.money(account.opening)}
                    </bdi>
                  </span>
                  <TextLink
                    href={
                      localizedPath(locale, "/dashboard/transactions") +
                      "?account=" +
                      encodeURIComponent(account.id)
                    }
                  >
                    {t("accounts.activity")}
                  </TextLink>
                </div>
              </Panel>
            );
          })}
        </div>
      ) : (
        <Panel>
          <EmptyState
            icon={WalletCards}
            title={t("accounts.empty")}
            description={t("accounts.emptyHint")}
          />
        </Panel>
      )}
      {editor && (
        <AccountEditor
          account={editor === "new" ? undefined : editor}
          close={() => setEditor(null)}
        />
      )}
      <DeleteDialog
        record={deleting && { id: deleting.id, name: format.name(deleting) }}
        close={() => setDeleting(undefined)}
        update={removeAccount}
      />
    </div>
  );
}
