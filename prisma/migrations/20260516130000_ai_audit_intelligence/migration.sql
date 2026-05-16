CREATE TYPE "AiAuditSessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');
CREATE TYPE "AiAuditVerdict" AS ENUM ('READY', 'WARNING', 'AT_RISK', 'CRITICAL');
CREATE TYPE "RnqWatchStatus" AS ENUM ('NO_CHANGE', 'DETECTED', 'FAILED');

CREATE TABLE "AiAuditSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "clientId" TEXT,
  "title" TEXT NOT NULL,
  "certifierPersona" TEXT NOT NULL,
  "status" "AiAuditSessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "globalScore" INTEGER NOT NULL DEFAULT 0,
  "verdict" "AiAuditVerdict",
  "reportText" TEXT,
  "reportHtml" TEXT,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiAuditSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiAuditAnswer" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "indicatorId" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "answerText" TEXT,
  "evaluationScore" INTEGER,
  "verdict" "AiAuditVerdict",
  "gaps" TEXT[],
  "recommendations" TEXT[],
  "expectedEvidence" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiAuditAnswer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EvidenceAiAnalysis" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "clientId" TEXT,
  "evidenceId" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "confidenceScore" INTEGER NOT NULL,
  "recommendedIndicatorNumbers" INTEGER[],
  "linkedIndicatorNumbers" INTEGER[],
  "gaps" TEXT[],
  "rawResultJson" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EvidenceAiAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RnqWatchEvent" (
  "id" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "sourceTitle" TEXT NOT NULL,
  "contentHash" TEXT NOT NULL,
  "detectedVersion" TEXT,
  "summary" TEXT NOT NULL,
  "impactedIndicatorNumbers" INTEGER[],
  "rawResultJson" JSONB,
  "status" "RnqWatchStatus" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RnqWatchEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RnqWatchNotification" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "sentAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RnqWatchNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiAuditSession_userId_createdAt_idx" ON "AiAuditSession"("userId", "createdAt");
CREATE INDEX "AiAuditSession_clientId_createdAt_idx" ON "AiAuditSession"("clientId", "createdAt");

CREATE UNIQUE INDEX "AiAuditAnswer_sessionId_indicatorId_key" ON "AiAuditAnswer"("sessionId", "indicatorId");
CREATE INDEX "AiAuditAnswer_indicatorId_idx" ON "AiAuditAnswer"("indicatorId");

CREATE INDEX "EvidenceAiAnalysis_userId_createdAt_idx" ON "EvidenceAiAnalysis"("userId", "createdAt");
CREATE INDEX "EvidenceAiAnalysis_clientId_createdAt_idx" ON "EvidenceAiAnalysis"("clientId", "createdAt");
CREATE INDEX "EvidenceAiAnalysis_evidenceId_createdAt_idx" ON "EvidenceAiAnalysis"("evidenceId", "createdAt");

CREATE UNIQUE INDEX "RnqWatchEvent_contentHash_key" ON "RnqWatchEvent"("contentHash");
CREATE INDEX "RnqWatchEvent_sourceUrl_createdAt_idx" ON "RnqWatchEvent"("sourceUrl", "createdAt");
CREATE INDEX "RnqWatchEvent_status_createdAt_idx" ON "RnqWatchEvent"("status", "createdAt");

CREATE UNIQUE INDEX "RnqWatchNotification_eventId_userId_key" ON "RnqWatchNotification"("eventId", "userId");
CREATE INDEX "RnqWatchNotification_userId_createdAt_idx" ON "RnqWatchNotification"("userId", "createdAt");

ALTER TABLE "AiAuditSession"
  ADD CONSTRAINT "AiAuditSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AiAuditSession"
  ADD CONSTRAINT "AiAuditSession_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "CabinetClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AiAuditAnswer"
  ADD CONSTRAINT "AiAuditAnswer_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "AiAuditSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AiAuditAnswer"
  ADD CONSTRAINT "AiAuditAnswer_indicatorId_fkey"
  FOREIGN KEY ("indicatorId") REFERENCES "RnqIndicator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EvidenceAiAnalysis"
  ADD CONSTRAINT "EvidenceAiAnalysis_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EvidenceAiAnalysis"
  ADD CONSTRAINT "EvidenceAiAnalysis_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "CabinetClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EvidenceAiAnalysis"
  ADD CONSTRAINT "EvidenceAiAnalysis_evidenceId_fkey"
  FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RnqWatchNotification"
  ADD CONSTRAINT "RnqWatchNotification_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "RnqWatchEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RnqWatchNotification"
  ADD CONSTRAINT "RnqWatchNotification_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
