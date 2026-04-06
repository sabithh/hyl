import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/panel";
import { members } from "@/lib/data";

export default function MembersPage() {
  return (
    <AppShell title="Members" subtitle="Member lifecycle, plan status and trainer mapping.">
      <Panel title="All Members" subtitle="Newest to oldest activity.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
              <tr>
                <th className="pb-3">Name</th>
                <th className="pb-3">Plan</th>
                <th className="pb-3">Trainer</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Renewal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--line)]">
              {members.map((member) => (
                <tr key={member.name}>
                  <td className="py-3 font-semibold text-[color:var(--mint)]">{member.name}</td>
                  <td className="py-3">{member.plan}</td>
                  <td className="py-3">{member.trainer}</td>
                  <td className="py-3">
                    <span className="rounded-full bg-[color:var(--panel-strong)] px-3 py-1">{member.status}</span>
                  </td>
                  <td className="py-3">{member.renewal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}
