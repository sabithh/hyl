import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/panel";
import { referrals } from "@/lib/data";

export default function ReferralsPage() {
  return (
    <AppShell title="Referrals" subtitle="Member referral performance and reward tracking.">
      <Panel title="Top Referrers" subtitle="Members driving highest conversions.">
        <div className="space-y-3">
          {referrals.map((item) => (
            <div key={item.member} className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel-strong)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-[color:var(--mint)]">{item.member}</h3>
                <span className="text-sm text-[color:var(--muted)]">{item.referrals} referrals</span>
              </div>
              <p className="mt-2 text-sm">Reward: {item.reward}</p>
            </div>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}
