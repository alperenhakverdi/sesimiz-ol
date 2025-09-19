-- AlterTable
ALTER TABLE "public"."password_reset_tokens"
  RENAME COLUMN "otpCode" TO "otpHash";
