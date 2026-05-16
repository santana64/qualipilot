import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ForbiddenError } from "@/lib/errors";

export type WorkspaceRole = "OWNER" | "ADMIN" | "QUALITY_MANAGER" | "TRAINER" | "VIEWER";

export type Permission =
  | "viewWorkspace"
  | "manageSettings"
  | "manageBilling"
  | "manageTeam"
  | "manageCabinet"
  | "manageTraining"
  | "manageEvidence"
  | "manageActions"
  | "manageRnq"
  | "manageDocuments"
  | "manageAudit"
  | "manageReminders"
  | "createAuditorShare"
  | "exportAudit";

const ROLE_PERMISSIONS: Record<WorkspaceRole, Permission[]> = {
  OWNER: [
    "viewWorkspace",
    "manageSettings",
    "manageBilling",
    "manageTeam",
    "manageCabinet",
    "manageTraining",
    "manageEvidence",
    "manageActions",
    "manageRnq",
    "manageDocuments",
    "manageAudit",
    "manageReminders",
    "createAuditorShare",
    "exportAudit",
  ],
  ADMIN: [
    "viewWorkspace",
    "manageSettings",
    "manageTeam",
    "manageCabinet",
    "manageTraining",
    "manageEvidence",
    "manageActions",
    "manageRnq",
    "manageDocuments",
    "manageAudit",
    "manageReminders",
    "createAuditorShare",
    "exportAudit",
  ],
  QUALITY_MANAGER: [
    "viewWorkspace",
    "manageTraining",
    "manageEvidence",
    "manageActions",
    "manageRnq",
    "manageDocuments",
    "manageAudit",
    "manageReminders",
    "createAuditorShare",
    "exportAudit",
  ],
  TRAINER: ["viewWorkspace", "manageTraining", "manageEvidence"],
  VIEWER: ["viewWorkspace", "exportAudit"],
};

export type WorkspaceContext = {
  actorUserId: string;
  actorEmail: string;
  actorName: string | null;
  workspaceUserId: string;
  role: WorkspaceRole;
  membershipId: string | null;
};

export function roleAllows(role: WorkspaceRole, permission: Permission) {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export async function resolveWorkspaceContextByUserId(userId: string): Promise<Omit<WorkspaceContext, "actorEmail" | "actorName">> {
  const membership = await prisma.teamMember.findFirst({
    where: {
      memberUserId: userId,
      status: "ACTIVE",
    },
    orderBy: [{ acceptedAt: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      ownerUserId: true,
      role: true,
    },
  });

  if (membership) {
    return {
      actorUserId: userId,
      workspaceUserId: membership.ownerUserId,
      role: membership.role as WorkspaceRole,
      membershipId: membership.id,
    };
  }

  return {
    actorUserId: userId,
    workspaceUserId: userId,
    role: "OWNER",
    membershipId: null,
  };
}

export async function getWorkspaceContext(): Promise<WorkspaceContext> {
  const user = await requireUser();
  const workspace = await resolveWorkspaceContextByUserId(user.id);
  return {
    ...workspace,
    actorEmail: user.email,
    actorName: user.name,
  };
}

export async function requireWorkspacePermission(permission: Permission): Promise<WorkspaceContext> {
  const context = await getWorkspaceContext();
  if (!roleAllows(context.role, permission)) {
    throw new ForbiddenError();
  }
  return context;
}

export function assertPermission(role: WorkspaceRole, permission: Permission) {
  if (!roleAllows(role, permission)) {
    throw new ForbiddenError();
  }
}
