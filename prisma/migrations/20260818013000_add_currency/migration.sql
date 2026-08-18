-- AlterTable
ALTER TABLE "Apartment" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'DOP';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'DOP';

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'DOP';

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'DOP';
