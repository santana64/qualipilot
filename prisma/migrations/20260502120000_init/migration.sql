CREATE TYPE "QualiopiStatus" AS ENUM ('NOT_CERTIFIED', 'INITIAL_AUDIT_PLANNED', 'CERTIFIED', 'SURVEILLANCE_PLANNED', 'RENEWAL_PLANNED');
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "IndicatorStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'NEEDS_REVIEW', 'READY', 'VALIDATED', 'NOT_APPLICABLE');
CREATE TYPE "TrainingStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "EvidenceType" AS ENUM ('PROCEDURE', 'PROGRAM', 'ATTENDANCE_SHEET', 'SATISFACTION_SURVEY', 'EVALUATION_RESULT', 'TRAINER_CV', 'ACCESSIBILITY_DOCUMENT', 'CONTRACT', 'FUNDER_DOCUMENT', 'IMPROVEMENT_ACTION', 'PUBLIC_INFORMATION_PROOF', 'SUBCONTRACTOR_PROOF', 'OTHER');
CREATE TYPE "EvidenceStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'TO_REVIEW', 'ARCHIVED');
CREATE TYPE "ActionPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "ActionStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED');
CREATE TYPE "GeneratedDocumentType" AS ENUM ('LEARNER_WELCOME_PROCEDURE', 'ACCESSIBILITY_PROCEDURE', 'EVALUATION_PROCEDURE', 'TRAINING_PROGRAM_TEMPLATE', 'SATISFACTION_QUESTIONNAIRE', 'ATTENDANCE_SHEET_TEMPLATE', 'CONTINUOUS_IMPROVEMENT_PLAN', 'COMPLAINT_MANAGEMENT_PROCEDURE', 'AUDIT_SUMMARY', 'FULL_AUDIT_FILE');
CREATE TYPE "AuditType" AS ENUM ('INITIAL', 'SURVEILLANCE', 'RENEWAL', 'INTERNAL');
CREATE TYPE "AuditStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'STARTER', 'PRO', 'CABINET');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "passwordHash" TEXT NOT NULL,
  "emailVerifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailVerificationToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PasswordResetToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrganizationProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "organizationName" TEXT NOT NULL,
  "legalForm" TEXT,
  "siret" TEXT,
  "siren" TEXT,
  "ndaNumber" TEXT,
  "address" TEXT NOT NULL,
  "postalCode" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "website" TEXT,
  "contactPerson" TEXT,
  "activityTypes" TEXT[],
  "qualiopiStatus" "QualiopiStatus" NOT NULL DEFAULT 'NOT_CERTIFIED',
  "certifierName" TEXT,
  "certificateDate" TIMESTAMP(3),
  "certificateExpiryDate" TIMESTAMP(3),
  "nextAuditDate" TIMESTAMP(3),
  "defaultSignature" TEXT,
  "documentFooterText" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrganizationProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RnqCriterion" (
  "id" TEXT NOT NULL,
  "number" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RnqCriterion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RnqIndicator" (
  "id" TEXT NOT NULL,
  "number" INTEGER NOT NULL,
  "criterionId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "shortDescription" TEXT NOT NULL,
  "expectedLevel" TEXT NOT NULL,
  "evidenceExamples" TEXT[],
  "applicableTo" TEXT[],
  "riskLevel" "RiskLevel" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RnqIndicator_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IndicatorProgress" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "indicatorId" TEXT NOT NULL,
  "status" "IndicatorStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "readinessScore" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT,
  "lastReviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IndicatorProgress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TrainingProgram" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "category" TEXT,
  "publicTarget" TEXT NOT NULL,
  "prerequisites" TEXT,
  "objectives" TEXT NOT NULL,
  "duration" TEXT NOT NULL,
  "accessDelay" TEXT,
  "priceCents" INTEGER,
  "modalities" TEXT NOT NULL,
  "teachingMethods" TEXT NOT NULL,
  "evaluationMethods" TEXT NOT NULL,
  "accessibilityInfo" TEXT,
  "contactInfo" TEXT,
  "resultIndicators" TEXT,
  "status" "TrainingStatus" NOT NULL DEFAULT 'DRAFT',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TrainingProgram_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Evidence" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "type" "EvidenceType" NOT NULL,
  "description" TEXT,
  "fileUrl" TEXT,
  "externalUrl" TEXT,
  "validityDate" TIMESTAMP(3),
  "responsible" TEXT,
  "status" "EvidenceStatus" NOT NULL DEFAULT 'DRAFT',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EvidenceIndicator" (
  "id" TEXT NOT NULL,
  "evidenceId" TEXT NOT NULL,
  "indicatorId" TEXT NOT NULL,
  CONSTRAINT "EvidenceIndicator_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EvidenceTrainingProgram" (
  "id" TEXT NOT NULL,
  "evidenceId" TEXT NOT NULL,
  "trainingProgramId" TEXT NOT NULL,
  CONSTRAINT "EvidenceTrainingProgram_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ActionPlanItem" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "priority" "ActionPriority" NOT NULL DEFAULT 'MEDIUM',
  "status" "ActionStatus" NOT NULL DEFAULT 'TODO',
  "dueDate" TIMESTAMP(3),
  "responsible" TEXT,
  "indicatorId" TEXT,
  "evidenceId" TEXT,
  "trainingProgramId" TEXT,
  "completionNote" TEXT,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ActionPlanItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GeneratedDocument" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "GeneratedDocumentType" NOT NULL,
  "title" TEXT NOT NULL,
  "contentHtml" TEXT NOT NULL,
  "contentText" TEXT NOT NULL,
  "relatedIndicatorId" TEXT,
  "relatedTrainingProgramId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GeneratedDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditRecord" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "AuditType" NOT NULL,
  "scheduledDate" TIMESTAMP(3) NOT NULL,
  "certifierName" TEXT,
  "status" "AuditStatus" NOT NULL DEFAULT 'PLANNED',
  "readinessScore" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AuditRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Subscription" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "stripeCustomerId" TEXT,
  "stripeSubscriptionId" TEXT,
  "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
  "status" TEXT NOT NULL DEFAULT 'active',
  "currentPeriodEnd" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RateLimitEvent" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RateLimitEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");
