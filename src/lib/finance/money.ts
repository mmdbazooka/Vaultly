import type { Currency } from "./model";

const persian = "۰۱۲۳۴۵۶۷۸۹";
const arabic = "٠١٢٣٤٥٦٧٨٩";

export function parseMoney(value: string): number | null {
  const normalized = value
    .trim()
    .replace(/[۰-۹]/g, (digit) => String(persian.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)))
    .replaceAll("٫", ".")
    .replaceAll("٬", ",")
    .replace("−", "-");
  if (!/^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(normalized)) return null;

  const [whole, fraction = ""] = normalized.replaceAll(",", "").split(".");
  const minor = Math.abs(Number(whole)) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(minor) || minor > 100_000_000_000_000) return null;
  return normalized.startsWith("-") ? -minor : minor;
}

export function moneyInput(minor: number): string {
  return (minor / 100).toFixed(2);
}

export function formatMoney(
  minor: number,
  currency: Currency,
  locale: string,
  digits = 2,
): string {
  const format = {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  };

  if (currency === "IRT") {
    return (
      new Intl.NumberFormat(locale, format).format(minor / 100) +
      " " +
      (locale === "fa" ? "تومان" : "toman")
    );
  }

  return new Intl.NumberFormat(locale, { ...format, style: "currency", currency }).format(
    minor / 100,
  );
}
