"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren } from "react";

type AppShellProps = PropsWithChildren<{
  title: string;
  subtitle: string;
}>;

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/members", label: "Members" },
  { href: "/trainers", label: "Trainers" },
  { href: "/plans", label: "Workout Plans" },
  { href: "/diets", label: "Diet Plans" },
  { href: "/payments", label: "Payments" },
  { href: "/attendance", label: "Attendance" },
  { href: "/notifications", label: "Notifications" },
  { href: "/referrals", label: "Referrals" },
  { href: "/settings", label: "Settings" },
] as const;

export function AppShell({ title, subtitle, children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[color:var(--base)] text-[color:var(--text)]">
      <div className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-[radial-gradient(circle,var(--fern)_0%,transparent_70%)] opacity-35 blur-2xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,var(--mint)_0%,transparent_72%)] opacity-20 blur-2xl" />

      <div className="relative mx-auto flex max-w-[1500px] gap-4 p-4 lg:p-6">
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-[260px] rounded-3xl border border-[color:var(--line)] bg-[color:var(--panel)] p-4 lg:block">
          <div className="mb-6 rounded-2xl bg-[color:var(--panel-strong)] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">Gym Pulse</p>
            <h2 className="mt-2 text-2xl font-bold text-[color:var(--mint)]">Owner</h2>
            <p className="mt-1 text-sm text-[color:var(--muted)]">Control Center</p>
          </div>

          <nav className="space-y-1">
            {nav.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-xl px-3 py-2 text-sm transition ${
                    active
                      ? "bg-[color:var(--mint)] font-semibold text-[color:var(--base)]"
                      : "text-[color:var(--muted)] hover:bg-[color:var(--panel-strong)] hover:text-[color:var(--mint)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 rounded-3xl border border-[color:var(--line)] bg-[color:var(--panel)] p-4 sm:p-5 lg:p-7">
          <nav className="mb-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {nav.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={`mobile-${item.href}`}
                  href={item.href}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs ${
                    active
                      ? "bg-[color:var(--mint)] font-semibold text-[color:var(--base)]"
                      : "bg-[color:var(--panel-strong)] text-[color:var(--muted)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <header className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-[color:var(--line)] pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Owner Workspace</p>
              <h1 className="text-3xl font-bold leading-tight text-[color:var(--mint)] sm:text-4xl">{title}</h1>
              <p className="mt-1 text-sm text-[color:var(--muted)]">{subtitle}</p>
            </div>
            <div className="rounded-xl bg-[color:var(--panel-strong)] px-3 py-2 text-sm text-[color:var(--muted)]">
              Updated 2 min ago
            </div>
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}
