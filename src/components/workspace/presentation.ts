"use client";

import {
  ArrowDownLeft,
  ArrowLeftRight,
  BriefcaseBusiness,
  Bus,
  CircleDollarSign,
  CreditCard,
  Dumbbell,
  Gift,
  GraduationCap,
  House,
  Laptop,
  Landmark,
  PiggyBank,
  Plane,
  Plug,
  Popcorn,
  Shield,
  ShoppingBag,
  ShoppingBasket,
  Target,
  Utensils,
  Wallet,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Tone } from "@/components/ui";
import { dateFromKey } from "@/lib/finance/dates";
import type {
  Account,
  Category,
  Currency,
  Goal,
  NamedRecord,
  Transaction,
} from "@/lib/finance/model";
import { formatMoney } from "@/lib/finance/money";

export const categoryVisual = {
  housing: { icon: House, tone: "green" },
  groceries: { icon: ShoppingBasket, tone: "amber" },
  dining: { icon: Utensils, tone: "rose" },
  transport: { icon: Bus, tone: "blue" },
  shopping: { icon: ShoppingBag, tone: "violet" },
  health: { icon: Dumbbell, tone: "rose" },
  utilities: { icon: Plug, tone: "blue" },
  entertainment: { icon: Popcorn, tone: "violet" },
  education: { icon: GraduationCap, tone: "blue" },
  travel: { icon: Plane, tone: "amber" },
  other: { icon: CircleDollarSign, tone: "neutral" },
  salary: { icon: BriefcaseBusiness, tone: "green" },
  freelance: { icon: Laptop, tone: "green" },
  investment: { icon: ArrowDownLeft, tone: "green" },
  gift: { icon: Gift, tone: "violet" },
  otherIncome: { icon: CircleDollarSign, tone: "green" },
} as const satisfies Record<Category, { icon: typeof House; tone: Tone }>;

export const accountVisual = {
  checking: { icon: Landmark, tone: "green" },
  savings: { icon: PiggyBank, tone: "blue" },
  credit: { icon: CreditCard, tone: "violet" },
  cash: { icon: Wallet, tone: "amber" },
} as const satisfies Record<Account["type"], { icon: typeof House; tone: Tone }>;

export const goalVisual = {
  safety: { icon: Shield, tone: "green" },
  travel: { icon: Plane, tone: "blue" },
  home: { icon: House, tone: "amber" },
  tech: { icon: Laptop, tone: "violet" },
  other: { icon: Target, tone: "neutral" },
} as const satisfies Record<Goal["style"], { icon: typeof House; tone: Tone }>;

export function transactionVisual(transaction: Transaction) {
  return transaction.kind === "transfer"
    ? { icon: ArrowLeftRight, tone: "neutral" as const }
    : categoryVisual[transaction.category];
}

export function useFormats(currency: Currency) {
  const locale = useLocale();
  const samples = useTranslations("samples");

  return {
    money: (amount: number, digits = 2) => formatMoney(amount, currency, locale, digits),
    percent: (fraction: number) =>
      new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(
        fraction,
      ),
    count: (count: number) => new Intl.NumberFormat(locale).format(count),
    date: (
      date: string,
      options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" },
    ) =>
      new Intl.DateTimeFormat(locale, { ...options, calendar: "gregory" }).format(
        dateFromKey(date),
      ),
    name: ({ sample, name }: NamedRecord) => (sample ? samples(sample) : name),
  };
}
