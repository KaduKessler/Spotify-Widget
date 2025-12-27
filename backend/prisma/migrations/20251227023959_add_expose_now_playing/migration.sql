-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_widget_config" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'NOW_PLAYING',
    "track_id" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "expose_now_playing" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "widget_config_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_widget_config" ("created_at", "id", "mode", "theme", "track_id", "updated_at", "user_id") SELECT "created_at", "id", "mode", "theme", "track_id", "updated_at", "user_id" FROM "widget_config";
DROP TABLE "widget_config";
ALTER TABLE "new_widget_config" RENAME TO "widget_config";
CREATE UNIQUE INDEX "widget_config_user_id_key" ON "widget_config"("user_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
