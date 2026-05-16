import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { TrainingProgramForm } from "@/components/training-program-form";
import { prisma } from "@/lib/db";
import { updateTrainingProgramAction } from "@/server/actions/training";
import { requireWorkspacePermission } from "@/server/rbac";

export default async function EditTrainingProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const workspace = await requireWorkspacePermission("manageTraining");
  const { id } = await params;
  const [program, clients] = await Promise.all([
    prisma.trainingProgram.findFirst({ where: { id, userId: workspace.workspaceUserId } }),
    prisma.cabinetClient.findMany({ where: { userId: workspace.workspaceUserId, status: "ACTIVE" }, orderBy: { organizationName: "asc" } }),
  ]);
  if (!program) notFound();
  return (
    <main className="grid gap-6">
      <PageHeader title="Modifier la formation" description={program.title} />
      <TrainingProgramForm action={updateTrainingProgramAction} program={program} clients={clients} />
    </main>
  );
}
