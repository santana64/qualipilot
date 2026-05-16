import { formatFrenchDate, formatPercent } from "@/domain/formatting";

export const QUALIPILOT_DISCLAIMER =
  "QualiPilot est un outil d'aide à l'organisation documentaire et au pilotage qualité. Il ne remplace pas le guide officiel du Référentiel National Qualité, un organisme certificateur, un consultant qualité ou un conseil juridique personnalisé. L'utilisation de QualiPilot ne garantit pas l'obtention ou le maintien de la certification Qualiopi.";

export type DocumentInput = {
  organization: {
    organizationName: string;
    address?: string | null;
    postalCode?: string | null;
    city?: string | null;
    contactPerson?: string | null;
    email?: string | null;
    phone?: string | null;
    defaultSignature?: string | null;
    documentFooterText?: string | null;
  };
  activeClient?: { organizationName: string } | null;
  date?: Date;
  trainingProgram?: {
    title: string;
    publicTarget?: string | null;
    prerequisites?: string | null;
    objectives?: string | null;
    duration?: string | null;
    accessDelay?: string | null;
    priceCents?: number | null;
    modalities?: string | null;
    teachingMethods?: string | null;
    evaluationMethods?: string | null;
    accessibilityInfo?: string | null;
    contactInfo?: string | null;
    resultIndicators?: string | null;
  } | null;
  trainingPrograms?: Array<{
    title: string;
    publicTarget?: string | null;
    objectives?: string | null;
    duration?: string | null;
    modalities?: string | null;
  }>;
  audit?: {
    type?: string;
    scheduledDate?: Date | string | null;
    readinessScore?: number;
  } | null;
  criterionScores?: Array<{ number: number; title: string; score: number; readyCount: number; totalCount: number }>;
  indicators?: Array<{
    number: number;
    criterionNumber?: number;
    title: string;
    status?: string;
    score?: number | null;
    riskLevel?: string;
    evidenceCount?: number;
    actionCount?: number;
  }>;
  evidences?: Array<{
    title: string;
    type?: string;
    status?: string;
    validityDate?: Date | string | null;
    responsible?: string | null;
    indicators?: number[];
  }>;
  actions?: Array<{
    title: string;
    status?: string;
    priority?: string;
    dueDate?: Date | string | null;
    responsible?: string | null;
    indicatorNumber?: number | null;
  }>;
  documents?: Array<{ title: string; type?: string; createdAt?: Date | string | null }>;
  missingPoints?: string[];
};

