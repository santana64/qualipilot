import { formatFrenchDate, formatPercent } from "@/domain/formatting";

export const QUALIPILOT_DISCLAIMER =
  "QualiPilot est un outil d'aide a l'organisation documentaire et au pilotage qualite. Il ne remplace pas le guide officiel du Referentiel National Qualite, un organisme certificateur, un consultant qualite ou un conseil juridique personnalise. L'utilisation de QualiPilot ne garantit pas l'obtention ou le maintien de la certification Qualiopi.";

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
      ["Adresse", [org.address, org.postalCode, org.city].filter(Boolean).join(" ") || "Non renseigne"],
      ["Contact", org.contactPerson || "Non renseigne"],
      ["Email", org.email || "Non renseigne"],
      ["Telephone", org.phone || "Non renseigne"],
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
    `<p><strong>Date de generation :</strong> ${escapeHtml(formatFrenchDate(date))}</p>`,
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
      `Date de generation : ${formatFrenchDate(date)}`,
      `Organisme : ${org.organizationName}`,
      ...sections.map(stripHtml),
      org.defaultSignature ? `Validation interne : ${org.defaultSignature}` : "",
      QUALIPILOT_DISCLAIMER,
      org.documentFooterText ?? "",
    ].filter(Boolean).join("\n\n"),
  };
}

export function generateLearnerWelcomeProcedure(input: DocumentInput): GeneratedContent {
  return qualityHeader("Procedure d'accueil apprenant", input, [
    "<section><h2>Objet</h2>" +
      p("Organiser un accueil homogene des beneficiaires, securiser leur entree en formation et tracer les informations remises.") +
      "</section>",
    "<section><h2>Champ d'application</h2>" +
      p("Cette procedure s'applique a toutes les actions de formation, bilans ou accompagnements geres par l'organisme, y compris les prestations realisees a distance.") +
      "</section>",
    "<section><h2>Deroulement operationnel</h2>" +
      list([
        "Verifier l'inscription, les pre-requis et les besoins particuliers avant le demarrage.",
        "Transmettre la convocation, le programme, les horaires, les modalites d'acces et les contacts utiles.",
        "Presenter le reglement interieur, les modalites d'assiduite, d'assistance et de reclamation.",
        "Identifier les besoins d'adaptation, notamment en situation de handicap, et orienter vers le referent ou partenaire competent.",
        "Conserver les preuves de transmission des informations et les traces d'echanges significatifs.",
      ]) +
      "</section>",
    "<section><h2>Responsabilites</h2>" +
      table(["Role", "Responsabilite"], [
        ["Responsable administratif", "Envoi des informations pratiques et conservation des traces."],
        ["Formateur", "Accueil pedagogique, rappel des objectifs et verification des conditions de participation."],
        ["Referent qualite", "Controle periodique des preuves et traitement des ecarts."],
      ]) +
      "</section>",
    "<section><h2>Preuves associees</h2>" +
      list(["Convocation ou email d'accueil", "Programme signe ou transmis", "Livret d'accueil", "Feuille d'emargement", "Trace de demande d'adaptation"]) +
      "</section>",
  ]);
}

