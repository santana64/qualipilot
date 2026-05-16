export const indicatorStatusLabels: Record<string, string> = {
  NOT_STARTED: "Non démarré",
  IN_PROGRESS: "En cours",
  NEEDS_REVIEW: "À vérifier",
  READY: "Préparé",
  VALIDATED: "Validé",
  NOT_APPLICABLE: "Non applicable",
};

export const riskLabels: Record<string, string> = {
  LOW: "Faible",
  MEDIUM: "Moyen",
  HIGH: "Élevé",
  CRITICAL: "Critique",
};

export const trainingStatusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
  ARCHIVED: "Archivé",
};

export const evidenceTypeLabels: Record<string, string> = {
  PROCEDURE: "Procédure",
  PROGRAM: "Programme",
  ATTENDANCE_SHEET: "Feuille d'émargement",
  SATISFACTION_SURVEY: "Questionnaire satisfaction",
  EVALUATION_RESULT: "Résultat d'évaluation",
  TRAINER_CV: "CV formateur",
  ACCESSIBILITY_DOCUMENT: "Document handicap/accessibilité",
  CONTRACT: "Contrat/convention",
  FUNDER_DOCUMENT: "Document financeur",
  IMPROVEMENT_ACTION: "Action d'amélioration",
  PUBLIC_INFORMATION_PROOF: "Preuve information publique",
  SUBCONTRACTOR_PROOF: "Preuve sous-traitance",
  OTHER: "Autre",
};

export const evidenceStatusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  ACTIVE: "Active",
  EXPIRED: "Expirée",
  TO_REVIEW: "À revoir",
  ARCHIVED: "Archivée",
};

export const actionPriorityLabels: Record<string, string> = {
  LOW: "Faible",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
  CRITICAL: "Critique",
};

export const actionStatusLabels: Record<string, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  DONE: "Terminée",
  CANCELLED: "Annulée",
};

export const auditTypeLabels: Record<string, string> = {
  INITIAL: "Initial",
  SURVEILLANCE: "Surveillance",
  RENEWAL: "Renouvellement",
  INTERNAL: "Interne",
};

export const qualiopiStatusLabels: Record<string, string> = {
  NOT_CERTIFIED: "Non certifié",
  INITIAL_AUDIT_PLANNED: "Audit initial planifié",
  CERTIFIED: "Certifié",
  SURVEILLANCE_PLANNED: "Surveillance planifiée",
  RENEWAL_PLANNED: "Renouvellement planifié",
};

export const documentTypeLabels: Record<string, string> = {
  LEARNER_WELCOME_PROCEDURE: "Procédure accueil apprenant",
  ACCESSIBILITY_PROCEDURE: "Procédure handicap/accessibilité",
  EVALUATION_PROCEDURE: "Procédure évaluation",
  TRAINING_PROGRAM_TEMPLATE: "Modèle programme de formation",
  SATISFACTION_QUESTIONNAIRE: "Questionnaire satisfaction",
  ATTENDANCE_SHEET_TEMPLATE: "Modèle feuille d'émargement",
  CONTINUOUS_IMPROVEMENT_PLAN: "Plan d'amélioration continue",
  COMPLAINT_MANAGEMENT_PROCEDURE: "Procédure réclamations",
  AUDIT_SUMMARY: "Synthèse audit",
  FULL_AUDIT_FILE: "Dossier audit complet",
};

export const reminderTypeLabels: Record<string, string> = {
  ACTION_DUE: "Action à échéance",
  AUDIT_PREPARATION: "Préparation audit",
  EVIDENCE_EXPIRY: "Preuve à vérifier",
};

export const reminderStatusLabels: Record<string, string> = {
  ACTIVE: "Planifié",
  PAUSED: "En pause",
  SENT: "Envoyé",
  CANCELLED: "Annulé",
  FAILED: "Échec",
};

export const cabinetClientStatusLabels: Record<string, string> = {
  ACTIVE: "Actif",
  ARCHIVED: "Archivé",
};
