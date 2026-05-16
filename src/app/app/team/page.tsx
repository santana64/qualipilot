import { Users } from "lucide-react";
import { Badge, Field, Notice, PageHeader, SectionCard, SubmitButton, inputClass } from "@/components/ui";
import { prisma } from "@/lib/db";
import { disableTeamMemberAction, inviteTeamMemberAction } from "@/server/actions/team";
import { requireWorkspacePermission } from "@/server/rbac";

const roleLabels: Record<string, string> = {
  ADMIN: "Administrateur",
  QUALITY_MANAGER: "Responsable qualité",
  TRAINER: "Formateur",
  VIEWER: "Lecture seule",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Actif",
  INVITED: "Invité",
  DISABLED: "Désactivé",
};

export default async function TeamPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const workspace = await requireWorkspacePermission("manageTeam");
  const params = (await searchParams) ?? {};
  const members = await prisma.teamMember.findMany({
    where: { ownerUserId: workspace.workspaceUserId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return (
    <main className="grid gap-8">
      <PageHeader
        title="Équipe"
        description="Invitez un responsable qualité, un formateur ou un lecteur auditeur interne dans votre espace."
      />
      <Notice message={params.error} type="error" />
      <Notice message={params.success} type="success" />

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionCard>
          <div className="mb-5 flex items-center gap-2">
            <Users className="h-5 w-5 text-brand" />
            <h2 className="font-bold text-foreground">Inviter un membre</h2>
          </div>
          <form action={inviteTeamMemberAction} className="grid gap-4">
            <Field label="Email" required>
              <input className={inputClass} name="email" type="email" required />
            </Field>
            <Field label="Nom">
              <input className={inputClass} name="name" />
            </Field>
            <Field label="Rôle">
              <select className={inputClass} name="role" defaultValue="QUALITY_MANAGER">
                {Object.entries(roleLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <SubmitButton>Envoyer l'invitation</SubmitButton>
          </form>
        </SectionCard>

        <SectionCard>
          <h2 className="font-bold text-foreground">Membres</h2>
          <div className="mt-4 grid gap-3">
            {members.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-5 text-sm text-foreground-muted">
                Aucun membre invité pour le moment.
              </p>
            ) : null}
            {members.map((member) => (
              <div key={member.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
                <div>
                  <p className="font-semibold text-foreground">{member.name || member.email}</p>
                  <p className="text-xs text-foreground-muted">
                    {member.email} - {roleLabels[member.role] ?? member.role}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={member.status === "ACTIVE" ? "green" : member.status === "INVITED" ? "amber" : "slate"}>
                    {statusLabels[member.status] ?? member.status}
                  </Badge>
                  {member.status !== "DISABLED" ? (
                    <form action={disableTeamMemberAction}>
                      <input type="hidden" name="id" value={member.id} />
                      <SubmitButton variant="secondary" size="sm">Désactiver</SubmitButton>
                    </form>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>
    </main>
  );
}
