import { nextDueDate } from "./dates";
import type { Budget, Recurring, Transaction, Vault } from "./model";

export type VaultErrorCode =
  | "invalid"
  | "corrupt"
  | "unavailable"
  | "duplicateBudget"
  | "accountInUse"
  | "stale"
  | "sameAccount";

export class VaultError extends Error {
  constructor(readonly code: VaultErrorCode) {
    super(code);
    this.name = "VaultError";
  }
}

export function putRecord<T extends { id: string }>(records: T[], record: T, editing: boolean) {
  const exists = records.some((item) => item.id === record.id);
  if (exists !== editing) throw new VaultError("stale");
  return editing
    ? records.map((item) => (item.id === record.id ? record : item))
    : [record, ...records];
}

export function removeRecord<T extends { id: string }>(records: T[], id: string) {
  const result = records.filter((item) => item.id !== id);
  if (result.length === records.length) throw new VaultError("stale");
  return result;
}

export function removeAccount(vault: Vault, id: string): Vault {
  const linked =
    vault.transactions.some(
      (item) => item.accountId === id || (item.kind === "transfer" && item.toAccountId === id),
    ) || vault.recurring.some((item) => item.accountId === id);
  if (linked) throw new VaultError("accountInUse");
  return { ...vault, accounts: removeRecord(vault.accounts, id) };
}

export function putBudget(vault: Vault, budget: Budget, editing: boolean): Vault {
  if (
    vault.budgets.some(
      (item) =>
        item.id !== budget.id &&
        item.month === budget.month &&
        item.category === budget.category,
    )
  )
    throw new VaultError("duplicateBudget");
  return { ...vault, budgets: putRecord(vault.budgets, budget, editing) };
}

export function putTransaction(vault: Vault, entry: Transaction, editing: boolean): Vault {
  if (entry.kind === "transfer" && entry.accountId === entry.toAccountId) {
    throw new VaultError("sameAccount");
  }
  return { ...vault, transactions: putRecord(vault.transactions, entry, editing) };
}

export function recordPayment(
  vault: Vault,
  expected: Recurring,
  id: string,
  date: string,
): Vault {
  const item = vault.recurring.find((entry) => entry.id === expected.id);
  if (
    !item?.active ||
    item.nextDate !== expected.nextDate ||
    item.amount !== expected.amount ||
    item.accountId !== expected.accountId ||
    item.category !== expected.category ||
    item.name !== expected.name ||
    item.cadence !== expected.cadence ||
    item.anchorDay !== expected.anchorDay
  ) {
    throw new VaultError("stale");
  }
  const nextDate = nextDueDate(item);
  if (nextDate <= item.nextDate) throw new VaultError("invalid");

  const updated = putTransaction(
    vault,
    {
      id,
      kind: "expense",
      accountId: item.accountId,
      name: item.name,
      sample: item.sample,
      category: item.category,
      amount: item.amount,
      date,
      note: "",
    },
    false,
  );
  return {
    ...updated,
    recurring: putRecord(updated.recurring, { ...item, nextDate }, true),
  };
}
