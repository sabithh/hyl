import { PropsWithChildren } from "react";

type PanelProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  className?: string;
}>;

export function Panel({ title, subtitle, className = "", children }: PanelProps) {
  return (
    <section
      className={`rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] p-5 shadow-[0_12px_30px_rgba(3,10,6,0.35)] ${className}`}
    >
      {(title || subtitle) && (
        <header className="mb-4">
          {title && <h3 className="text-lg font-semibold tracking-tight text-[color:var(--mint)]">{title}</h3>}
          {subtitle && <p className="text-sm text-[color:var(--muted)]">{subtitle}</p>}
        </header>
      )}
      {children}
    </section>
  );
}