CREATE INDEX "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId");
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");
CREATE UNIQUE INDEX "OrganizationProfile_userId_key" ON "OrganizationProfile"("userId");
CREATE UNIQUE INDEX "RnqCriterion_number_key" ON "RnqCriterion"("number");
CREATE UNIQUE INDEX "RnqIndicator_number_key" ON "RnqIndicator"("number");
CREATE INDEX "IndicatorProgress_userId_idx" ON "IndicatorProgress"("userId");
CREATE UNIQUE INDEX "IndicatorProgress_userId_indicatorId_key" ON "IndicatorProgress"("userId", "indicatorId");
CREATE INDEX "TrainingProgram_userId_idx" ON "TrainingProgram"("userId");
CREATE INDEX "Evidence_userId_idx" ON "Evidence"("userId");
CREATE INDEX "EvidenceIndicator_indicatorId_idx" ON "EvidenceIndicator"("indicatorId");
CREATE UNIQUE INDEX "EvidenceIndicator_evidenceId_indicatorId_key" ON "EvidenceIndicator"("evidenceId", "indicatorId");
CREATE INDEX "EvidenceTrainingProgram_trainingProgramId_idx" ON "EvidenceTrainingProgram"("trainingProgramId");
CREATE UNIQUE INDEX "EvidenceTrainingProgram_evidenceId_trainingProgramId_key" ON "EvidenceTrainingProgram"("evidenceId", "trainingProgramId");
CREATE INDEX "ActionPlanItem_userId_idx" ON "ActionPlanItem"("userId");
CREATE INDEX "ActionPlanItem_indicatorId_idx" ON "ActionPlanItem"("indicatorId");
CREATE INDEX "GeneratedDocument_userId_idx" ON "GeneratedDocument"("userId");
CREATE INDEX "AuditRecord_userId_idx" ON "AuditRecord"("userId");
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");
CREATE INDEX "RateLimitEvent_key_action_createdAt_idx" ON "RateLimitEvent"("key", "action", "createdAt");

ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationProfile" ADD CONSTRAINT "OrganizationProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RnqIndicator" ADD CONSTRAINT "RnqIndicator_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "RnqCriterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IndicatorProgress" ADD CONSTRAINT "IndicatorProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IndicatorProgress" ADD CONSTRAINT "IndicatorProgress_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "RnqIndicator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrainingProgram" ADD CONSTRAINT "TrainingProgram_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EvidenceIndicator" ADD CONSTRAINT "EvidenceIndicator_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EvidenceIndicator" ADD CONSTRAINT "EvidenceIndicator_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "RnqIndicator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EvidenceTrainingProgram" ADD CONSTRAINT "EvidenceTrainingProgram_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EvidenceTrainingProgram" ADD CONSTRAINT "EvidenceTrainingProgram_trainingProgramId_fkey" FOREIGN KEY ("trainingProgramId") REFERENCES "TrainingProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActionPlanItem" ADD CONSTRAINT "ActionPlanItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActionPlanItem" ADD CONSTRAINT "ActionPlanItem_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "RnqIndicator"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ActionPlanItem" ADD CONSTRAINT "ActionPlanItem_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ActionPlanItem" ADD CONSTRAINT "ActionPlanItem_trainingProgramId_fkey" FOREIGN KEY ("trainingProgramId") REFERENCES "TrainingProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_relatedIndicatorId_fkey" FOREIGN KEY ("relatedIndicatorId") REFERENCES "RnqIndicator"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_relatedTrainingProgramId_fkey" FOREIGN KEY ("relatedTrainingProgramId") REFERENCES "TrainingProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditRecord" ADD CONSTRAINT "AuditRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
