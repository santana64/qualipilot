import { NextResponse } from "next/server";
import { sendDueReminders } from "@/server/reminders";

export async function POST(request: Request) {
  const secret = process.env.REMINDER_CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "REMINDER_CRON_SECRET non configuré." }, { status: 400 });
  }
  const authorization = request.headers.get("authorization");
  if (authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const result = await sendDueReminders();
  return NextResponse.json(result);
}
