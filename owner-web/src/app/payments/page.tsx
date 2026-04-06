import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/panel";
import { getGym, getPayments } from "@/lib/api";
import { requireOwnerSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default async function PaymentsPage() {
  const session = await requireOwnerSession();
  const [gym, paymentData] = await Promise.all([
    getGym(session.accessToken).catch(() => null),
    getPayments(session.accessToken, 1, 150).catch(() => ({
      payments: [],
      pagination: { total: 0, page: 1, limit: 150, totalPages: 0 },
    })),
  ]);

  return (
    <AppShell
      title="Payments"
      subtitle="Live invoice and collection status from your production backend."
      ownerName={session.user.name}
      gymName={gym?.name ?? "HYL"}
    >
      <Panel title="Recent Payments" subtitle={`${paymentData.pagination.total} total transactions.`}>
        {paymentData.payments.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">No payments have been recorded yet.</p>
        ) : (
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
                {paymentData.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="py-3 font-semibold text-[color:var(--mint)]">{payment.user?.name || "Unknown"}</td>
                    <td className="py-3">{currencyFormatter.format(payment.amount)}</td>
                    <td className="py-3 capitalize">{payment.method}</td>
                    <td className="py-3">
                      <span className="rounded-full bg-[color:var(--panel-strong)] px-3 py-1 capitalize">{payment.status}</span>
                    </td>
                    <td className="py-3">{new Date(payment.paidAt || payment.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </AppShell>
  );
}
