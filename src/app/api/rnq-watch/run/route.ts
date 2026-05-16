import { NextResponse } from "next/server";
import { runRnqWatch } from "@/server/rnq-watch";

function getCronSecret() {
  return process.env.CRON_SECRET || process.env.RNQ_WATCH_CRON_SECRET || "";
}

async function handle(request: Request) {
  const secret = getCronSecret();
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET ou RNQ_WATCH_CRON_SECRET non configure." }, { status: 400 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }
  const result = await runRnqWatch();
  return NextResponse.json({ changed: result.changed, notified: result.notified, eventId: result.event.id });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