export function generateAccessibilityProcedure(input: DocumentInput): GeneratedContent {
  return qualityHeader("Procedure handicap et accessibilite", input, [
    "<section><h2>Objet</h2>" + p("Identifier, analyser et traiter les besoins d'accessibilite des beneficiaires afin de proposer des adaptations realistes et tracees.") + "</section>",
    "<section><h2>Processus</h2>" +
      list([
        "Questionner les besoins d'accessibilite des le premier contact ou l'entretien de positionnement.",
        "Evaluer la faisabilite de l'adaptation avec le beneficiaire, le financeur si necessaire et les partenaires competents.",
        "Formaliser la decision : adaptation retenue, delai, responsable, limite eventuelle et element de preuve.",
        "Informer le formateur uniquement des informations utiles a la bonne realisation de la prestation.",
        "Reevaluer l'adaptation pendant le parcours et tracer tout ajustement.",
      ]) +
      "</section>",
    "<section><h2>Ressources mobilisables</h2>" +
      list(["Agefiph", "Cap Emploi", "MDPH", "referent handicap interne", "prestataire technique ou interprete", "adaptation des supports"]) +
      "</section>",
    "<section><h2>Points de controle RNQ</h2>" +
      table(["Point a verifier", "Preuve attendue"], [
        ["Besoin identifie", "Questionnaire, entretien, email ou fiche d'analyse"],
        ["Decision d'adaptation", "Fiche adaptation ou compte rendu"],
        ["Partenaire mobilise", "Email, annuaire, convention ou trace d'appel"],
        ["Suivi", "Bilan intermediaire ou note de suivi"],
      ]) +
      "</section>",
  ]);
}

export function generateEvaluationProcedure(input: DocumentInput): GeneratedContent {
  return qualityHeader("Procedure d'evaluation des acquis", input, [
    "<section><h2>Objet</h2>" + p("Definir les modalites permettant de verifier l'atteinte des objectifs operationnels annonces aux beneficiaires.") + "</section>",
    "<section><h2>Regles qualite</h2>" +
      list([
        "Chaque objectif de formation doit etre relie a une modalite d'evaluation.",
        "Les criteres de reussite sont presentes ou accessibles au beneficiaire.",
        "Les resultats sont conserves de facon exploitable.",
        "Les ecarts significatifs alimentent le plan d'action ou l'amelioration du programme.",
      ]) +
      "</section>",
    "<section><h2>Modalites possibles</h2>" +
      table(["Moment", "Modalite", "Preuve"], [
        ["Entree", "Positionnement ou auto-evaluation", "Grille de positionnement"],
        ["Pendant", "Exercice, mise en situation, observation", "Grille formateur"],
        ["Fin", "Quiz, cas pratique, entretien final", "Resultats et correction"],
        ["Apres", "Questionnaire a froid si pertinent", "Synthese satisfaction/resultats"],
      ]) +
      "</section>",
  ]);
}

export function generateTrainingProgramTemplate(input: DocumentInput): GeneratedContent {
  const program = input.trainingProgram;
  return qualityHeader(`Programme de formation - ${program?.title ?? "modele"}`, input, [
    "<section><h2>Informations publiques</h2>" +
      table(["Champ", "Contenu"], [
        ["Intitule", program?.title ?? "A completer"],
        ["Public vise", program?.publicTarget ?? "A completer"],
        ["Pre-requis", program?.prerequisites ?? "A completer ou indiquer aucun"],
        ["Objectifs operationnels", program?.objectives ?? "A formuler avec des verbes d'action evaluables"],
        ["Duree", program?.duration ?? "A completer"],
        ["Delai d'acces", program?.accessDelay ?? "A completer"],
        ["Modalites", program?.modalities ?? "A completer"],
      ]) +
      "</section>",
    "<section><h2>Methodes et evaluation</h2>" +
      table(["Champ", "Contenu"], [
        ["Methodes pedagogiques", program?.teachingMethods ?? "A completer"],
        ["Moyens techniques", "Salle, supports, outils numeriques ou modalites distancielles a preciser"],
        ["Evaluation des acquis", program?.evaluationMethods ?? "A completer"],
        ["Indicateurs de resultats", program?.resultIndicators ?? "A completer selon donnees disponibles"],
      ]) +
      "</section>",
    "<section><h2>Accessibilite et contact</h2>" +
      p(program?.accessibilityInfo ?? "Les besoins d'adaptation sont etudies avant l'entree en formation. Information a valider selon la situation de l'organisme.") +
      p(`Contact : ${program?.contactInfo ?? input.organization.email ?? "A completer"}`) +
      "</section>",
  ]);
}

