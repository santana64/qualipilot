"use server";

import { redirect } from "next/navigation";
import { toPublicError } from "@/lib/errors";
import { runRnqWatch } from "@/server/rnq-watch";
import { requireWorkspacePermission } from "@/server/rbac";

export async function runRnqWatchAction() {
  await requireWorkspacePermission("manageAudit");
  let target = "/app/veille";
  try {
    const result = await runRnqWatch();
    target = `/app/veille?success=${encodeURIComponent(
      result.changed
        ? `Changement RNQ detecte. ${result.notified} notification(s) envoyee(s).`
        : "Aucun changement RNQ detecte.",
    )}`;
  } catch (error) {
    target = `/app/veille?error=${encodeURIComponent(toPublicError(error))}`;
  }
  redirect(target);
}
