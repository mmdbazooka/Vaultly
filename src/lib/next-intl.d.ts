import type { Locale, messages } from "@/lib/i18n";

declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: (typeof messages)["en"];
  }
}
