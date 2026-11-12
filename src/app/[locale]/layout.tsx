import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { SiteDocument, siteMetadata } from "@/components/site-document";
import { isLocale, locales } from "@/lib/i18n";

type Props = { params: Promise<{ locale: string }>; children: ReactNode };

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Pick<Props, "params">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return siteMetadata(locale);
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <SiteDocument locale={locale}>{children}</SiteDocument>;
}
