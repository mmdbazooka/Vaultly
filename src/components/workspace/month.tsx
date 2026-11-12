"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { createContext, useContext, useState, type ReactNode } from "react";
import { IconButton } from "@/components/ui";
import { currentMonth, dateFromKey, shiftMonth } from "@/lib/finance/dates";

const monthKey = "vaultly.month";
const MonthContext = createContext<{ month: string; setMonth: (month: string) => void } | null>(
  null,
);

export function MonthProvider({ children }: { children: ReactNode }) {
  const [month, updateMonth] = useState(() => {
    try {
      const stored = localStorage.getItem(monthKey);
      if (stored && /^\d{4}-(0[1-9]|1[0-2])$/.test(stored)) return stored;
    } catch {
      // Month navigation still works in memory when preferences are unavailable.
    }
    return currentMonth();
  });

  function setMonth(value: string) {
    updateMonth(value);
    try {
      localStorage.setItem(monthKey, value);
    } catch {
      // The month is still updated for the current session.
    }
  }

  return <MonthContext.Provider value={{ month, setMonth }}>{children}</MonthContext.Provider>;
}

export function useMonth() {
  const state = useContext(MonthContext);
  if (!state) throw new Error("Month navigation requires MonthProvider.");
  return state;
}

export function MonthControl() {
  const { month, setMonth } = useMonth();
  const locale = useLocale();
  const t = useTranslations("common");
  const formatted = new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "numeric",
    calendar: "gregory",
  }).format(dateFromKey(month));

  return (
    <div className="month-control" role="group" aria-label={t("month")}>
      <IconButton
        label={t("previousMonth")}
        icon={locale === "fa" ? ChevronRight : ChevronLeft}
        onClick={() => setMonth(shiftMonth(month, -1))}
      />
      <button
        type="button"
        className="month-label flex items-center justify-center gap-1.5"
        title={t("thisMonth")}
        onClick={() => setMonth(currentMonth())}
      >
        <CalendarDays size={15} aria-hidden="true" />
        <span>{formatted}</span>
      </button>
      <IconButton
        label={t("nextMonth")}
        icon={locale === "fa" ? ChevronLeft : ChevronRight}
        onClick={() => setMonth(shiftMonth(month, 1))}
      />
    </div>
  );
}
