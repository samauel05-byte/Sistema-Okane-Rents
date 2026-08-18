-- AlterTable
ALTER TABLE "Apartment" ADD COLUMN "managementCommissionPercent" DOUBLE PRECISION;
ALTER TABLE "Apartment" ADD COLUMN "managerName" TEXT;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN "contractEnd" TIMESTAMP(3);
ALTER TABLE "Tenant" ADD COLUMN "contractStatus" TEXT;

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN "responsible" TEXT;

-- CreateTable
CREATE TABLE "ReportStatus" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "payoutStatus" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "paidOn" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "destinationAccount" TEXT,
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReportStatus_apartmentId_periodMonth_periodYear_key" ON "ReportStatus"("apartmentId", "periodMonth", "periodYear");

-- AddForeignKey
ALTER TABLE "ReportStatus" ADD CONSTRAINT "ReportStatus_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
