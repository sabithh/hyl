"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const queryErrorMessages: Record<string, string> = {
  "owner-only": "Owner account is required for this dashboard.",
  "session-expired": "Your session expired. Please log in again.",
  "session-invalid": "Please login to continue.",
};

const getLoginErrorMessage = (status: number, fallback?: string) => {
  if (status === 401) {
    return "Invalid email or password.";
  }

  if (status === 403) {
    return "Only owner accounts can access the owner dashboard.";
  }

  if (status >= 500) {
    return "Authentication service is temporarily unavailable. Please try again.";
  }

  return fallback || "Login failed. Please verify your credentials.";
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryError] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const key = new URLSearchParams(window.location.search).get("error") || "";
    return queryErrorMessages[key] || null;
  });

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setError(getLoginErrorMessage(response.status, payload?.message));
        setLoading(false);
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("Network error while logging in. Please retry.");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[color:var(--base)] text-[color:var(--text)]">
      <div className="pointer-events-none absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-[radial-gradient(circle,var(--fern)_0%,transparent_70%)] opacity-30 blur-2xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,var(--mint)_0%,transparent_72%)] opacity-20 blur-2xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center p-5 sm:p-8">
        <div className="grid w-full max-w-4xl gap-5 rounded-3xl border border-[color:var(--line)] bg-[color:var(--panel)] p-5 shadow-[0_20px_60px_rgba(2,8,5,0.45)] md:grid-cols-[1.1fr_1fr] md:p-8">
          <section className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel-strong)] p-6">
            <Image src="/hyl-logo.svg" alt="HYL" width={220} height={64} priority />
            <p className="mt-6 text-xs uppercase tracking-[0.28em] text-[color:var(--muted)]">HYL Owner Access</p>
            <h1 className="mt-2 text-3xl font-bold text-[color:var(--mint)] sm:text-4xl">Control Every Metric</h1>
            <p className="mt-3 max-w-sm text-sm text-[color:var(--muted)]">
              Sign in with your owner account to manage trainers, members, plans, payments, attendance, and growth.
            </p>
            <div className="mt-8 space-y-2 text-sm text-[color:var(--muted)]">
              <p>Live API connected to your Render backend</p>
              <p>Branding: HYL operations workspace</p>
              <p>
                New gym owner?{" "}
                <Link className="font-semibold text-[color:var(--mint)]" href="/signup">
                  Create account
                </Link>
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] p-6">
            <h2 className="text-xl font-semibold text-[color:var(--mint)]">Owner Login</h2>
            <p className="mt-1 text-sm text-[color:var(--muted)]">Use your owner email and password.</p>

            {(queryError || error) && (
              <div className="mt-4 rounded-xl border border-[#ffc66f44] bg-[#ffc66f1a] px-3 py-2 text-sm text-[#ffd79a]">
                {error || queryError}
              </div>
            )}

            <form className="mt-5 space-y-4" onSubmit={onSubmit}>
              <label className="block text-sm">
                <span className="mb-1 block text-[color:var(--muted)]">Email</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--panel-strong)] px-3 py-2 text-[color:var(--text)] outline-none transition focus:border-[color:var(--mint)]"
                  placeholder="owner@yourgym.com"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-[color:var(--muted)]">Password</span>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--panel-strong)] px-3 py-2 text-[color:var(--text)] outline-none transition focus:border-[color:var(--mint)]"
                  placeholder="Enter your password"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[color:var(--mint)] px-4 py-2.5 font-semibold text-[color:var(--base)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-65"
              >
                {loading ? "Signing In..." : "Sign In to HYL"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
