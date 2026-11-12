import { currentMonth, dateFromKey, localDate, shiftDays, shiftMonth } from "./dates";
import { emptyVault, type Budget, type Transaction, type Vault } from "./model";

export function demoVault(clock = new Date()): Vault {
  const month = currentMonth(clock);
  const today = localDate(clock);
  const transactions: Transaction[] = [];
  const plans: Budget[] = [];

  for (let offset = -5; offset <= 0; offset++) {
    const period = shiftMonth(month, offset);
    const date = (day: number) =>
      period +
      "-" +
      String(offset === 0 ? Math.min(day, clock.getDate()) : day).padStart(2, "0");
    const variant = offset + 5;
    const entry = (id: string, day: number) => ({
      id: period + "-" + id,
      date: date(day),
      note: "",
      accountId: "checking",
    });

    transactions.push(
      {
        ...entry("salary", 1),
        name: "Monthly payroll",
        sample: "payroll",
        kind: "income",
        category: "salary",
        amount: 395_000 + variant * 14_000,
      },
      {
        ...entry("studio", 8),
        name: "Studio North",
        sample: "studio",
        kind: "income",
        category: "freelance",
        amount: [59_000, 34_000, 83_000, 45_000, 82_000, 92_500][variant],
      },
      {
        ...entry("rent", 2),
        name: "Apartment rent",
        sample: "apartment",
        kind: "expense",
        category: "housing",
        amount: 139_500,
      },
      {
        ...entry("groceries", 5),
        name: "Whole Foods Market",
        sample: "groceries",
        kind: "expense",
        category: "groceries",
        amount: 14_660 + variant * 505,
      },
      {
        ...entry("metro", 6),
        name: "Metro pass",
        sample: "metro",
        kind: "expense",
        category: "transport",
        amount: 8_500,
      },
      {
        ...entry("coffee", 9),
        name: "Corner Coffee",
        sample: "coffee",
        kind: "expense",
        category: "dining",
        amount: 1_250 + variant * 73,
      },
      {
        ...entry("bookshop", 10),
        name: "Local bookshop",
        sample: "bookshop",
        kind: "expense",
        category: "shopping",
        amount: [31_500, 44_000, 23_500, 58_600, 39_000, 12_800][variant],
        accountId: "credit",
      },
      {
        ...entry("internet", 11),
        name: "Home internet",
        sample: "internet",
        kind: "expense",
        category: "utilities",
        amount: 6_900,
      },
      {
        ...entry("dinner", 15),
        name: "Dinner with friends",
        sample: "dinner",
        kind: "expense",
        category: "dining",
        amount: 10_500 + variant * 250,
      },
      {
        ...entry("pharmacy", 19),
        name: "Neighborhood pharmacy",
        sample: "pharmacy",
        kind: "expense",
        category: "health",
        amount: [8_150, 11_700, 32_900, 21_600, 11_270, 8_850][variant],
      },
      {
        ...entry("streaming", 21),
        name: "Streaming plan",
        sample: "streaming",
        kind: "expense",
        category: "entertainment",
        amount: 1_599,
        accountId: "credit",
      },
      {
        ...entry("transfer", 4),
        name: "Savings sweep",
        sample: "sweep",
        kind: "transfer",
        toAccountId: "savings",
        amount: 56_000,
      },
    );

    if (offset >= -2) {
      plans.push(
        { id: period + "-groceries", month: period, category: "groceries", limit: 34_000 },
        { id: period + "-dining", month: period, category: "dining", limit: 25_000 },
        { id: period + "-shopping", month: period, category: "shopping", limit: 28_000 },
        { id: period + "-transport", month: period, category: "transport", limit: 15_000 },
      );
    }
  }

  const target = (months: number) => localDate(dateFromKey(shiftMonth(month, months)));
  return {
    ...emptyVault(),
    demo: true,
    accounts: [
      {
        id: "checking",
        name: "Everyday Checking",
        sample: "everyday",
        type: "checking",
        opening: 240_000,
      },
      {
        id: "savings",
        name: "High-Yield Savings",
        sample: "reserve",
        type: "savings",
        opening: 520_000,
      },
      { id: "credit", name: "Credit Card", sample: "credit", type: "credit", opening: -23_800 },
    ],
    transactions: transactions.reverse(),
    budgets: plans,
    goals: [
      {
        id: "emergency",
        name: "Emergency fund",
        sample: "emergency",
        style: "safety",
        target: 1_000_000,
        saved: 680_000,
        deadline: target(8),
      },
      {
        id: "japan",
        name: "Trip to Japan",
        sample: "japan",
        style: "travel",
        target: 350_000,
        saved: 142_000,
        deadline: target(6),
      },
      {
        id: "laptop",
        name: "New laptop",
        sample: "laptop",
        style: "tech",
        target: 210_000,
        saved: 126_000,
        deadline: null,
      },
    ],
    recurring: [
      {
        id: "internet",
        name: "Home internet",
        sample: "internet",
        accountId: "checking",
        category: "utilities",
        amount: 6_900,
        nextDate: shiftDays(today, 2),
        anchorDay: Number(shiftDays(today, 2).slice(8)),
        cadence: "monthly",
        active: true,
      },
      {
        id: "streaming",
        name: "Streaming plan",
        sample: "streaming",
        accountId: "credit",
        category: "entertainment",
        amount: 1_599,
        nextDate: shiftDays(today, 5),
        anchorDay: Number(shiftDays(today, 5).slice(8)),
        cadence: "monthly",
        active: true,
      },
      {
        id: "rent",
        name: "Apartment rent",
        sample: "apartment",
        accountId: "checking",
        category: "housing",
        amount: 139_500,
        nextDate: target(1),
        anchorDay: 1,
        cadence: "monthly",
        active: true,
      },
    ],
  };
}
