import Link from "next/link";
import { PrintButton } from "@/components/print-button";
import { Badge, PageHeader } from "@/components/ui";
import { QUALIPILOT_DISCLAIMER } from "@/domain/documents/templates";
import { formatFrenchDate, formatPercent } from "@/domain/formatting";
import { canExportAuditFile } from "@/domain/billing/plans";
import { actionPriorityLabels, actionStatusLabels, auditTypeLabels, evidenceTypeLabels, indicatorStatusLabels, qualiopiStatusLabels } from "@/lib/labels";
import { getWorkspaceData } from "@/server/app-data";
import { getUserPlan } from "@/server/billing";
import { getWorkspaceContext } from "@/server/rbac";

export default async function AuditExportPage() {
  const workspace = await getWorkspaceContext();
  const [data, plan] = await Promise.all([getWorkspaceData(workspace.workspaceUserId), getUserPlan(workspace.workspaceUserId)]);
  if (!canExportAuditFile(plan)) {
    return (
      <main className="grid gap-6">
        <PageHeader title="Export dossier audit" description="Votre offre actuelle ne permet pas cette action." />
        <div className="rounded-md border border-amber-200 bg-amber-50 p-5 text-amber-900">
          Votre offre actuelle ne permet pas l'export complet. Passez sur Starter, Pro ou Cabinet pour activer ce dossier préparatoire.
        </div>
        <Link className="font-semibold text-sky-700" href="/app/billing">Voir les offres</Link>
      </main>
    );
  }

  return (
    <main className="grid gap-6">
      <div className="no-print">
        <PageHeader
          title="Dossier préparatoire audit"
          description="Page imprimable structurée pour préparer l'échange avec votre certificateur."
          action={
            <div className="flex gap-3">
              <PrintButton />
              <Link className="inline-flex min-h-10 items-center rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white" href="/app/audit/export/pdf">
                Télécharger PDF
              </Link>
            </div>
          }
        />
      </div>

      <article className="document-print print-surface rounded-md border border-slate-200 bg-white p-8 shadow-sm">
        <h1>Dossier préparatoire audit Qualiopi</h1>
        <section>
          <h2>Profil organisme</h2>
          <p><strong>Organisme :</strong> {data.organization?.organizationName ?? "Profil organisme incomplet."}</p>
          <p><strong>Adresse :</strong> {[data.organization?.address, data.organization?.postalCode, data.organization?.city].filter(Boolean).join(" ") || "Non renseigné"}</p>
          <p><strong>Contact :</strong> {data.organization?.contactPerson ?? workspace.actorName ?? "Non renseigné"} - {data.organization?.email ?? workspace.actorEmail}</p>
          <p><strong>Statut Qualiopi :</strong> {qualiopiStatusLabels[data.organization?.qualiopiStatus ?? "NOT_CERTIFIED"]}</p>
          <p><strong>Prochaine échéance :</strong> {formatFrenchDate(data.latestAudit?.scheduledDate ?? data.organization?.nextAuditDate)}</p>
        </section>

        <section>
          <h2>Contexte audit</h2>
          <p><strong>Type :</strong> {auditTypeLabels[data.latestAudit?.type ?? "INITIAL"]}</p>
          <p><strong>Certificateur :</strong> {data.latestAudit?.certifierName ?? data.organization?.certifierName ?? "Non renseigné"}</p>
          <p><strong>Notes :</strong> {data.latestAudit?.notes ?? "Aucune note."}</p>
        </section>

        <section>
          <h2>Synthèse de préparation</h2>
          <p><strong>Niveau global :</strong> {formatPercent(data.globalReadinessScore)}</p>
          <p><strong>Indicateurs prêts :</strong> {data.indicatorsReady}</p>
          <p><strong>Indicateurs incomplets :</strong> {data.indicatorsIncomplete}</p>
          <p><strong>Preuves manquantes :</strong> {data.missingEvidence.length}</p>
          <p><strong>Actions en retard :</strong> {data.overdueActions.length}</p>
        </section>

        <section>
          <h2>Résumé par critère</h2>
          <table>
            <thead><tr><th>Critère</th><th>Titre</th><th>Score</th></tr></thead>
            <tbody>
              {data.criterionScores.map(({ criterion, score }) => (
                <tr key={criterion.id}><td>{criterion.number}</td><td>{criterion.title}</td><td>{formatPercent(score)}</td></tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2>Indicateurs et statuts</h2>
          <table>
            <thead><tr><th>N°</th><th>Indicateur</th><th>Statut</th><th>Preuves</th></tr></thead>
            <tbody>
              {data.indicatorRows.map((indicator) => (
                <tr key={indicator.id}>
                  <td>{indicator.number}</td>
                  <td>{indicator.title}</td>
                  <td>{indicatorStatusLabels[indicator.status]}</td>
                  <td>{indicator.evidenceCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2>Preuves</h2>
          <ul>
            {data.evidences.map((evidence) => (
              <li key={evidence.id}>
                {evidence.title} - {evidenceTypeLabels[evidence.type]} - indicateurs {evidence.indicatorLinks.map((link) => link.indicator.number).join(", ") || "à associer"}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2>Programmes de formation</h2>
          <ul>
            {data.trainingCompleteness.map(({ program, completeness }) => (
              <li key={program.id}>{program.title} - complétude {formatPercent(completeness.score)} - manque {completeness.missingFields.join(", ") || "rien à signaler"}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2>Plan d'action</h2>
          <ul>
            {data.actions.map((action) => (
              <li key={action.id}>{action.title} - {actionStatusLabels[action.status]} - {actionPriorityLabels[action.priority]} - échéance {formatFrenchDate(action.dueDate)}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2>Documents générés</h2>
          <ul>
            {data.documents.map((document) => <li key={document.id}>{document.title} - {formatFrenchDate(document.createdAt)}</li>)}
          </ul>
        </section>

        <section>
          <h2>Points manquants</h2>
          <div className="no-print mb-3 flex flex-wrap gap-2">
            {data.auditExportReadiness.blockers.map((blocker) => <Badge key={blocker} tone="amber">{blocker}</Badge>)}
          </div>
          <ul>
            {data.missingEvidence.map((indicator) => <li key={indicator.id}>Indicateur {indicator.number} : preuve associée à vérifier.</li>)}
            {data.expiredEvidence.map((evidence) => <li key={evidence.id}>Preuve expirée : {evidence.title}.</li>)}
            {data.overdueActions.map((action) => <li key={action.id}>Action en retard : {action.title}.</li>)}
          </ul>
        </section>

        <aside className="disclaimer">{QUALIPILOT_DISCLAIMER}</aside>
      </article>
    </main>
  );
}