export function generateSatisfactionQuestionnaire(input: DocumentInput): GeneratedContent {
  return qualityHeader("Questionnaire de satisfaction", input, [
    "<section><h2>Consigne</h2>" + p("Merci de repondre de facon sincere. Vos retours servent a ameliorer nos prestations et peuvent alimenter le plan d'amelioration continue.") + "</section>",
    "<section><h2>Questions a chaud</h2>" +
      table(["Theme", "Question", "Reponse attendue"], [
        ["Objectifs", "Les objectifs etaient-ils clairs et atteints ?", "Note 1 a 5 + commentaire"],
        ["Contenu", "Le contenu etait-il adapte a vos besoins ?", "Note 1 a 5 + commentaire"],
        ["Animation", "Les methodes pedagogiques ont-elles facilite l'apprentissage ?", "Note 1 a 5 + commentaire"],
        ["Organisation", "Les informations pratiques et conditions materielles etaient-elles satisfaisantes ?", "Note 1 a 5 + commentaire"],
        ["Accessibilite", "Les eventuels besoins d'adaptation ont-ils ete pris en compte ?", "Oui/Non/Non concerne"],
        ["Amelioration", "Quelle amelioration prioritaire proposez-vous ?", "Texte libre"],
      ]) +
      "</section>",
    "<section><h2>Traitement qualite</h2>" + p("Les reponses sont consolidees, analysees et rattachees a une action corrective lorsque le niveau de satisfaction ou les commentaires le justifient.") + "</section>",
  ]);
}

export function generateAttendanceSheetTemplate(input: DocumentInput): GeneratedContent {
  return qualityHeader("Modele de feuille d'emargement", input, [
    "<section><h2>Session</h2>" +
      table(["Champ", "Valeur"], [
        ["Formation", input.trainingProgram?.title ?? "A completer"],
        ["Date", "A completer"],
        ["Horaires", "A completer"],
        ["Lieu ou modalite", input.trainingProgram?.modalities ?? "A completer"],
        ["Formateur", "A completer"],
      ]) +
      "</section>",
    "<section><h2>Emargement</h2>" +
      table(["Nom", "Prenom", "Matin", "Apres-midi", "Signature"], [
        ["", "", "", "", ""],
        ["", "", "", "", ""],
        ["", "", "", "", ""],
        ["", "", "", "", ""],
        ["", "", "", "", ""],
      ]) +
      "</section>",
    "<section><h2>Controle</h2>" + p("Toute absence, retard ou incident d'assiduite doit etre trace et traite selon les regles internes de suivi des beneficiaires.") + "</section>",
  ]);
}

export function generateContinuousImprovementPlan(input: DocumentInput): GeneratedContent {
  const actions = input.actions ?? [];
  return qualityHeader("Plan d'amelioration continue", input, [
    "<section><h2>Principe</h2>" + p("Le plan d'amelioration centralise les constats issus des audits, reclamations, satisfactions, veilles, incidents et revues internes.") + "</section>",
    "<section><h2>Actions en cours</h2>" +
      (actions.length
        ? table(["Action", "Statut", "Echeance"], actions.map((action) => [action.title, action.status ?? "A suivre", formatFrenchDate(action.dueDate)]))
        : p("Aucune action active renseignee. Creer au minimum les actions issues des derniers constats qualite.")) +
      "</section>",
    "<section><h2>Regle de suivi</h2>" +
      list([
        "Chaque action dispose d'un responsable et d'une echeance.",
        "La cloture doit etre justifiee par une note ou une preuve associee.",
        "Les actions critiques sont revues avant toute preparation d'audit.",
      ]) +
      "</section>",
  ]);
}

