import Link from "next/link";
import { messages } from "@/lib/i18n";

export default function NotFound() {
  const t = messages.en;
  return (
    <main id="main-content" className="site-width grid min-h-[80vh] place-items-center">
      <div className="text-center">
        <h1 className="display page-title">{t.notFound.title}</h1>
        <p className="mb-5 mt-3 text-muted">{t.notFound.description}</p>
        <Link href="/" className="ui-button ui-button--primary">
          {t.common.goHome}
        </Link>
      </div>
    </main>
  );
}
