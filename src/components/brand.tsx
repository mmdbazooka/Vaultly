"use client";

import { Globe2, Moon, Sun } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { localizedPath } from "@/lib/i18n";
import { Button, buttonClass } from "./ui";

export function Brand({ className }: { className?: string }) {
  const locale = useLocale();
  return (
    <Link
      href={localizedPath(locale)}
      className={"brand " + (className ?? "")}
      aria-label="Vaultly"
    >
      <span className="brand-mark" aria-hidden="true" />
      <span className="display" lang="en">
        Vaultly<span className="brand-period">.</span>
      </span>
    </Link>
  );
}

export function LocaleSwitch() {
  const locale = useLocale();
  const t = useTranslations("common");
  const pathname = usePathname();
  const next = locale === "en" ? "fa" : "en";
  return (
    <Link
      className={buttonClass("ghost", "locale-toggle")}
      href={localizedPath(next, pathname)}
      hrefLang={next}
      aria-label={t("languageSwitch")}
      prefetch={false}
    >
      <Globe2 size={17} aria-hidden="true" />
      <span lang={next}>{next === "fa" ? "فارسی" : "EN"}</span>
    </Link>
  );
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations("common");
  return (
    <Button
      variant="ghost"
      className="ui-icon-button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label={t("switchTheme")}
      title={t("switchTheme")}
    >
      <Moon size={17} className="dark:hidden" aria-hidden="true" />
      <Sun size={17} className="hidden dark:block" aria-hidden="true" />
    </Button>
  );
}
