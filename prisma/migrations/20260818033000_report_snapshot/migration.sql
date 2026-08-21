-- AlterTable
ALTER TABLE "ReportStatus" ADD COLUMN "rentCollectedSnapshot" DOUBLE PRECISION;
ALTER TABLE "ReportStatus" ADD COLUMN "lateFeeSnapshot" DOUBLE PRECISION;
ALTER TABLE "ReportStatus" ADD COLUMN "totalIncomeSnapshot" DOUBLE PRECISION;
ALTER TABLE "ReportStatus" ADD COLUMN "commissionPercentSnapshot" DOUBLE PRECISION;
ALTER TABLE "ReportStatus" ADD COLUMN "commissionAmountSnapshot" DOUBLE PRECISION;
ALTER TABLE "ReportStatus" ADD COLUMN "maintenanceCostSnapshot" DOUBLE PRECISION;
ALTER TABLE "ReportStatus" ADD COLUMN "netAmountSnapshot" DOUBLE PRECISION;
