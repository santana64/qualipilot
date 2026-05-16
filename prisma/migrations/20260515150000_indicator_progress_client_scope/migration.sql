ALTER TABLE "IndicatorProgress" ADD COLUMN "clientId" TEXT;

ALTER TABLE "IndicatorProgress"
  ADD CONSTRAINT "IndicatorProgress_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "CabinetClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

DROP INDEX IF EXISTS "IndicatorProgress_userId_indicatorId_key";

CREATE UNIQUE INDEX "IndicatorProgress_userId_indicatorId_clientId_key"
  ON "IndicatorProgress"("userId", "indicatorId", "clientId");

CREATE INDEX "IndicatorProgress_clientId_idx" ON "IndicatorProgress"("clientId");
