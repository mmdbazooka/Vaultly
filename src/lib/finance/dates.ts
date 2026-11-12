import type { Recurring } from "./model";

export function localDate(date = new Date()): string {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return [year, month, day].join("-");
}

export function currentMonth(date = new Date()): string {
  return localDate(date).slice(0, 7);
}

export function dateFromKey(key: string): Date {
  return new Date((key.length === 7 ? key + "-01" : key) + "T12:00:00");
}

export function shiftMonth(key: string, by: number): string {
  const date = dateFromKey(key);
  date.setMonth(date.getMonth() + by, 1);
  if (date.getFullYear() < 1 || date.getFullYear() > 9999) return key;
  return currentMonth(date);
}

export function shiftDays(key: string, by: number): string {
  const date = dateFromKey(key);
  date.setDate(date.getDate() + by);
  return localDate(date);
}

export function daysBetween(from: string, to: string): number {
  const time = (value: string) => Date.parse(value + "T12:00:00Z");
  return Math.round((time(to) - time(from)) / 86_400_000);
}

export function nextDueDate(
  item: Pick<Recurring, "nextDate" | "cadence" | "anchorDay">,
): string {
  if (item.cadence === "weekly") return shiftDays(item.nextDate, 7);

  const nextMonth = shiftMonth(item.nextDate.slice(0, 7), item.cadence === "monthly" ? 1 : 12);
  const lastDay = dateFromKey(nextMonth);
  lastDay.setMonth(lastDay.getMonth() + 1, 0);
  const day = Math.min(lastDay.getDate(), item.anchorDay);
  return nextMonth + "-" + String(day).padStart(2, "0");
}
