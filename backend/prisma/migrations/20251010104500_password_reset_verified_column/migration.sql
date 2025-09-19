-- AlterTable
ALTER TABLE "public"."password_reset_tokens"
  ADD COLUMN "verifiedAt" TIMESTAMP(3);
