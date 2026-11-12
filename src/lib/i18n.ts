import en from "@/messages/en.json";
import fa from "@/messages/fa.json";

export const locales = ["en", "fa"] as const;
export type Locale = (typeof locales)[number];
export const messages: Record<Locale, typeof en> = { en, fa };

export function isLocale(value: string): value is Locale {
  return locales.some((locale) => locale === value);
}

export function localizedPath(locale: Locale, pathname = "/") {
  const path = pathname.replace(/^\/(en|fa)(?=\/|$)/, "").replace(/\/$/, "");
  return "/" + locale + path + "/";
}
