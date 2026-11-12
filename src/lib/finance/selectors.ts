import { currentMonth, localDate, shiftMonth } from "./dates";
import type { Budget, ExpenseCategory, Recurring, Transaction, Vault } from "./model";

export function newestFirst(transactions: Transaction[]) {
  return transactions.toSorted((first, second) => second.date.localeCompare(first.date));
}

export function monthlyActivity(transactions: Transaction[], month: string) {
  return transactions.filter((transaction) => transaction.date.startsWith(month + "-"));
}

export function cashFlow(transactions: Transaction[]) {
  let income = 0;
  let expenses = 0;
  for (const transaction of transactions) {
    if (transaction.kind === "income") income += transaction.amount;
    if (transaction.kind === "expense") expenses += transaction.amount;
  }
  return {
    income,
    expenses,
    net: income - expenses,
    rate: income > 0 ? (income - expenses) / income : null,
  };
}

export function cashFlowHistory(transactions: Transaction[], end = currentMonth(), length = 6) {
  return Array.from({ length }, (_, index) => {
    const month = shiftMonth(end, index - length + 1);
    return { month, ...cashFlow(monthlyActivity(transactions, month)) };
  });
}

export function spendingByCategory(transactions: Transaction[]) {
  const amounts = new Map<ExpenseCategory, number>();
  for (const transaction of transactions) {
    if (transaction.kind === "expense") {
      amounts.set(
        transaction.category,
        (amounts.get(transaction.category) ?? 0) + transaction.amount,
      );
    }
  }
  return [...amounts]
    .map(([category, amount]) => ({ category, amount }))
    .sort((first, second) => second.amount - first.amount);
}

export function accountBalances(vault: Vault, through = localDate()) {
  const balances = new Map(vault.accounts.map((account) => [account.id, account.opening]));
  for (const entry of vault.transactions) {
    if (entry.date > through) continue;
    const balance = balances.get(entry.accountId) ?? 0;
    balances.set(
      entry.accountId,
      balance + (entry.kind === "income" ? entry.amount : -entry.amount),
    );
    if (entry.kind === "transfer") {
      balances.set(entry.toAccountId, (balances.get(entry.toAccountId) ?? 0) + entry.amount);
    }
  }
  return balances;
}

export function plannedBudget(budgets: Budget[], transactions: Transaction[], month: string) {
  const totals = new Map(
    spendingByCategory(monthlyActivity(transactions, month)).map(({ category, amount }) => [
      category,
      amount,
    ]),
  );
  return budgets
    .filter((budget) => budget.month === month)
    .map((budget) => ({
      ...budget,
      spent: totals.get(budget.category) ?? 0,
    }));
}

export function dueFirst(items: Recurring[]) {
  return items.toSorted(
    (first, second) =>
      Number(second.active) - Number(first.active) ||
      first.nextDate.localeCompare(second.nextDate),
  );
}

export function monthlyRecurring(items: Recurring[]) {
  const multipliers = { weekly: 52 / 12, monthly: 1, yearly: 1 / 12 };
  return Math.round(
    items.reduce(
      (total, item) => total + (item.active ? item.amount * multipliers[item.cadence] : 0),
      0,
    ),
  );
}
