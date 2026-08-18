-- Late fee moves from a flat amount to a percentage of rent (0-10%).
ALTER TABLE "Apartment" RENAME COLUMN "lateFeeAmount" TO "lateFeePercent";
