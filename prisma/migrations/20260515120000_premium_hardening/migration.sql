CREATE TYPE "TeamRole" AS ENUM ('OWNER', 'ADMIN', 'QUALITY_MANAGER', 'TRAINER', 'VIEWER');
CREATE TYPE "TeamMemberStatus" AS ENUM ('INVITED', 'ACTIVE', 'DISABLED');

CREATE TABLE "TeamMember" (
  "id" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "memberUserId" TEXT,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "role" "TeamRole" NOT NULL,
  "status" "TeamMemberStatus" NOT NULL DEFAULT 'INVITED',
  "inviteTokenHash" TEXT,
  "inviteExpiresAt" TIMESTAMP(3),
  "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReadinessSnapshot" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "clientId" TEXT,
  "globalReadinessScore" INTEGER NOT NULL,
  "indicatorsReady" INTEGER NOT NULL,
  "indicatorsIncomplete" INTEGER NOT NULL,
  "missingEvidenceCount" INTEGER NOT NULL,
  "overdueActionsCount" INTEGER NOT NULL,
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReadinessSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditorShareLink" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "clientId" TEXT,
  "tokenHash" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "lastViewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditorShareLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TeamMember_inviteTokenHash_key" ON "TeamMember"("inviteTokenHash");
CREATE UNIQUE INDEX "TeamMember_ownerUserId_email_key" ON "TeamMember"("ownerUserId", "email");
CREATE INDEX "TeamMember_ownerUserId_idx" ON "TeamMember"("ownerUserId");
CREATE INDEX "TeamMember_memberUserId_idx" ON "TeamMember"("memberUserId");
CREATE INDEX "ReadinessSnapshot_userId_capturedAt_idx" ON "ReadinessSnapshot"("userId", "capturedAt");
CREATE INDEX "ReadinessSnapshot_clientId_capturedAt_idx" ON "ReadinessSnapshot"("clientId", "capturedAt");
CREATE UNIQUE INDEX "AuditorShareLink_tokenHash_key" ON "AuditorShareLink"("tokenHash");
CREATE INDEX "AuditorShareLink_userId_idx" ON "AuditorShareLink"("userId");
CREATE INDEX "AuditorShareLink_clientId_idx" ON "AuditorShareLink"("clientId");

ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_memberUserId_fkey" FOREIGN KEY ("memberUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReadinessSnapshot" ADD CONSTRAINT "ReadinessSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReadinessSnapshot" ADD CONSTRAINT "ReadinessSnapshot_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "CabinetClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditorShareLink" ADD CONSTRAINT "AuditorShareLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditorShareLink" ADD CONSTRAINT "AuditorShareLink_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "CabinetClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
