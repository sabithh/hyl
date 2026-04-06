import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/panel";
import { getGym, getReferralStats } from "@/lib/api";
import { requireOwnerSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ReferralsPage() {
  const session = await requireOwnerSession();
  const [gym, stats] = await Promise.all([
    getGym(session.accessToken).catch(() => null),
    getReferralStats(session.accessToken).catch(() => ({ totalsByStatus: [], totalsByType: [], topReferrers: [] })),
  ]);

  const totalReferrals = stats.topReferrers.reduce((sum, item) => sum + item.referrals, 0);

  return (
    <AppShell
      title="Referrals"
      subtitle="Live referral rewards and conversion performance."
      ownerName={session.user.name}
      gymName={gym?.name ?? "HYL"}
    >
      <Panel title="Top Referrers" subtitle={`${totalReferrals} tracked referrals across top members.`}>
        {stats.topReferrers.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">No referral activity yet.</p>
        ) : (
          <div className="space-y-3">
            {stats.topReferrers.map((item) => (
              <div key={item.referrerId} className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel-strong)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-[color:var(--mint)]">{item.user?.name || "Unknown member"}</h3>
                  <span className="text-sm text-[color:var(--muted)]">{item.referrals} referrals</span>
                </div>
                <p className="mt-2 text-sm">{item.user?.email || "No email available"}</p>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </AppShell>
  );
}
