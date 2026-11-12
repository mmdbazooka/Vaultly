"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Download, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button, ConfirmDialog, EmptyState, Panel } from "@/components/ui";
import { downloadText } from "@/lib/finance/export";
import { emptyVault, type Vault } from "@/lib/finance/model";
import { VaultError } from "@/lib/finance/operations";
import {
  getRawBackup,
  readVault,
  replaceVault,
  updateVault,
  VAULT_STORAGE_KEY,
  type VaultUpdate,
} from "@/lib/finance/storage";

const queryKey = ["vaultly", "workspace", 1] as const;
const VaultContext = createContext<Vault | null>(null);

export function useVaultData() {
  const vault = useContext(VaultContext);
  if (!vault) throw new Error("Workspace components require loaded Vaultly data.");
  return vault;
}

type Write =
  { update: VaultUpdate; success?: string } | { replacement: Vault; success?: string };

export function useVaultWrite() {
  const client = useQueryClient();
  const errors = useTranslations("errors");
  const common = useTranslations("common");
  const { mutateAsync, isPending } = useMutation({
    scope: { id: VAULT_STORAGE_KEY },
    mutationFn: (write: Write) =>
      "update" in write ? updateVault(write.update) : replaceVault(write.replacement),
    onSuccess: (vault, write) => {
      client.setQueryData(queryKey, vault);
      toast.success(write.success ?? common("saved"));
    },
    onError: (error) => {
      toast.error(errors(error instanceof VaultError ? error.code : "unavailable"));
    },
  });

  async function save(write: Write) {
    try {
      await mutateAsync(write);
      return true;
    } catch {
      return false;
    }
  }

  return { save, pending: isPending };
}

export function WorkspaceData({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const query = useQuery({ queryKey, queryFn: readVault });
  const [resetOpen, setResetOpen] = useState(false);
  const t = useTranslations();
  const write = useVaultWrite();

  useEffect(() => {
    function sync(event: StorageEvent) {
      if (event.key === VAULT_STORAGE_KEY || event.key === null) {
        void client.invalidateQueries({ queryKey });
      }
    }
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [client]);

  if (query.isError) {
    const corrupt = query.error instanceof VaultError && query.error.code === "corrupt";
    return (
      <Panel>
        <EmptyState
          icon={AlertCircle}
          title={t("settings.unreadable")}
          description={t(corrupt ? "errors.unreadable" : "errors.unavailable")}
        >
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => void query.refetch()}>{t("common.retry")}</Button>
            {corrupt && (
              <>
                <Button
                  onClick={() => {
                    try {
                      const raw = getRawBackup();
                      if (raw !== null)
                        downloadText("vaultly-recovery.json", raw, "application/json");
                    } catch {
                      toast.error(t("errors.unavailable"));
                    }
                  }}
                >
                  <Download size={16} aria-hidden="true" />
                  {t("settings.raw")}
                </Button>
                <Button variant="danger" onClick={() => setResetOpen(true)}>
                  {t("settings.reset")}
                </Button>
              </>
            )}
          </div>
        </EmptyState>
        <ConfirmDialog
          open={resetOpen}
          close={() => setResetOpen(false)}
          title={t("settings.resetTitle")}
          description={t("settings.resetDescription")}
          action={t("settings.reset")}
          pending={write.pending}
          destructive
          onConfirm={async () => {
            if (
              await write.save({ replacement: emptyVault(), success: t("settings.resetDone") })
            )
              setResetOpen(false);
          }}
        />
      </Panel>
    );
  }

  if (!query.data) {
    return (
      <div className="grid gap-5" role="status" aria-live="polite">
        <div className="flex items-center gap-2 text-sm text-muted">
          <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
          {t("common.loading")}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-31 rounded-2xl border border-line bg-surface motion-safe:animate-pulse"
            />
          ))}
        </div>
        <div
          className="h-56 rounded-2xl border border-line bg-surface motion-safe:animate-pulse"
          aria-hidden="true"
        />
      </div>
    );
  }

  return <VaultContext.Provider value={query.data}>{children}</VaultContext.Provider>;
}
