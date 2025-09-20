-- CreateEnum
CREATE TYPE "public"."ProfileVisibility" AS ENUM ('PUBLIC', 'COMMUNITY', 'PRIVATE');

-- CreateEnum
CREATE TYPE "public"."CommentPermission" AS ENUM ('EVERYONE', 'FOLLOWERS', 'NONE');

-- CreateEnum
CREATE TYPE "public"."ThemePreference" AS ENUM ('SYSTEM', 'LIGHT', 'DARK');

-- CreateEnum
CREATE TYPE "public"."FontSizePreference" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "bio" TEXT;

-- CreateTable
CREATE TABLE "public"."user_settings" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "profileVisibility" "public"."ProfileVisibility" NOT NULL DEFAULT 'PUBLIC',
    "commentPermission" "public"."CommentPermission" NOT NULL DEFAULT 'EVERYONE',
    "searchVisibility" BOOLEAN NOT NULL DEFAULT true,
    "theme" "public"."ThemePreference" NOT NULL DEFAULT 'SYSTEM',
    "fontSize" "public"."FontSizePreference" NOT NULL DEFAULT 'MEDIUM',
    "reducedMotion" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_userId_key" ON "public"."user_settings"("userId");

-- AddForeignKey
ALTER TABLE "public"."user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed default settings for existing users
INSERT INTO "public"."user_settings" ("userId")
SELECT "id" FROM "public"."users"
ON CONFLICT ("userId") DO NOTHING;
