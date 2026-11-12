import type { Metadata } from "next";
import { isLocale, messages } from "./i18n";

type WorkspaceRoute = keyof (typeof messages)["en"]["nav"];

export function workspaceMetadata(route: WorkspaceRoute) {
  return async ({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> => {
    const { locale } = await params;
    const copy = messages[isLocale(locale) ? locale : "en"];
    return { title: copy.nav[route] };
  };
}
