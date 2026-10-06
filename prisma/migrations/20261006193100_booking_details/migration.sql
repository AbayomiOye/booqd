-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "durationMin" INTEGER,
ADD COLUMN     "endsAt" TIMESTAMP(3),
ADD COLUMN     "price" DOUBLE PRECISION,
ADD COLUMN     "serviceName" TEXT;

-- Preserve existing appointments by snapshotting their current service details.
UPDATE "Appointment" AS a
SET "durationMin" = s."durationMin", "price" = s.price,
    "serviceName" = s."serviceName",
    "endsAt" = a."apptDate" + s."durationMin" * interval '1 minute'
FROM "Service" AS s WHERE s.id = a."serviceId";

ALTER TABLE "Appointment"
  ALTER COLUMN "durationMin" SET NOT NULL,
  ALTER COLUMN "price" SET NOT NULL,
  ALTER COLUMN "serviceName" SET NOT NULL,
  ALTER COLUMN "endsAt" SET NOT NULL;

ALTER TABLE "Service" ADD CONSTRAINT "Service_positive_duration" CHECK ("durationMin" > 0);
ALTER TABLE "Service" ADD CONSTRAINT "Service_nonnegative_price" CHECK (price >= 0 AND price < 'Infinity'::float8);
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_valid_interval" CHECK ("endsAt" > "apptDate");

-- Booq’d uses server-side Prisma and its own verified sessions.
-- Browser Data API roles must not access account or booking data directly.
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Provider" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Service" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Portfolio" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "User", "Provider", "Service", "Appointment", "Portfolio" FROM anon, authenticated;
REVOKE ALL ON SEQUENCE "User_id_seq", "Provider_id_seq", "Service_id_seq", "Appointment_id_seq", "Portfolio_id_seq" FROM anon, authenticated;

-- CreateIndex
CREATE INDEX "Service_providerId_idx" ON "Service"("providerId");

-- CreateIndex
CREATE INDEX "Appointment_clientId_apptDate_idx" ON "Appointment"("clientId", "apptDate");

-- CreateIndex
CREATE INDEX "Appointment_providerId_apptDate_idx" ON "Appointment"("providerId", "apptDate");

-- CreateIndex
CREATE INDEX "Appointment_serviceId_idx" ON "Appointment"("serviceId");

-- CreateIndex
CREATE INDEX "Portfolio_providerId_idx" ON "Portfolio"("providerId");
