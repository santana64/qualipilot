import { NextResponse } from "next/server";
import { sendDueReminders } from "@/server/reminders";

function getCronSecret() {
  return process.env.CRON_SECRET || process.env.REMINDER_CRON_SECRET || "";
}

async function runReminders(request: Request) {
  const secret = getCronSecret();
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET ou REMINDER_CRON_SECRET non configure." }, { status: 400 });
  }

  const authorization = request.headers.get("authorization");
  if (authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  const result = await sendDueReminders();
  return NextResponse.json(result);
}

export async function GET(request: Request) {
  return runReminders(request);
}

export async function POST(request: Request) {
  return runReminders(request);
}
