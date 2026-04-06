import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/panel";
import { getGym, getNotifications } from "@/lib/api";
import { requireOwnerSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await requireOwnerSession();
  const [gym, notificationData] = await Promise.all([
    getGym(session.accessToken).catch(() => null),
    getNotifications(session.accessToken, 1, 100).catch(() => ({
      notifications: [],
      pagination: { total: 0, page: 1, limit: 100, totalPages: 0 },
    })),
  ]);

  return (
    <AppShell
      title="Notifications"
      subtitle="Live owner notification stream and read state."
      ownerName={session.user.name}
      gymName={gym?.name ?? "HYL"}
    >
      <Panel title="Notification Feed" subtitle={`${notificationData.pagination.total} notifications found.`}>
        {notificationData.notifications.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">No notifications available right now.</p>
        ) : (
          <div className="space-y-3">
            {notificationData.notifications.map((item) => (
              <div key={item.id} className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel-strong)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-[color:var(--mint)]">{item.title}</h3>
                  <span className="rounded-full bg-[color:var(--panel)] px-3 py-1 text-xs uppercase tracking-wider text-[color:var(--muted)]">
                    {item.isRead ? "Read" : "Unread"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[color:var(--muted)]">Type: {item.type}</p>
                <p className="mt-1 text-sm">{item.body}</p>
                <p className="mt-2 text-xs text-[color:var(--muted)]">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </AppShell>
  );
}
