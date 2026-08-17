-- AlterTable
ALTER TABLE "Owner" ADD COLUMN "rnc" TEXT;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN "rnc" TEXT;

-- AlterTable
ALTER TABLE "Role" ADD COLUMN "manageInvoices" BOOLEAN NOT NULL DEFAULT false;

-- Existing installs already have Administrador/Gestor rows created before
-- this permission existed; grant it to them so nobody loses access.
UPDATE "Role" SET "manageInvoices" = true WHERE "name" IN ('Administrador', 'Gestor');

-- CreateTable
CREATE TABLE "BusinessSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "businessName" TEXT,
    "businessRnc" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "nextReceiptNumber" INTEGER NOT NULL DEFAULT 1,
    "nextInvoiceNumber" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "ncf" TEXT,
    "issuedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "concept" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientRnc" TEXT,
    "notes" TEXT,
    "periodMonth" INTEGER,
    "periodYear" INTEGER,
    "ownerId" TEXT,
    "apartmentId" TEXT,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