export type GeneratedContent = {
  title: string;
  contentHtml: string;
  contentText: string;
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function p(value: unknown) {
  return `<p>${escapeHtml(value)}</p>`;
}

function list(items: unknown[]) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function table(headers: string[], rows: unknown[][]) {
  return [
    "<table>",
    `<thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>`,
    `<tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody>`,
    "</table>",
  ].join("");
}

function orgBlock(input: DocumentInput) {
  const org = input.organization;
  return [
    "<section>",
    "<h2>Identification de l'organisme</h2>",
    table(["Information", "Valeur"], [
      ["Organisme", org.organizationName],
      ["Adresse", [org.address, org.postalCode, org.city].filter(Boolean).join(" ") || "Non renseigné"],
      ["Contact", org.contactPerson || "Non renseigné"],
      ["Email", org.email || "Non renseigné"],
      ["Téléphone", org.phone || "Non renseigné"],
    ]),
    "</section>",
  ].join("");
}

function qualityHeader(title: string, input: DocumentInput, sections: string[]): GeneratedContent {
  const org = input.organization;
  const date = input.date ?? new Date();
  const signature = org.defaultSignature ? `<section><h2>Validation interne</h2>${p(org.defaultSignature)}</section>` : "";
  const footer = org.documentFooterText ? `<p class="footer">${escapeHtml(org.documentFooterText)}</p>` : "";
  const html = [
    `<article class="document-print">`,
    `<h1>${escapeHtml(title)}</h1>`,
    `<p><strong>Date de génération :</strong> ${escapeHtml(formatFrenchDate(date))}</p>`,
    orgBlock(input),
    ...sections,
    signature,
    `<aside class="disclaimer">${escapeHtml(QUALIPILOT_DISCLAIMER)}</aside>`,
    footer,
    `</article>`,
  ].join("\n");
  return {
    title,
    contentHtml: html,
    contentText: [
      title,
      `Date de génération : ${formatFrenchDate(date)}`,
      `Organisme : ${org.organizationName}`,
      ...sections.map(stripHtml),
      org.defaultSignature ? `Validation interne : ${org.defaultSignature}` : "",
      QUALIPILOT_DISCLAIMER,
      org.documentFooterText ?? "",
    ].filter(Boolean).join("\n\n"),
  };
}

export function generateLearnerWelcomeProcedure(input: DocumentInput): GeneratedContent {
  return qualityHeader("Procédure d'accueil apprenant", input, [
    "<section><h2>Objet</h2>" +
      p("Organiser un accueil homogène des bénéficiaires, sécuriser leur entrée en formation et tracer les informations remises.") +
      "</section>",
    "<section><h2>Champ d'application</h2>" +
      p("Cette procédure s'applique à toutes les actions de formation, bilans ou accompagnements gérés par l'organisme, y compris les prestations réalisées à distance.") +
      "</section>",
    "<section><h2>Déroulement opérationnel</h2>" +
      list([
        "Vérifier l'inscription, les prérequis et les besoins particuliers avant le démarrage.",
        "Transmettre la convocation, le programme, les horaires, les modalités d'accès et les contacts utiles.",
        "Présenter le règlement intérieur, les modalités d'assiduité, d'assistance et de réclamation.",
        "Identifier les besoins d'adaptation, notamment en situation de handicap, et orienter vers le référent ou partenaire compétent.",
        "Conserver les preuves de transmission des informations et les traces d'échanges significatifs.",
      ]) +
      "</section>",
    "<section><h2>Responsabilités</h2>" +
      table(["Rôle", "Responsabilité"], [
        ["Responsable administratif", "Envoi des informations pratiques et conservation des traces."],
        ["Formateur", "Accueil pédagogique, rappel des objectifs et vérification des conditions de participation."],
        ["Référent qualité", "Contrôle périodique des preuves et traitement des écarts."],
      ]) +
      "</section>",
    "<section><h2>Preuves associées</h2>" +
      list(["Convocation ou email d'accueil", "Programme signé ou transmis", "Livret d'accueil", "Feuille d'émargement", "Trace de demande d'adaptation"]) +
      "</section>",
  ]);
}

export function generateAccessibilityProcedure(input: DocumentInput): GeneratedContent {
  return qualityHeader("Procédure handicap et accessibilité", input, [
    "<section><h2>Objet</h2>" + p("Identifier, analyser et traiter les besoins d'accessibilité des bénéficiaires afin de proposer des adaptations réalistes et tracées.") + "</section>",
    "<section><h2>Processus</h2>" +
      list([
        "Questionner les besoins d'accessibilité dès le premier contact ou l'entretien de positionnement.",
        "Évaluer la faisabilité de l'adaptation avec le bénéficiaire, le financeur si nécessaire et les partenaires compétents.",
        "Formaliser la décision : adaptation retenue, délai, responsable, limite éventuelle et élément de preuve.",
        "Informer le formateur uniquement des informations utiles à la bonne réalisation de la prestation.",
        "Réévaluer l'adaptation pendant le parcours et tracer tout ajustement.",
      ]) +
      "</section>",
    "<section><h2>Ressources mobilisables</h2>" +
      list(["Agefiph", "Cap Emploi", "MDPH", "référent handicap interne", "prestataire technique ou interprète", "adaptation des supports"]) +
      "</section>",
    "<section><h2>Points de contrôle RNQ</h2>" +
      table(["Point à vérifier", "Preuve attendue"], [
        ["Besoin identifié", "Questionnaire, entretien, email ou fiche d'analyse"],
        ["Décision d'adaptation", "Fiche adaptation ou compte rendu"],
        ["Partenaire mobilisé", "Email, annuaire, convention ou trace d'appel"],
        ["Suivi", "Bilan intermédiaire ou note de suivi"],
      ]) +
      "</section>",
  ]);
}

export function generateEvaluationProcedure(input: DocumentInput): GeneratedContent {
  return qualityHeader("Procédure d'évaluation des acquis", input, [
    "<section><h2>Objet</h2>" + p("Définir les modalités permettant de vérifier l'atteinte des objectifs opérationnels annoncés aux bénéficiaires.") + "</section>",
    "<section><h2>Règles qualité</h2>" +
      list([
        "Chaque objectif de formation doit être relié à une modalité d'évaluation.",
        "Les critères de réussite sont présentés ou accessibles au bénéficiaire.",
        "Les résultats sont conservés de façon exploitable.",
        "Les écarts significatifs alimentent le plan d'action ou l'amélioration du programme.",
      ]) +
      "</section>",
    "<section><h2>Modalités possibles</h2>" +
      table(["Moment", "Modalité", "Preuve"], [
        ["Entrée", "Positionnement ou auto-évaluation", "Grille de positionnement"],
        ["Pendant", "Exercice, mise en situation, observation", "Grille formateur"],
        ["Fin", "Quiz, cas pratique, entretien final", "Résultats et correction"],
        ["Après", "Questionnaire à froid si pertinent", "Synthèse satisfaction/résultats"],
      ]) +
      "</section>",
  ]);
}

export function generateTrainingProgramTemplate(input: DocumentInput): GeneratedContent {
  const program = input.trainingProgram;
  return qualityHeader(`Programme de formation - ${program?.title ?? "modèle"}`, input, [
    "<section><h2>Informations publiques</h2>" +
      table(["Champ", "Contenu"], [
        ["Intitulé", program?.title ?? "À compléter"],
        ["Public visé", program?.publicTarget ?? "À compléter"],
        ["Prérequis", program?.prerequisites ?? "À compléter ou indiquer : aucun"],
        ["Objectifs opérationnels", program?.objectives ?? "À formuler avec des verbes d'action évaluables"],
        ["Durée", program?.duration ?? "À compléter"],
        ["Délai d'accès", program?.accessDelay ?? "À compléter"],
        ["Modalités", program?.modalities ?? "À compléter"],
      ]) +
      "</section>",
    "<section><h2>Méthodes et évaluation</h2>" +
      table(["Champ", "Contenu"], [
        ["Méthodes pédagogiques", program?.teachingMethods ?? "À compléter"],
        ["Moyens techniques", "Salle, supports, outils numériques ou modalités distancielles à préciser"],
        ["Évaluation des acquis", program?.evaluationMethods ?? "À compléter"],
        ["Indicateurs de résultats", program?.resultIndicators ?? "À compléter selon données disponibles"],
      ]) +
      "</section>",
    "<section><h2>Accessibilité et contact</h2>" +
      p(program?.accessibilityInfo ?? "Les besoins d'adaptation sont étudiés avant l'entrée en formation. Information à valider selon la situation de l'organisme.") +
      p(`Contact : ${program?.contactInfo ?? input.organization.email ?? "À compléter"}`) +
      "</section>",
  ]);
}

export function generateSatisfactionQuestionnaire(input: DocumentInput): GeneratedContent {
  return qualityHeader("Questionnaire de satisfaction", input, [
    "<section><h2>Consigne</h2>" + p("Merci de répondre de façon sincère. Vos retours servent à améliorer nos prestations et peuvent alimenter le plan d'amélioration continue.") + "</section>",
    "<section><h2>Questions à chaud</h2>" +
      table(["Thème", "Question", "Réponse attendue"], [
        ["Objectifs", "Les objectifs étaient-ils clairs et atteints ?", "Note 1 à 5 + commentaire"],
        ["Contenu", "Le contenu était-il adapté à vos besoins ?", "Note 1 à 5 + commentaire"],
        ["Animation", "Les méthodes pédagogiques ont-elles facilité l'apprentissage ?", "Note 1 à 5 + commentaire"],
        ["Organisation", "Les informations pratiques et conditions matérielles étaient-elles satisfaisantes ?", "Note 1 à 5 + commentaire"],
        ["Accessibilité", "Les éventuels besoins d'adaptation ont-ils été pris en compte ?", "Oui / Non / Non concerné"],
        ["Amélioration", "Quelle amélioration prioritaire proposez-vous ?", "Texte libre"],
      ]) +
      "</section>",
    "<section><h2>Traitement qualité</h2>" + p("Les réponses sont consolidées, analysées et rattachées à une action corrective lorsque le niveau de satisfaction ou les commentaires le justifient.") + "</section>",
  ]);
}

export function generateAttendanceSheetTemplate(input: DocumentInput): GeneratedContent {
  return qualityHeader("Modèle de feuille d'émargement", input, [
    "<section><h2>Session</h2>" +
      table(["Champ", "Valeur"], [
        ["Formation", input.trainingProgram?.title ?? "À compléter"],
        ["Date", "À compléter"],
        ["Horaires", "À compléter"],
        ["Lieu ou modalité", input.trainingProgram?.modalities ?? "À compléter"],
        ["Formateur", "À compléter"],
      ]) +
      "</section>",
    "<section><h2>Émargement</h2>" +
      table(["Nom", "Prénom", "Matin", "Après-midi", "Signature"], [
        ["", "", "", "", ""],
        ["", "", "", "", ""],
        ["", "", "", "", ""],
        ["", "", "", "", ""],
        ["", "", "", "", ""],
      ]) +
      "</section>",
    "<section><h2>Contrôle</h2>" + p("Toute absence, retard ou incident d'assiduité doit être tracé et traité selon les règles internes de suivi des bénéficiaires.") + "</section>",
  ]);
}

export function generateContinuousImprovementPlan(input: DocumentInput): GeneratedContent {
  const actions = input.actions ?? [];
  return qualityHeader("Plan d'amélioration continue", input, [
    "<section><h2>Principe</h2>" + p("Le plan d'amélioration centralise les constats issus des audits, réclamations, satisfactions, veilles, incidents et revues internes.") + "</section>",
    "<section><h2>Actions en cours</h2>" +
      (actions.length
        ? table(["Action", "Statut", "Échéance"], actions.map((action) => [action.title, action.status ?? "À suivre", formatFrenchDate(action.dueDate)]))
        : p("Aucune action active renseignée. Créer au minimum les actions issues des derniers constats qualité.")) +
      "</section>",
    "<section><h2>Règle de suivi</h2>" +
      list([
        "Chaque action dispose d'un responsable et d'une échéance.",
        "La clôture doit être justifiée par une note ou une preuve associée.",
        "Les actions critiques sont revues avant toute préparation d'audit.",
      ]) +
      "</section>",
  ]);
}

export function generateComplaintManagementProcedure(input: DocumentInput): GeneratedContent {
  return qualityHeader("Procédure de gestion des réclamations", input, [
    "<section><h2>Objet</h2>" + p("Recevoir, qualifier, traiter et tracer les réclamations, difficultés ou incidents liés aux prestations.") + "</section>",
    "<section><h2>Canaux de réception</h2>" + list(["Email de contact", "Formulaire ou questionnaire", "Entretien oral retranscrit", "Message financeur ou entreprise", "Retour formateur"]) + "</section>",
    "<section><h2>Traitement</h2>" +
      table(["Étape", "Délai cible", "Trace attendue"], [
        ["Enregistrement", "Sous 2 jours ouvrés", "Registre réclamation"],
        ["Accusé réception", "Sous 5 jours ouvrés si pertinent", "Email ou compte rendu"],
        ["Analyse", "Selon criticité", "Cause, impact, pièces jointes"],
        ["Décision", "Avant clôture", "Réponse, correction, action qualité"],
        ["Clôture", "Après vérification", "Note de clôture et preuve"],
      ]) +
      "</section>",
  ]);
}

export function generateAuditSummary(input: DocumentInput): GeneratedContent {
  const score = input.audit?.readinessScore ?? 0;
  const missing = input.missingPoints ?? [];
  return qualityHeader("Synthèse préparatoire audit", input, [
    "<section><h2>Contexte audit</h2>" +
      table(["Champ", "Valeur"], [
        ["Type", input.audit?.type ?? "À préciser"],
        ["Date prévue", formatFrenchDate(input.audit?.scheduledDate)],
        ["Niveau de préparation", formatPercent(score)],
      ]) +
      "</section>",
    "<section><h2>Points à vérifier en priorité</h2>" +
      (missing.length ? list(missing) : p("Aucun point bloquant majeur identifié dans les données saisies.")) +
      "</section>",
    "<section><h2>Lecture conseillée</h2>" + p("Cette synthèse est un dossier préparatoire. Les exigences applicables restent à valider selon votre situation, le guide RNQ en vigueur et les demandes de votre certificateur.") + "</section>",
  ]);
}

export function generateFullAuditFile(input: DocumentInput): GeneratedContent {
  const indicators = input.indicators ?? [];
  const evidences = input.evidences ?? [];
  const actions = input.actions ?? [];
  const criterionScores = input.criterionScores ?? [];
  const documents = input.documents ?? [];
  const trainingPrograms = input.trainingPrograms ?? (input.trainingProgram ? [input.trainingProgram] : []);
  const criticalIndicators = indicators.filter((indicator) => indicator.riskLevel === "CRITICAL" && !["READY", "VALIDATED", "NOT_APPLICABLE"].includes(indicator.status ?? ""));
  const expiredEvidences = evidences.filter((evidence) => evidence.status === "EXPIRED");
  const actionsLateOrCritical = actions.filter((action) => action.priority === "CRITICAL" || action.status !== "DONE");
  return qualityHeader("Dossier préparatoire audit complet", input, [
    "<section><h2>Résumé exécutif</h2>" +
      table(["Indicateur", "Valeur"], [
        ["Périmètre", input.activeClient ? `Client cabinet - ${input.activeClient.organizationName}` : "Organisme principal"],
        ["Niveau de préparation", formatPercent(input.audit?.readinessScore ?? 0)],
        ["Date audit", formatFrenchDate(input.audit?.scheduledDate)],
        ["Type audit", input.audit?.type ?? "À préciser"],
        ["Indicateurs suivis", indicators.length],
        ["Preuves référencées", evidences.length],
        ["Actions actives ou historisées", actions.length],
        ["Points manquants", input.missingPoints?.length ?? 0],
      ]) +
      "</section>",
    "<section><h2>Méthode de lecture du dossier</h2>" +
      list([
        "Les scores indiquent un niveau de préparation interne et ne constituent pas une validation officielle.",
        "Chaque indicateur doit être relu avec le guide RNQ applicable et les attentes du certificateur.",
        "Les preuves listées sont les éléments disponibles dans QualiPilot au jour de génération.",
        "Les points manquants doivent être arbitrés avant l'audit ou documentés comme réserves internes.",
      ]) +
      "</section>",
    "<section><h2>Synthèse par critère RNQ</h2>" +
      (criterionScores.length
        ? table(["Critère", "Intitulé", "Score", "Indicateurs prêts"], criterionScores.map((criterion) => [`Critère ${criterion.number}`, criterion.title, formatPercent(criterion.score), `${criterion.readyCount}/${criterion.totalCount}`]))
        : p("Aucune synthèse par critère disponible.")) +
      "</section>",
    "<section><h2>Indicateurs critiques à traiter</h2>" +
      (criticalIndicators.length
        ? table(["Numéro", "Critère", "Indicateur", "Statut", "Preuves"], criticalIndicators.map((indicator) => [indicator.number, indicator.criterionNumber ?? "?", indicator.title, indicator.status ?? "Non renseigné", indicator.evidenceCount ?? 0]))
        : p("Aucun indicateur critique incomplet identifié dans les données disponibles.")) +
      "</section>",
    "<section><h2>Indicateurs RNQ</h2>" +
      (indicators.length
        ? table(["Numéro", "Critère", "Risque", "Indicateur", "Statut", "Score", "Preuves", "Actions ouvertes"], indicators.map((indicator) => [indicator.number, indicator.criterionNumber ?? "?", indicator.riskLevel ?? "Non renseigné", indicator.title, indicator.status ?? "Non renseigné", `${indicator.score ?? 0} %`, indicator.evidenceCount ?? 0, indicator.actionCount ?? 0]))
        : p("Aucun indicateur disponible.")) +
      "</section>",
    "<section><h2>Registre des preuves associées</h2>" +
      (evidences.length
        ? table(["Preuve", "Type", "Statut", "Validité", "Responsable", "Indicateurs"], evidences.map((evidence) => [evidence.title, evidence.type ?? "Non renseigné", evidence.status ?? "Non renseigné", formatFrenchDate(evidence.validityDate), evidence.responsible ?? "Non renseigné", evidence.indicators?.join(", ") || "À associer"]))
        : p("Aucune preuve renseignée.")) +
      "</section>",
    "<section><h2>Preuves expirées ou à revoir</h2>" +
      (expiredEvidences.length
        ? table(["Preuve", "Type", "Validité", "Indicateurs"], expiredEvidences.map((evidence) => [evidence.title, evidence.type ?? "Non renseigné", formatFrenchDate(evidence.validityDate), evidence.indicators?.join(", ") || "À associer"]))
        : p("Aucune preuve expirée identifiée dans les données disponibles.")) +
      "</section>",
    "<section><h2>Programmes de formation</h2>" +
      (trainingPrograms.length
        ? table(["Formation", "Public", "Objectifs", "Durée", "Modalités"], trainingPrograms.map((program) => [program.title, program.publicTarget ?? "Non renseigné", program.objectives ?? "Non renseigné", program.duration ?? "Non renseigné", program.modalities ?? "Non renseigné"]))
        : p("Aucune formation renseignée.")) +
      "</section>",
    "<section><h2>Plan d'action qualité</h2>" +
      (actionsLateOrCritical.length
        ? table(["Action", "Priorité", "Statut", "Échéance", "Responsable", "Indicateur"], actionsLateOrCritical.map((action) => [action.title, action.priority ?? "Non renseigné", action.status ?? "À suivre", formatFrenchDate(action.dueDate), action.responsible ?? "Non renseigné", action.indicatorNumber ?? "Non lié"]))
        : p("Aucune action active renseignée.")) +
      "</section>",
    "<section><h2>Documents qualité générés</h2>" +
      (documents.length
        ? table(["Document", "Type", "Génération"], documents.map((document) => [document.title, document.type ?? "Non renseigné", formatFrenchDate(document.createdAt)]))
        : p("Aucun document généré référencé dans ce dossier.")) +
      "</section>",
    "<section><h2>Points manquants et réserves</h2>" +
      (input.missingPoints?.length ? list(input.missingPoints) : p("Aucun point manquant identifié dans les données disponibles.")) +
      "</section>",
    "<section><h2>Plan de revue avant audit</h2>" +
      table(["Contrôle", "Action attendue"], [
        ["Preuves critiques", "Vérifier que chaque indicateur critique dispose d'un élément de preuve exploitable."],
        ["Documents qualité", "Relire les procédures générées, les adapter à la pratique réelle et les valider en interne."],
        ["Formations", "Comparer les informations publiques, les programmes transmis et les preuves conservées."],
        ["Actions", "Clôturer ou justifier les actions en retard avant l'entretien d'audit."],
        ["Traçabilité", "Conserver une version datée de ce dossier et des preuves principales."],
      ]) +
      "</section>",
  ]);
}
