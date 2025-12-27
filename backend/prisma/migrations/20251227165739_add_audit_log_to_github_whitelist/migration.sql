-- AlterTable
ALTER TABLE "github_whitelist" ADD COLUMN "removed_at" DATETIME;
ALTER TABLE "github_whitelist" ADD COLUMN "removed_by" TEXT;
