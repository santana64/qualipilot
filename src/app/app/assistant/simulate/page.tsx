import { ShieldCheck } from "lucide-react";
import { Badge, Disclaimer, Field, Notice, PageHeader, ProgressBar, SectionCard, SubmitButton, inputClass, textareaClass } from "@/components/ui";
import { QUALIPILOT_DISCLAIMER } from "@/domain/documents/templates";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { createAuditSimulationSessionAction, answerAuditSimulationQuestionAction, finalizeAuditSimulationSessionAction } from "@/server/actions/intelligence";
import { getWorkspaceContext } from "@/server/rbac";

function verdictTone(verdict?: string | null): "green" | "amber" | "red" | "blue" | "slate" {
  if (verdict === "READY") return "green";
  if (verdict === "WARNING") return "amber";
  if (verdict === "AT_RISK" || verdict === "CRITICAL") return "red";
  return "slate";
}

function verdictLabel(verdict?: string | null) {
  const labels: Record<string, string> = {
    READY: "Pret",
    WARNING: "A surveiller",
    AT_RISK: "A risque",
    CRITICAL: "Critique",
  };
  return verdict ? labels[verdict] ?? verdict : "Non evalue";
}

export default async function AuditSimulationPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUser();
  const workspace = await getWorkspaceContext();
  const params = (await searchParams) ?? {};
  const sessionId = typeof params.sessionId === "string" ? params.sessionId : "";
  const [clients, sessions] = await Promise.all([
    prisma.cabinetClient.findMany({
      where: { userId: workspace.workspaceUserId, status: "ACTIVE" },
      orderBy: { organizationName: "asc" },
    }),
    prisma.aiAuditSession.findMany({
      where: { userId: workspace.workspaceUserId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        client: true,
        answers: {
          orderBy: { createdAt: "asc" },
          include: { indicator: { include: { criterion: true } } },
        },
      },
    }),
  ]);
  const selectedSession = sessions.find((session) => session.id === sessionId) ?? sessions[0] ?? null;

  return (
    <main className="grid gap-8">
      <PageHeader
        title="Simulateur d'audit IA"
        description="Repetez un audit Qualiopi avant le vrai : questions auditeur, evaluation par indicateur, rapport de lacunes."
      />
      <Notice message={params.error} type="error" />
      <Notice message={params.success} type="success" />

      <section className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <SectionCard>
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 text-accent" />
            <div>
              <h2 className="font-bold text-foreground">Nouvelle simulation</h2>
              <p className="mt-1 text-sm leading-6 text-foreground-muted">
                QualiPilot choisit les indicateurs les plus sensibles puis l'IA evalue vos reponses comme un auditeur preparatoire.
              </p>
            </div>
          </div>
          <form action={createAuditSimulationSessionAction} className="mt-5 grid gap-4">
            <Field label="Persona auditeur">
              <select className={inputClass} name="certifierPersona" defaultValue="Auditeur Qualiopi AFNOR">
                <option>Auditeur Qualiopi AFNOR</option>
                <option>Auditeur Qualiopi Bureau Veritas</option>
                <option>Auditeur Qualiopi ICPF</option>
                <option>Auditeur Qualiopi interne</option>
              </select>
            </Field>
            {clients.length > 0 ? (
              <Field label="Client cabinet">
                <select className={inputClass} name="clientId" defaultValue="">
                  <option value="">Organisme principal</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.organizationName}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
            <SubmitButton>Lancer la simulation</SubmitButton>
          </form>

          {sessions.length > 0 ? (
            <div className="mt-6 border-t border-border pt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">Sessions recentes</p>
              <div className="mt-3 grid gap-2">
                {sessions.map((session) => (
                  <a
                    key={session.id}
                    href={`/app/assistant/simulate?sessionId=${session.id}`}
                    className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-surface-subtle"
                  >
                    {session.title}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </SectionCard>

        <section className="grid gap-4">
          {!selectedSession ? (
            <SectionCard>
              <p className="text-sm text-foreground-muted">Aucune simulation lancee pour le moment.</p>
            </SectionCard>
          ) : (
            <>
              <SectionCard>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-foreground">{selectedSession.title}</h2>
                    <p className="mt-1 text-sm text-foreground-muted">
                      {selectedSession.certifierPersona} - {selectedSession.answers.length} indicateur(s) simules
                    </p>
                  </div>
                  <Badge tone={verdictTone(selectedSession.verdict)}>
                    {verdictLabel(selectedSession.verdict)} - {selectedSession.globalScore} %
                  </Badge>
                </div>
                <div className="mt-4">
                  <ProgressBar value={selectedSession.globalScore} />
                </div>
                <form action={finalizeAuditSimulationSessionAction} className="mt-5">
                  <input type="hidden" name="sessionId" value={selectedSession.id} />
                  <SubmitButton variant="accent">Generer le rapport de simulation</SubmitButton>
                </form>
              </SectionCard>

              {selectedSession.reportText ? (
                <SectionCard>
                  <h2 className="font-bold text-foreground">Rapport de simulation</h2>
                  <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-surface-subtle p-4 text-sm leading-6 text-foreground-muted">
                    {selectedSession.reportText}
                  </pre>
                </SectionCard>
              ) : null}

              {selectedSession.answers.map((answer) => (
                <SectionCard key={answer.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-foreground-faint">
                        Critere {answer.indicator.criterion.number} - Indicateur {answer.indicator.number}
                      </p>
                      <h3 className="mt-1 font-bold text-foreground">{answer.indicator.title}</h3>
                    </div>
                    <Badge tone={verdictTone(answer.verdict)}>
                      {answer.evaluationScore ?? "-"} % - {verdictLabel(answer.verdict)}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-foreground-muted">{answer.question}</p>
                  <form action={answerAuditSimulationQuestionAction} className="mt-4 grid gap-3">
                    <input type="hidden" name="sessionId" value={selectedSession.id} />
                    <input type="hidden" name="answerId" value={answer.id} />
                    <Field label="Votre reponse auditee">
                      <textarea
                        className={textareaClass}
                        name="answerText"
                        defaultValue={answer.answerText ?? ""}
                        placeholder="Expliquez votre pratique, les preuves disponibles, le responsable, les dates et comment vous appliquez la procedure."
                      />
                    </Field>
                    <SubmitButton size="sm">Evaluer cette reponse</SubmitButton>
                  </form>
                  {answer.gaps.length > 0 || answer.recommendations.length > 0 ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg border border-rose-100 bg-rose-50 p-3">
                        <p className="text-sm font-bold text-rose-950">Lacunes</p>
                        <ul className="mt-2 list-disc pl-5 text-sm leading-6 text-rose-800">
                          {answer.gaps.map((gap) => <li key={gap}>{gap}</li>)}
                        </ul>
                      </div>
                      <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                        <p className="text-sm font-bold text-emerald-950">Actions conseillees</p>
                        <ul className="mt-2 list-disc pl-5 text-sm leading-6 text-emerald-800">
                          {answer.recommendations.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                      </div>
                    </div>
                  ) : null}
                </SectionCard>
              ))}
            </>
          )}
        </section>
      </section>

      <Disclaimer>{QUALIPILOT_DISCLAIMER}</Disclaimer>
    </main>
  );
}
