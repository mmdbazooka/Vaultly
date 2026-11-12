import type { ReactNode } from "react";
import { SiteDocument, siteMetadata } from "@/components/site-document";

export const metadata = siteMetadata("en");

export default function DefaultLayout({ children }: { children: ReactNode }) {
  return <SiteDocument locale="en">{children}</SiteDocument>;
}
