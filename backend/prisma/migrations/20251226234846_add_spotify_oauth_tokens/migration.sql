-- AlterTable
ALTER TABLE "users" ADD COLUMN "spotify_access_token" TEXT;
ALTER TABLE "users" ADD COLUMN "spotify_refresh_token" TEXT;
ALTER TABLE "users" ADD COLUMN "spotify_token_expires_at" DATETIME;
