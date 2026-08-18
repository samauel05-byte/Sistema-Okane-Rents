-- Rent/management fees don't carry ITBIS in this business — remove it.
ALTER TABLE "Invoice" DROP COLUMN "applyItbis";
