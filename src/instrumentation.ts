export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.ENABLE_INTERNAL_REMINDER_WORKER !== "true") return;

  const globalState = globalThis as typeof globalThis & {
    __qualipilotReminderWorkerStarted?: boolean;
  };

  if (globalState.__qualipilotReminderWorkerStarted) return;
  globalState.__qualipilotReminderWorkerStarted = true;

  const { sendDueReminders } = await import("@/server/reminders");

  const run = () => {
    sendDueReminders().catch((error) => {
      console.error("[QualiPilot reminders]", error);
    });
  };

  run();
  const timer = setInterval(run, 15 * 60 * 1000);
  timer.unref?.();
}
