import assert from "node:assert/strict";
import test from "node:test";
import { nextDueDate } from "../src/lib/finance/dates";
import { demoVault } from "../src/lib/finance/demo";
import { transactionsCsv } from "../src/lib/finance/export";
import { emptyVault, vaultSchema } from "../src/lib/finance/model";
import { parseMoney } from "../src/lib/finance/money";
import {
  putBudget,
  recordPayment,
  removeAccount,
  VaultError,
} from "../src/lib/finance/operations";
import { accountBalances, cashFlow, plannedBudget } from "../src/lib/finance/selectors";
import { decodeVault } from "../src/lib/finance/storage";

const fixture = () => demoVault(new Date(2026, 10, 12, 12));

test("stores money in minor units and accepts Persian decimal notation", () => {
  assert.equal(parseMoney("۱۲٬۳۴۵٫۶۷"), 1_234_567);
  assert.equal(parseMoney("−0.01"), -1);
  assert.equal(parseMoney("0.29"), 29);
  assert.equal(parseMoney("1,2.50"), null);
  assert.equal(parseMoney("0.009"), null);
});

test("transfers move balance without counting as income or spending", () => {
  const vault = fixture();
  const transfer = vault.transactions.find((entry) => entry.kind === "transfer")!;
  const baseline = accountBalances({ ...vault, transactions: [] }, "2026-12-01");
  const after = accountBalances({ ...vault, transactions: [transfer] }, "2026-12-01");
  assert.equal(
    after.get(transfer.accountId),
    baseline.get(transfer.accountId)! - transfer.amount,
  );
  assert.equal(
    after.get(transfer.toAccountId),
    baseline.get(transfer.toAccountId)! + transfer.amount,
  );
  assert.deepEqual(cashFlow([transfer]), { income: 0, expenses: 0, net: 0, rate: null });
});

test("budgets count matching expenses only within the requested month", () => {
  const vault = fixture();
  const plans = plannedBudget(vault.budgets, vault.transactions, "2026-11");
  assert.equal(plans.find((budget) => budget.category === "groceries")?.spent, 17_185);
  assert.throws(() => putBudget(vault, { ...plans[0], id: "duplicate" }, false), {
    message: "duplicateBudget",
  });
});

test("a payment records one expense and advances its schedule atomically", () => {
  const vault = fixture();
  const item = { ...vault.recurring[0], nextDate: "2028-01-31", anchorDay: 31 };
  vault.recurring[0] = item;
  const after = recordPayment(vault, item, "test-payment", "2028-01-31");
  assert.equal(after.transactions.length, vault.transactions.length + 1);
  assert.equal(after.transactions[0].amount, item.amount);
  assert.equal(after.recurring[0].nextDate, "2028-02-29");
  assert.equal(nextDueDate(after.recurring[0]), "2028-03-31");
  assert.throws(() => recordPayment(after, item, "repeat", "2028-01-31"), { message: "stale" });
  const edited = { ...vault, recurring: [{ ...item, amount: item.amount + 100 }] };
  assert.throws(() => recordPayment(edited, item, "old-amount", "2028-01-31"), {
    message: "stale",
  });
});

test("a backup must preserve IDs, account references, and its version", () => {
  const vault = fixture();
  assert.equal(
    decodeVault(JSON.stringify(vault)).transactions.length,
    vault.transactions.length,
  );
  assert.throws(() => decodeVault('{"version":2}'), VaultError);
  assert.throws(() => decodeVault("{"), VaultError);
  assert.equal(vaultSchema.safeParse({ ...vault, accounts: [] }).success, false);
  assert.throws(() => removeAccount(vault, "checking"), { message: "accountInUse" });
  assert.equal(vaultSchema.safeParse(emptyVault("IRT")).success, true);
});

test("CSV export keeps user-supplied text from becoming formulas", () => {
  const vault = fixture();
  const result = transactionsCsv([vault.transactions[0]], () => ({
    name: " =1+1",
    account: 'Bank, "Everyday"',
    destination: "",
  }));
  assert.ok(result.includes('"\' =1+1"'));
  assert.ok(result.includes('"Bank, ""Everyday"""'));
});
