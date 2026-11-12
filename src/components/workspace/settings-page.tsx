"use client";

import {
  Database,
  Download,
  FlaskConical,
  Monitor,
  Moon,
  Sun,
  Trash2,
  Upload,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import {
  Button,
  ConfirmDialog,
  Field,
  IconTile,
  PageHeader,
  Panel,
  PanelHeader,
  Select,
} from "@/components/ui";
import { currencies } from "@/lib/finance/catalog";
import { localDate } from "@/lib/finance/dates";
import { demoVault } from "@/lib/finance/demo";
import { downloadText } from "@/lib/finance/export";
import { emptyVault, preferencesSchema, type Vault } from "@/lib/finance/model";
import { decodeVault } from "@/lib/finance/storage";
import { isLocale, localizedPath } from "@/lib/i18n";
import { useVaultData, useVaultWrite } from "./workspace-data";

const modes = [
  { value: "dark", icon: Moon },
  { value: "light", icon: Sun },
  { value: "system", icon: Monitor },
] as const;

type Pending = { type: "import"; vault: Vault } | { type: "reset" | "demo" };

export function SettingsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const vault = useVaultData();
  const write = useVaultWrite();
  const input = useRef<HTMLInputElement>(null);
  const [confirm, setConfirm] = useState<Pending>();

  async function openBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    try {
      setConfirm({ type: "import", vault: decodeVault(await file.text()) });
    } catch {
      toast.error(t("errors.corrupt"));
    }
  }

  function saveBackup() {
    downloadText(
      "vaultly-backup-" + localDate() + ".json",
      JSON.stringify(vault, null, 2),
      "application/json",
    );
    toast.success(t("settings.exported"));
  }

  async function selectCurrency(currency: string) {
    const result = preferencesSchema.safeParse({ currency });
    if (!result.success) return;
    await write.save({ update: (current) => ({ ...current, preferences: result.data }) });
  }

  const actions = {
    import: {
      title: t("settings.importTitle"),
      description: t("settings.importDescription"),
      label: t("settings.import"),
      success: t("settings.imported"),
    },
    reset: {
      title: t("settings.resetTitle"),
      description: t("settings.resetDescription"),
      label: t("settings.reset"),
      success: t("settings.resetDone"),
    },
    demo: {
      title: t("settings.demoTitle"),
      description: t("settings.demoDescription"),
      label: t("settings.loadDemo"),
      success: t("settings.demoDone"),
    },
  };
  const currentAction = confirm && actions[confirm.type];

  return (
    <div className="workspace-page max-w-5xl">
      <PageHeader title={t("settings.title")} description={t("settings.description")} />
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title={t("settings.appearance")}
            description={t("settings.appearanceDescription")}
          />
          <div className="grid gap-5">
            <div>
              <p className="mb-1.5 text-sm font-medium">{t("common.theme")}</p>
              <div
                className="segmented grid grid-cols-3"
                role="group"
                aria-label={t("common.theme")}
              >
                {modes.map(({ value, icon: Icon }) => (
                  <button
                    type="button"
                    aria-pressed={theme === value}
                    key={value}
                    onClick={() => setTheme(value)}
                  >
                    <Icon size={16} aria-hidden="true" />
                    {t(`common.${value}`)}
                  </button>
                ))}
              </div>
            </div>
            <Field label={t("common.locale")}>
              <Select
                value={locale}
                onChange={(event) => {
                  const value = event.target.value;
                  if (isLocale(value)) window.location.assign(localizedPath(value, pathname));
                }}
              >
                <option lang="en" value="en">
                  English
                </option>
                <option lang="fa" value="fa">
                  فارسی
                </option>
              </Select>
            </Field>
          </div>
        </Panel>
        <Panel>
          <PanelHeader
            title={t("settings.finance")}
            description={t("settings.currencyDescription")}
          />
          <Field label={t("settings.currency")}>
            <Select
              value={vault.preferences.currency}
              disabled={write.pending}
              onChange={(event) => void selectCurrency(event.target.value)}
            >
              {currencies.map((currency) => (
                <option value={currency} key={currency}>
                  {t(`settings.${currency}`)}
                </option>
              ))}
            </Select>
          </Field>
        </Panel>
      </div>
      <Panel>
        <PanelHeader
          title={t("settings.data")}
          description={t("settings.dataDescription")}
          action={<IconTile icon={Database} />}
        />
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" onClick={saveBackup}>
              <Download size={17} aria-hidden="true" />
              {t("settings.export")}
            </Button>
            <Button onClick={() => input.current?.click()}>
              <Upload size={17} aria-hidden="true" />
              {t("settings.import")}
            </Button>
            <input
              ref={input}
              type="file"
              accept=".json,application/json"
              hidden
              aria-label={t("settings.import")}
              onChange={(event) => void openBackup(event)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <Button onClick={() => setConfirm({ type: "demo" })}>
              <FlaskConical size={17} aria-hidden="true" />
              {t("settings.loadDemo")}
            </Button>
            <Button
              variant="ghost"
              className="!text-danger"
              onClick={() => setConfirm({ type: "reset" })}
            >
              <Trash2 size={17} aria-hidden="true" />
              {t("settings.reset")}
            </Button>
          </div>
        </div>
      </Panel>
      {confirm && currentAction && (
        <ConfirmDialog
          open
          close={() => setConfirm(undefined)}
          title={currentAction.title}
          description={currentAction.description}
          action={currentAction.label}
          pending={write.pending}
          destructive={confirm.type === "reset"}
          onConfirm={async () => {
            const replacement =
              confirm.type === "import"
                ? confirm.vault
                : confirm.type === "demo"
                  ? demoVault()
                  : emptyVault(vault.preferences.currency);
            if (await write.save({ replacement, success: currentAction.success }))
              setConfirm(undefined);
          }}
        />
      )}
    </div>
  );
}
