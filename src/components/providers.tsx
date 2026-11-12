"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { ThemeProvider, useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { localizedPath } from "@/lib/i18n";

const LOCALE_STORAGE_KEY = "vaultly.locale";

function LocaleMemory() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    try {
      if (pathname === "/" && localStorage.getItem(LOCALE_STORAGE_KEY) === "fa") {
        router.replace(localizedPath("fa"));
        return;
      }
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // Locale remains available through the URL if storage is unavailable.
    }
  }, [locale, pathname, router]);

  return null;
}

function Notifications() {
  const locale = useLocale();
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      theme={resolvedTheme === "light" ? "light" : "dark"}
      dir={locale === "fa" ? "rtl" : "ltr"}
      position="bottom-center"
      toastOptions={{ className: "vaultly-toast" }}
    />
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, staleTime: Infinity, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      storageKey="vaultly.theme"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={client}>
        <LocaleMemory />
        {children}
        <Notifications />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
