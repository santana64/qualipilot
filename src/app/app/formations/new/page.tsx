import { PageHeader } from "@/components/ui";
import { TrainingProgramForm } from "@/components/training-program-form";
import { prisma } from "@/lib/db";
import { createTrainingProgramAction } from "@/server/actions/training";
import { requireWorkspacePermission } from "@/server/rbac";

export default async function NewTrainingProgramPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const workspace = await requireWorkspacePermission("manageTraining");
  const params = (await searchParams) ?? {};
  const clientId = typeof params.clientId === "string" ? params.clientId : null;
  const clients = await prisma.cabinetClient.findMany({ where: { userId: workspace.workspaceUserId, status: "ACTIVE" }, orderBy: { organizationName: "asc" } });
  return (
    <main className="grid gap-6">
      <PageHeader title="Nouvelle formation" description="Renseignez les informations nécessaires pour éviter les zones grises avant audit." />
      <TrainingProgramForm action={createTrainingProgramAction} clients={clients} defaultClientId={clientId} />
    </main>
  );
}