export function generateComplaintManagementProcedure(input: DocumentInput): GeneratedContent {
  return qualityHeader("Procedure de gestion des reclamations", input, [
    "<section><h2>Objet</h2>" + p("Recevoir, qualifier, traiter et tracer les reclamations, difficultes ou incidents lies aux prestations.") + "</section>",
    "<section><h2>Canaux de reception</h2>" + list(["Email de contact", "Formulaire ou questionnaire", "Entretien oral retranscrit", "Message financeur ou entreprise", "Retour formateur"]) + "</section>",
    "<section><h2>Traitement</h2>" +
      table(["Etape", "Delai cible", "Trace attendue"], [
        ["Enregistrement", "Sous 2 jours ouvres", "Registre reclamation"],
        ["Accuse reception", "Sous 5 jours ouvres si pertinent", "Email ou compte rendu"],
        ["Analyse", "Selon criticite", "Cause, impact, pieces jointes"],
        ["Decision", "Avant cloture", "Reponse, correction, action qualite"],
        ["Cloture", "Apres verification", "Note de cloture et preuve"],
      ]) +
      "</section>",
  ]);
}

export function generateAuditSummary(input: DocumentInput): GeneratedContent {
  const score = input.audit?.readinessScore ?? 0;
  const missing = input.missingPoints ?? [];
  return qualityHeader("Synthese preparatoire audit", input, [
    "<section><h2>Contexte audit</h2>" +
      table(["Champ", "Valeur"], [
        ["Type", input.audit?.type ?? "A preciser"],
        ["Date prevue", formatFrenchDate(input.audit?.scheduledDate)],
        ["Niveau de preparation", formatPercent(score)],
      ]) +
      "</section>",
    "<section><h2>Points a verifier en priorite</h2>" +
      (missing.length ? list(missing) : p("Aucun point bloquant majeur identifie dans les donnees saisies.")) +
      "</section>",
    "<section><h2>Lecture conseillee</h2>" + p("Cette synthese est un dossier preparatoire. Les exigences applicables restent a valider selon votre situation, le guide RNQ en vigueur et les demandes de votre certificateur.") + "</section>",
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
  return qualityHeader("Dossier preparatoire audit complet", input, [
    "<section><h2>Resume executif</h2>" +
      table(["Indicateur", "Valeur"], [
        ["Perimetre", input.activeClient ? `Client cabinet - ${input.activeClient.organizationName}` : "Organisme principal"],
        ["Niveau de preparation", formatPercent(input.audit?.readinessScore ?? 0)],
        ["Date audit", formatFrenchDate(input.audit?.scheduledDate)],
        ["Type audit", input.audit?.type ?? "A preciser"],
        ["Indicateurs suivis", indicators.length],
        ["Preuves referencees", evidences.length],
        ["Actions actives ou historisees", actions.length],
        ["Points manquants", input.missingPoints?.length ?? 0],
      ]) +
      "</section>",
    "<section><h2>Methode de lecture du dossier</h2>" +
      list([
        "Les scores indiquent un niveau de preparation interne et ne constituent pas une validation officielle.",
        "Chaque indicateur doit etre relu avec le guide RNQ applicable et les attentes du certificateur.",
        "Les preuves listees sont les elements disponibles dans QualiPilot au jour de generation.",
        "Les points manquants doivent etre arbitres avant l'audit ou documentes comme reserves internes.",
      ]) +
      "</section>",
    "<section><h2>Synthese par critere RNQ</h2>" +
      (criterionScores.length
        ? table(["Critere", "Intitule", "Score", "Indicateurs prets"], criterionScores.map((criterion) => [`Critere ${criterion.number}`, criterion.title, formatPercent(criterion.score), `${criterion.readyCount}/${criterion.totalCount}`]))
        : p("Aucune synthese par critere disponible.")) +
      "</section>",
    "<section><h2>Indicateurs critiques a traiter</h2>" +
      (criticalIndicators.length
        ? table(["Numero", "Critere", "Indicateur", "Statut", "Preuves"], criticalIndicators.map((indicator) => [indicator.number, indicator.criterionNumber ?? "?", indicator.title, indicator.status ?? "Non renseigne", indicator.evidenceCount ?? 0]))
        : p("Aucun indicateur critique incomplet identifie dans les donnees disponibles.")) +
      "</section>",
    "<section><h2>Indicateurs RNQ</h2>" +
      (indicators.length
        ? table(["Numero", "Critere", "Risque", "Indicateur", "Statut", "Score", "Preuves", "Actions ouvertes"], indicators.map((indicator) => [indicator.number, indicator.criterionNumber ?? "?", indicator.riskLevel ?? "Non renseigne", indicator.title, indicator.status ?? "Non renseigne", `${indicator.score ?? 0} %`, indicator.evidenceCount ?? 0, indicator.actionCount ?? 0]))
        : p("Aucun indicateur disponible.")) +
      "</section>",
    "<section><h2>Registre des preuves associees</h2>" +
      (evidences.length
        ? table(["Preuve", "Type", "Statut", "Validite", "Responsable", "Indicateurs"], evidences.map((evidence) => [evidence.title, evidence.type ?? "Non renseigne", evidence.status ?? "Non renseigne", formatFrenchDate(evidence.validityDate), evidence.responsible ?? "Non renseigne", evidence.indicators?.join(", ") || "A associer"]))
        : p("Aucune preuve renseignee.")) +
      "</section>",
    "<section><h2>Preuves expirees ou a revoir</h2>" +
      (expiredEvidences.length
        ? table(["Preuve", "Type", "Validite", "Indicateurs"], expiredEvidences.map((evidence) => [evidence.title, evidence.type ?? "Non renseigne", formatFrenchDate(evidence.validityDate), evidence.indicators?.join(", ") || "A associer"]))
        : p("Aucune preuve expiree identifiee dans les donnees disponibles.")) +
      "</section>",
    "<section><h2>Programmes de formation</h2>" +
      (trainingPrograms.length
        ? table(["Formation", "Public", "Objectifs", "Duree", "Modalites"], trainingPrograms.map((program) => [program.title, program.publicTarget ?? "Non renseigne", program.objectives ?? "Non renseigne", program.duration ?? "Non renseigne", program.modalities ?? "Non renseigne"]))
        : p("Aucune formation renseignee.")) +
      "</section>",
    "<section><h2>Plan d'action qualite</h2>" +
      (actionsLateOrCritical.length
        ? table(["Action", "Priorite", "Statut", "Echeance", "Responsable", "Indicateur"], actionsLateOrCritical.map((action) => [action.title, action.priority ?? "Non renseigne", action.status ?? "A suivre", formatFrenchDate(action.dueDate), action.responsible ?? "Non renseigne", action.indicatorNumber ?? "Non lie"]))
        : p("Aucune action active renseignee.")) +
      "</section>",
    "<section><h2>Documents qualite generes</h2>" +
      (documents.length
        ? table(["Document", "Type", "Generation"], documents.map((document) => [document.title, document.type ?? "Non renseigne", formatFrenchDate(document.createdAt)]))
        : p("Aucun document genere reference dans ce dossier.")) +
      "</section>",
    "<section><h2>Points manquants et reserves</h2>" +
      (input.missingPoints?.length ? list(input.missingPoints) : p("Aucun point manquant identifie dans les donnees disponibles.")) +
      "</section>",
    "<section><h2>Plan de revue avant audit</h2>" +
      table(["Controle", "Action attendue"], [
        ["Preuves critiques", "Verifier que chaque indicateur critique dispose d'un element de preuve exploitable."],
        ["Documents qualite", "Relire les procedures generees, les adapter a la pratique reelle et les valider en interne."],
        ["Formations", "Comparer les informations publiques, les programmes transmis et les preuves conservees."],
        ["Actions", "Cloturer ou justifier les actions en retard avant l'entretien d'audit."],
        ["Tracabilite", "Conserver une version datee de ce dossier et des preuves principales."],
      ]) +
      "</section>",
  ]);
}
