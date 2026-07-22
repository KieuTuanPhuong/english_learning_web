"use client";
// Polished design-system primitives (ported from design/wireframes/primitives.jsx,
// sketch aesthetic dropped, role accent kept via the `accent` color token).
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-4 w-4 animate-spin", className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function FullScreenLoader() {
  return (
    <div className="flex flex-1 items-center justify-center py-24 text-zinc-400">
      <Spinner className="h-6 w-6" />
    </div>
  );
}

type ButtonVariant = "primary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-foreground hover:opacity-90",
  outline: "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50",
  ghost: "text-zinc-700 hover:bg-zinc-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
};
const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
  }
>(function Button(
  { variant = "primary", size = "md", loading = false, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
});

export const TextField = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }
>(function TextField({ label, error, className, ...props }, ref) {
  return (
    <label className="block space-y-1">
      {label && <span className="block text-sm font-medium text-zinc-700">{label}</span>}
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-md border bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:ring-2 focus:ring-accent/30",
          error ? "border-red-400 focus:border-red-400" : "border-zinc-300 focus:border-accent",
          className,
        )}
        {...props}
      />
      {error && <span className="block text-xs text-red-600">{error}</span>}
    </label>
  );
});

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }
>(function TextArea({ label, error, className, ...props }, ref) {
  return (
    <label className="block space-y-1">
      {label && <span className="block text-sm font-medium text-zinc-700">{label}</span>}
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-md border bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:ring-2 focus:ring-accent/30",
          error ? "border-red-400 focus:border-red-400" : "border-zinc-300 focus:border-accent",
          className,
        )}
        {...props}
      />
      {error && <span className="block text-xs text-red-600">{error}</span>}
    </label>
  );
});

export function Card({
  className,
  accent = false,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { accent?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        accent ? "border-accent/30 bg-accent/5" : "border-zinc-200 bg-white",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

const badgeColors: Record<string, string> = {
  writing: "bg-blue-100 text-blue-800",
  speaking: "bg-orange-100 text-orange-800",
  reading: "bg-emerald-100 text-emerald-800",
  listening: "bg-violet-100 text-violet-800",
  quiz: "bg-emerald-100 text-emerald-800",
  graded: "bg-emerald-100 text-emerald-800",
  submitted: "bg-emerald-100 text-emerald-800",
  ungraded: "bg-amber-100 text-amber-800",
  pending: "bg-amber-100 text-amber-800",
  active: "bg-emerald-100 text-emerald-800",
  suspended: "bg-red-100 text-red-800",
  inactive: "bg-zinc-200 text-zinc-700",
  beginner: "bg-blue-100 text-blue-800",
  intermediate: "bg-violet-100 text-violet-800",
  advanced: "bg-red-100 text-red-800",
  student: "bg-indigo-100 text-indigo-800",
  teacher: "bg-teal-100 text-teal-800",
  admin: "bg-amber-100 text-amber-800",
  ai_graded: "bg-violet-100 text-violet-700 ring-1 ring-violet-600/20",
};

export function AiTag() {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-violet-100 px-1.5 py-0.5 text-xs font-medium text-violet-700">
      AI
    </span>
  );
}

export function Badge({
  kind,
  children,
  className,
}: {
  kind?: string;
  children?: ReactNode;
  className?: string;
}) {
  const color = (kind && badgeColors[kind]) || "bg-zinc-200 text-zinc-700";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        color,
        className,
      )}
    >
      {children ?? kind}
    </span>
  );
}

export function Avatar({
  name,
  size = 32,
  className,
}: {
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const initials =
    (name ?? "?")
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-zinc-200 font-medium text-zinc-700",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </span>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-zinc-200", className)}>
      <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-zinc-200", className)} />;
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center">
      <p className="font-medium text-zinc-700">{title}</p>
      {hint && <p className="mt-1 text-sm text-zinc-500">{hint}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({ message }: { message?: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {message ?? "Something went wrong. Please try again."}
    </div>
  );
}

export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex gap-1 border-b border-zinc-200">
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={cn(
            "-mb-px border-b-2 px-3 py-2 text-sm",
            value === t.value
              ? "border-accent font-semibold text-accent"
              : "border-transparent text-zinc-500 hover:text-zinc-700",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// Placeholder for routes whose role-specific view ships in a later milestone.
export function RolePlaceholder({ feature }: { feature: string }) {
  return <EmptyState title={feature} hint="This view ships in a later milestone." />;
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 className="mb-3 text-lg font-bold">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
