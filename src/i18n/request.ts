import { getRequestConfig } from "next-intl/server";
import { isLocale, messages } from "@/lib/i18n";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = requested && isLocale(requested) ? requested : "en";
  return { locale, messages: messages[locale], timeZone: "UTC" };
});
