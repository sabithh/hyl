type KpiCardProps = {
  label: string;
  value: string;
  delta: string;
};

export function KpiCard({ label, value, delta }: KpiCardProps) {
  const isPositive = delta.startsWith("+");

  return (
    <article className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel-strong)] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">{label}</p>
      <p className="mt-2 text-3xl font-bold leading-none text-[color:var(--mint)]">{value}</p>
      <p className={`mt-2 text-sm font-medium ${isPositive ? "text-[color:var(--ok)]" : "text-[color:var(--warn)]"}`}>
        {delta} vs last month
      </p>
    </article>
  );
}
