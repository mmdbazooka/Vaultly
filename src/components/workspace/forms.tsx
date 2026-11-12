"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { ConfirmDialog, Field, IconButton, Input } from "@/components/ui";
import { moneyInput } from "@/lib/finance/money";
import type { Vault } from "@/lib/finance/model";
import { useVaultWrite } from "./workspace-data";

export function formValue(form: FormData, field: string) {
  return String(form.get(field) ?? "").trim();
}

export function AmountField({
  label,
  name = "amount",
  amount,
  hint,
}: {
  label: string;
  name?: string;
  amount?: number;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <Input
        dir="ltr"
        inputMode="decimal"
        name={name}
        defaultValue={amount === undefined ? "" : moneyInput(amount)}
        placeholder="0.00"
        required
      />
    </Field>
  );
}

export function RecordActions({
  edit,
  remove,
  name,
}: {
  edit: () => void;
  remove: () => void;
  name: string;
}) {
  const t = useTranslations("common");
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <IconButton icon={Pencil} label={t("edit") + " — " + name} onClick={edit} />
      <IconButton
        icon={Trash2}
        label={t("remove") + " — " + name}
        className="hover:!text-danger"
        onClick={remove}
      />
    </div>
  );
}

export function DeleteDialog({
  record,
  close,
  update,
}: {
  record: { id: string; name: string } | undefined;
  close: () => void;
  update: (vault: Vault, id: string) => Vault;
}) {
  const t = useTranslations("common");
  const write = useVaultWrite();
  if (!record) return null;
  return (
    <ConfirmDialog
      open
      title={t("deleteTitle", { name: record.name })}
      description={t("deleteDescription")}
      action={t("remove")}
      close={close}
      pending={write.pending}
      destructive
      onConfirm={async () => {
        if (
          await write.save({
            update: (vault) => update(vault, record.id),
            success: t("removed"),
          })
        )
          close();
      }}
    />
  );
}
