import { z } from "zod";
import {
  accountTypes,
  cadences,
  currencies,
  demoLabels,
  expenseCategories,
  goalStyles,
  incomeCategories,
} from "./catalog";

const id = z.string().min(1).max(100);
const label = z.string().trim().min(1).max(80);
const minor = z.int().min(-100_000_000_000_000).max(100_000_000_000_000);
const positive = minor.positive();
const isoDate = z.iso.date();
const monthKey = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
const sample = z.enum(demoLabels).optional();
const expenseCategory = z.enum(expenseCategories);
const named = { id, name: label, sample };

export const accountSchema = z.object({
  ...named,
  type: z.enum(accountTypes),
  opening: minor,
});

const entry = {
  ...named,
  accountId: id,
  amount: positive,
  date: isoDate,
  note: z.string().trim().max(240),
};

export const transactionSchema = z.discriminatedUnion("kind", [
  z.object({ ...entry, kind: z.literal("expense"), category: expenseCategory }),
  z.object({ ...entry, kind: z.literal("income"), category: z.enum(incomeCategories) }),
  z.object({ ...entry, kind: z.literal("transfer"), toAccountId: id }),
]);

export const budgetSchema = z.object({
  id,
  category: expenseCategory,
  month: monthKey,
  limit: positive,
});

export const goalSchema = z.object({
  ...named,
  style: z.enum(goalStyles),
  target: positive,
  saved: minor.nonnegative(),
  deadline: isoDate.nullable(),
});

export const recurringSchema = z.object({
  ...named,
  accountId: id,
  category: expenseCategory,
  amount: positive,
  cadence: z.enum(cadences),
  nextDate: isoDate,
  anchorDay: z.int().min(1).max(31),
  active: z.boolean(),
});

export const preferencesSchema = z.object({
  currency: z.enum(currencies),
});

export const vaultSchema = z
  .object({
    version: z.literal(1),
    demo: z.boolean(),
    preferences: preferencesSchema,
    accounts: z.array(accountSchema),
    transactions: z.array(transactionSchema),
    budgets: z.array(budgetSchema),
    goals: z.array(goalSchema),
    recurring: z.array(recurringSchema),
  })
  .superRefine((vault, ctx) => {
    const collections = ["accounts", "transactions", "budgets", "goals", "recurring"] as const;
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });

    for (const key of collections) {
      if (new Set(vault[key].map((item) => item.id)).size !== vault[key].length) {
        issue([key], "Record IDs must be unique within a collection.");
      }
    }

    const accountIds = new Set(vault.accounts.map((account) => account.id));
    for (const [index, transaction] of vault.transactions.entries()) {
      if (!accountIds.has(transaction.accountId))
        issue(["transactions", index], "Unknown account.");
      if (
        transaction.kind === "transfer" &&
        (transaction.accountId === transaction.toAccountId ||
          !accountIds.has(transaction.toAccountId))
      ) {
        issue(["transactions", index], "A transfer requires two different accounts.");
      }
    }
    for (const [index, item] of vault.recurring.entries()) {
      if (!accountIds.has(item.accountId)) issue(["recurring", index], "Unknown account.");
    }

    if (
      new Set(vault.budgets.map(({ month, category }) => month + ":" + category)).size !==
      vault.budgets.length
    ) {
      issue(["budgets"], "Only one budget per category and month is allowed.");
    }
  });

export type Account = z.infer<typeof accountSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type Budget = z.infer<typeof budgetSchema>;
export type Goal = z.infer<typeof goalSchema>;
export type Recurring = z.infer<typeof recurringSchema>;
export type Vault = z.infer<typeof vaultSchema>;
export type Currency = Vault["preferences"]["currency"];
export type ExpenseCategory = Budget["category"];
export type Category = Exclude<Transaction, { kind: "transfer" }>["category"];
export type NamedRecord = Pick<Account, "name" | "sample">;

export function emptyVault(currency: Currency = "USD"): Vault {
  return {
    version: 1,
    demo: false,
    preferences: { currency },
    accounts: [],
    transactions: [],
    budgets: [],
    goals: [],
    recurring: [],
  };
}
