-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "provider" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "avatar_url" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "spotify_client_id" TEXT,
    "spotify_client_secret" TEXT,
    "spotify_access_token" TEXT,
    "spotify_refresh_token" TEXT,
    "spotify_token_expires_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_users" ("avatar_url", "created_at", "id", "provider", "spotify_access_token", "spotify_client_id", "spotify_client_secret", "spotify_refresh_token", "spotify_token_expires_at", "updated_at", "username") SELECT "avatar_url", "created_at", "id", "provider", "spotify_access_token", "spotify_client_id", "spotify_client_secret", "spotify_refresh_token", "spotify_token_expires_at", "updated_at", "username" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
