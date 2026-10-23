-- AlterTable
ALTER TABLE "Account" ALTER COLUMN "balanceCents" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "Movement" ALTER COLUMN "amountCents" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "Transfer" ALTER COLUMN "amountCents" SET DATA TYPE BIGINT;
