CREATE TYPE "ReminderType" AS ENUM ('ACTION_DUE', 'AUDIT_PREPARATION', 'EVIDENCE_EXPIRY');
CREATE TYPE "ReminderStatus" AS ENUM ('ACTIVE', 'PAUSED', 'SENT', 'CANCELLED', 'FAILED');
CREATE TYPE "CabinetClientStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

CREATE TABLE "CabinetClient" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "organizationName" TEXT NOT NULL,
  "contactName" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "siret" TEXT,
  "ndaNumber" TEXT,
  "address" TEXT,
  "notes" TEXT,
  "status" "CabinetClientStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CabinetClient_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EmailReminder" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "clientId" TEXT,
  "type" "ReminderType" NOT NULL,
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "scheduledFor" TIMESTAMP(3) NOT NULL,
  "sentAt" TIMESTAMP(3),
  "status" "ReminderStatus" NOT NULL DEFAULT 'ACTIVE',
  "actionPlanItemId" TEXT,
  "evidenceId" TEXT,
  "auditRecordId" TEXT,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailReminder_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "TrainingProgram" ADD COLUMN "clientId" TEXT;
ALTER TABLE "Evidence" ADD COLUMN "clientId" TEXT;
ALTER TABLE "Evidence" ADD COLUMN "fileStorageKey" TEXT;
ALTER TABLE "Evidence" ADD COLUMN "fileName" TEXT;
ALTER TABLE "Evidence" ADD COLUMN "fileMimeType" TEXT;
ALTER TABLE "Evidence" ADD COLUMN "fileSizeBytes" INTEGER;
ALTER TABLE "Evidence" ADD COLUMN "fileUploadedAt" TIMESTAMP(3);
ALTER TABLE "ActionPlanItem" ADD COLUMN "clientId" TEXT;
ALTER TABLE "GeneratedDocument" ADD COLUMN "clientId" TEXT;
ALTER TABLE "AuditRecord" ADD COLUMN "clientId" TEXT;

CREATE INDEX "CabinetClient_userId_idx" ON "CabinetClient"("userId");
CREATE INDEX "EmailReminder_userId_status_scheduledFor_idx" ON "EmailReminder"("userId", "status", "scheduledFor");
CREATE INDEX "EmailReminder_clientId_idx" ON "EmailReminder"("clientId");
CREATE INDEX "TrainingProgram_clientId_idx" ON "TrainingProgram"("clientId");
CREATE INDEX "Evidence_clientId_idx" ON "Evidence"("clientId");
CREATE INDEX "ActionPlanItem_clientId_idx" ON "ActionPlanItem"("clientId");
CREATE INDEX "GeneratedDocument_clientId_idx" ON "GeneratedDocument"("clientId");
CREATE INDEX "AuditRecord_clientId_idx" ON "AuditRecord"("clientId");

ALTER TABLE "CabinetClient" ADD CONSTRAINT "CabinetClient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailReminder" ADD CONSTRAINT "EmailReminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailReminder" ADD CONSTRAINT "EmailReminder_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "CabinetClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmailReminder" ADD CONSTRAINT "EmailReminder_actionPlanItemId_fkey" FOREIGN KEY ("actionPlanItemId") REFERENCES "ActionPlanItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailReminder" ADD CONSTRAINT "EmailReminder_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmailReminder" ADD CONSTRAINT "EmailReminder_auditRecordId_fkey" FOREIGN KEY ("auditRecordId") REFERENCES "AuditRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrainingProgram" ADD CONSTRAINT "TrainingProgram_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "CabinetClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "CabinetClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ActionPlanItem" ADD CONSTRAINT "ActionPlanItem_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "CabinetClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "CabinetClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditRecord" ADD CONSTRAINT "AuditRecord_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "CabinetClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
