import { prisma } from "@/lib/db";
import { verifyReminderUnsubscribeToken } from "@/lib/unsubscribe";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const userId = verifyReminderUnsubscribeToken(token);

  if (!userId) {
    return new Response("Lien de desinscription invalide ou expire.", { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { reminderEmailsUnsubscribedAt: new Date() },
  });

  await prisma.emailReminder.updateMany({
    where: { userId, status: "ACTIVE" },
    data: { status: "CANCELLED", lastError: "Utilisateur desinscrit des rappels email." },
  });

  return new Response(
    `<main style="font-family:system-ui;padding:40px;max-width:680px;margin:auto"><h1>Desinscription confirmee</h1><p>Vous ne recevrez plus les rappels email QualiPilot. Les alertes restent consultables dans votre espace.</p><p><a href="/">Retour a QualiPilot</a></p></main>`,
    {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    },
  );
}

export async function POST(request: Request) {
  return GET(request);
}
