import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await requireUser();
  const data = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerifiedAt: true,
      createdAt: true,
      updatedAt: true,
      organizationProfile: true,
      indicatorProgress: { include: { indicator: true } },
      trainingPrograms: true,
      evidences: {
        include: {
          indicatorLinks: { include: { indicator: true } },
          trainingProgramLinks: { include: { trainingProgram: true } },
        },
      },
      actionPlanItems: true,
      generatedDocuments: true,
      auditRecords: true,
      subscription: true,
      cabinetClients: true,
      reminders: true,
    },
  });

  return NextResponse.json(
    {
      exportedAt: new Date().toISOString(),
      disclaimer: "Export RGPD utilisateur QualiPilot. Vérifiez votre besoin légal avant tout usage externe.",
      data,
    },
    {
      headers: {
        "Content-Disposition": `attachment; filename="qualipilot-export-${user.id}.json"`,
      },
    },
  );
}
