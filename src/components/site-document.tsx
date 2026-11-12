import "@fontsource-variable/geist";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/vazirmatn";
import "@/app/globals.css";

import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { messages, type Locale } from "@/lib/i18n";
import { Providers } from "./providers";

export function siteMetadata(locale: Locale): Metadata {
  const { title, description } = messages[locale].meta;
  return {
    title: { default: title, template: "%s | Vaultly" },
    description,
    icons: { icon: "/vaultly-icon.png" },
    openGraph: {
      title,
      description,
      siteName: "Vaultly",
      type: "website",
      locale: locale === "fa" ? "fa_IR" : "en_US",
    },
  };
}

export function SiteDocument({ locale, children }: { locale: Locale; children: ReactNode }) {
  setRequestLocale(locale);
  const copy = messages[locale];
  return (
    <html lang={locale} dir={locale === "fa" ? "rtl" : "ltr"} suppressHydrationWarning>
      <body>
        <a className="skip-link" href="#main-content">
          {copy.common.skip}
        </a>
        <NextIntlClientProvider locale={locale} messages={copy} timeZone="UTC">
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
