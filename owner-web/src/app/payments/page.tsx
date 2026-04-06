import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/panel";
import { payments } from "@/lib/data";

export default function PaymentsPage() {
  return (
    <AppShell title="Payments" subtitle="Invoice collection, payment channel and status tracking.">
      <Panel title="Recent Payments" subtitle="Latest transactions across all members.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
              <tr>
                <th className="pb-3">Member</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Method</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--line)]">
              {payments.map((payment) => (
                <tr key={`${payment.member}-${payment.date}`}>
                  <td className="py-3 font-semibold text-[color:var(--mint)]">{payment.member}</td>
                  <td className="py-3">{payment.amount}</td>
                  <td className="py-3">{payment.method}</td>
                  <td className="py-3">
                    <span className="rounded-full bg-[color:var(--panel-strong)] px-3 py-1">{payment.status}</span>
                  </td>
                  <td className="py-3">{payment.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}
