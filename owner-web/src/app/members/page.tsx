import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/panel";
import { getGym, getMembers, getTrainers } from "@/lib/api";
import { requireOwnerSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const session = await requireOwnerSession();
  const [gym, memberData, trainers] = await Promise.all([
    getGym(session.accessToken).catch(() => null),
    getMembers(session.accessToken, "trainee", 1, 150).catch(() => ({
      members: [],
      pagination: { total: 0, page: 1, limit: 150, totalPages: 0 },
    })),
    getTrainers(session.accessToken).catch(() => []),
  ]);

  const trainerNameById = new Map(trainers.map((trainer) => [trainer.id, trainer.name]));

  return (
    <AppShell
      title="Members"
      subtitle="Live member lifecycle and trainer assignment from HYL backend."
      ownerName={session.user.name}
      gymName={gym?.name ?? "HYL"}
    >
      <Panel title="All Members" subtitle={`${memberData.pagination.total} trainees in your gym.`}>
        {memberData.members.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">No members found yet. Add members from your onboarding flow.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
                <tr>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Phone</th>
                  <th className="pb-3">Assigned Trainer</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--line)]">
                {memberData.members.map((member) => (
                  <tr key={member.id}>
                    <td className="py-3 font-semibold text-[color:var(--mint)]">{member.name}</td>
                    <td className="py-3">{member.email}</td>
                    <td className="py-3">{member.phone || "-"}</td>
                    <td className="py-3">
                      {member.assignedTrainerId ? trainerNameById.get(member.assignedTrainerId) || "Unassigned" : "Unassigned"}
                    </td>
                    <td className="py-3">
                      <span className="rounded-full bg-[color:var(--panel-strong)] px-3 py-1">{member.isActive ? "Active" : "Inactive"}</span>
                    </td>
                    <td className="py-3">{member.joinDate ? new Date(member.joinDate).toLocaleDateString() : "-"}</td>
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
