"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function SignupPage() {
  const router = useRouter();

  const [gymName, setGymName] = useState("");
  const [gymEmail, setGymEmail] = useState("");
  const [gymPhone, setGymPhone] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (ownerPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gymName,
          gymEmail,
          gymPhone,
          ownerName,
          ownerEmail,
          ownerPhone,
          ownerPassword,
          confirmPassword,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setError(payload?.message || "Signup failed. Please verify details and try again.");
        setLoading(false);
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("Network error while creating account. Please retry.");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[color:var(--base)] text-[color:var(--text)]">
      <div className="pointer-events-none absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-[radial-gradient(circle,var(--fern)_0%,transparent_70%)] opacity-30 blur-2xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,var(--mint)_0%,transparent_72%)] opacity-20 blur-2xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center p-5 sm:p-8">
        <div className="grid w-full max-w-5xl gap-5 rounded-3xl border border-[color:var(--line)] bg-[color:var(--panel)] p-5 shadow-[0_20px_60px_rgba(2,8,5,0.45)] md:grid-cols-[1fr_1.2fr] md:p-8">
          <section className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel-strong)] p-6">
            <Image src="/hyl-logo.svg" alt="HYL" width={220} height={64} priority />
            <p className="mt-6 text-xs uppercase tracking-[0.28em] text-[color:var(--muted)]">Create Owner Workspace</p>
            <h1 className="mt-2 text-3xl font-bold text-[color:var(--mint)] sm:text-4xl">Launch Your HYL Gym</h1>
            <p className="mt-3 max-w-sm text-sm text-[color:var(--muted)]">
              Create your gym and owner account in one step. You will be signed in right after setup.
            </p>
            <div className="mt-8 rounded-xl bg-[color:var(--panel)] p-3 text-sm text-[color:var(--muted)]">
              Already have an account? <Link className="font-semibold text-[color:var(--mint)]" href="/login">Sign in</Link>
            </div>
          </section>

          <section className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] p-6">
            <h2 className="text-xl font-semibold text-[color:var(--mint)]">Owner Signup</h2>
            <p className="mt-1 text-sm text-[color:var(--muted)]">Enter gym and owner details.</p>

            {error && (
              <div className="mt-4 rounded-xl border border-[#ffc66f44] bg-[#ffc66f1a] px-3 py-2 text-sm text-[#ffd79a]">
                {error}
              </div>
            )}

            <form className="mt-5 grid gap-3" onSubmit={onSubmit}>
              <label className="block text-sm">
                <span className="mb-1 block text-[color:var(--muted)]">Gym Name</span>
                <input
                  type="text"
                  required
                  value={gymName}
                  onChange={(event) => setGymName(event.target.value)}
                  className="w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--panel-strong)] px-3 py-2 text-[color:var(--text)] outline-none transition focus:border-[color:var(--mint)]"
                  placeholder="HYL Fitness Studio"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-[color:var(--muted)]">Gym Email</span>
                <input
                  type="email"
                  required
                  value={gymEmail}
                  onChange={(event) => setGymEmail(event.target.value)}
                  className="w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--panel-strong)] px-3 py-2 text-[color:var(--text)] outline-none transition focus:border-[color:var(--mint)]"
                  placeholder="gym@hyl.com"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-[color:var(--muted)]">Gym Phone (Optional)</span>
                <input
                  type="text"
                  value={gymPhone}
                  onChange={(event) => setGymPhone(event.target.value)}
                  className="w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--panel-strong)] px-3 py-2 text-[color:var(--text)] outline-none transition focus:border-[color:var(--mint)]"
                  placeholder="+1 555 000 1111"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-[color:var(--muted)]">Owner Name</span>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(event) => setOwnerName(event.target.value)}
                  className="w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--panel-strong)] px-3 py-2 text-[color:var(--text)] outline-none transition focus:border-[color:var(--mint)]"
                  placeholder="Owner Name"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-[color:var(--muted)]">Owner Email</span>
                <input
                  type="email"
                  required
                  value={ownerEmail}
                  onChange={(event) => setOwnerEmail(event.target.value)}
                  className="w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--panel-strong)] px-3 py-2 text-[color:var(--text)] outline-none transition focus:border-[color:var(--mint)]"
                  placeholder="owner@hyl.com"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-[color:var(--muted)]">Owner Phone (Optional)</span>
                <input
                  type="text"
                  value={ownerPhone}
                  onChange={(event) => setOwnerPhone(event.target.value)}
                  className="w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--panel-strong)] px-3 py-2 text-[color:var(--text)] outline-none transition focus:border-[color:var(--mint)]"
                  placeholder="+1 555 222 3333"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-[color:var(--muted)]">Password</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={ownerPassword}
                  onChange={(event) => setOwnerPassword(event.target.value)}
                  className="w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--panel-strong)] px-3 py-2 text-[color:var(--text)] outline-none transition focus:border-[color:var(--mint)]"
                  placeholder="At least 6 characters"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-[color:var(--muted)]">Confirm Password</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--panel-strong)] px-3 py-2 text-[color:var(--text)] outline-none transition focus:border-[color:var(--mint)]"
                  placeholder="Re-enter your password"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-[color:var(--mint)] px-4 py-2.5 font-semibold text-[color:var(--base)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-65"
              >
                {loading ? "Creating Workspace..." : "Create Owner Account"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
