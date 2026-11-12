"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, CircleHelp, LoaderCircle, X, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  useRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

export type Tone = "green" | "violet" | "amber" | "blue" | "rose" | "neutral";
type Variant = "primary" | "secondary" | "ghost" | "danger";

export function cx(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function buttonClass(variant: Variant = "secondary", className?: string) {
  return cx("ui-button", "ui-button--" + variant, className);
}

export function Button({
  variant = "secondary",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />;
}

export function IconButton({
  icon: Icon,
  label,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string }) {
  return (
    <Button
      variant="ghost"
      className={cx("ui-icon-button", className)}
      title={label}
      aria-label={label}
      {...props}
    >
      <Icon size={17} aria-hidden="true" />
    </Button>
  );
}

export function IconTile({
  icon: Icon,
  tone = "green",
  className,
}: {
  icon: LucideIcon;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span className={cx("icon-tile", className)} data-tone={tone}>
      <Icon aria-hidden="true" size={19} strokeWidth={1.8} />
    </span>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cx("ui-panel", className)}>{children}</section>;
}

export function PanelHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function PageHeader({
  title,
  description,
  context,
  children,
}: {
  title: string;
  description: string;
  context?: string;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        {context && <p className="mb-2 text-sm font-medium text-muted">{context}</p>}
        <h1 className="display page-title">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">{description}</p>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2.5">{children}</div>}
    </header>
  );
}

export function Metric({
  label,
  value,
  detail,
  icon,
  tone = "green",
  featured = false,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  icon: LucideIcon;
  tone?: Tone;
  featured?: boolean;
}) {
  return (
    <article className={cx("metric ui-panel", featured && "metric-featured")}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{label}</p>
        <IconTile icon={icon} tone={tone} />
      </div>
      <div className="display metric-value tabular-nums">
        <bdi>{value}</bdi>
      </div>
      {detail && <p className="mt-1.5 text-xs leading-5">{detail}</p>}
    </article>
  );
}

export function EmptyState({
  icon = CircleHelp,
  title,
  description,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3 px-4 py-8 text-center">
      <IconTile icon={icon} tone="neutral" />
      <div>
        <h3 className="font-semibold">{title}</h3>
        {description && (
          <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-muted">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

export function Progress({
  value,
  label,
  tone = "green",
}: {
  value: number;
  label: string;
  tone?: Tone;
}) {
  const percent = Math.min(100, Math.max(0, value));
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
    >
      <span
        data-tone={tone}
        className="progress-fill"
        style={{ "--progress": percent + "%" } as CSSProperties}
      />
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm font-medium">
      <span>{label}</span>
      {children}
      {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx("ui-input", className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx("ui-input ui-select", className)} {...props} />;
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx("ui-input min-h-22 resize-y", className)} {...props} />;
}

export function Modal({
  title,
  description,
  open,
  onOpenChange,
  children,
}: {
  title: string;
  description: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  const t = useTranslations("common");
  const origin = useRef<HTMLElement | null>(null);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          className="dialog-content"
          onOpenAutoFocus={() => {
            origin.current = document.activeElement as HTMLElement | null;
          }}
          onCloseAutoFocus={(event) => {
            if (origin.current?.isConnected) {
              event.preventDefault();
              origin.current.focus({ preventScroll: true });
            }
          }}
        >
          <div className="mb-5 pe-8">
            <Dialog.Title className="display text-2xl font-semibold">{title}</Dialog.Title>
            <Dialog.Description className="mt-1.5 text-sm leading-relaxed text-muted">
              {description}
            </Dialog.Description>
          </div>
          {children}
          <Dialog.Close asChild>
            <IconButton icon={X} label={t("close")} className="absolute end-3 top-3" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function FormActions({
  pending,
  close,
  label,
}: {
  pending: boolean;
  close: () => void;
  label?: string;
}) {
  const t = useTranslations("common");
  return (
    <div className="mt-2 flex flex-wrap justify-end gap-2">
      <Button onClick={close}>{t("cancel")}</Button>
      <Button variant="primary" type="submit" disabled={pending}>
        {pending && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
        {pending ? t("saving") : (label ?? t("save"))}
      </Button>
    </div>
  );
}

export function ConfirmDialog({
  open,
  close,
  title,
  description,
  action,
  pending,
  destructive,
  onConfirm,
}: {
  open: boolean;
  close: () => void;
  title: string;
  description: string;
  action: string;
  pending?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  const t = useTranslations("common");
  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onOpenChange={(next) => !next && close()}
    >
      <div className="flex flex-wrap justify-end gap-2">
        <Button onClick={close}>{t("cancel")}</Button>
        <Button
          variant={destructive ? "danger" : "primary"}
          onClick={onConfirm}
          disabled={pending}
        >
          {pending ? t("saving") : action}
        </Button>
      </div>
    </Modal>
  );
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className="text-link" href={href}>
      {children}
      <ArrowUpRight className="rtl:rotate-[-90deg]" size={15} aria-hidden="true" />
    </Link>
  );
}
