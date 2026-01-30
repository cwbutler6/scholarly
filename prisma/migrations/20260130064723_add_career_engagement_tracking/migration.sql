-- CreateTable
CREATE TABLE "career_video_watches" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "occupation_id" TEXT NOT NULL,
    "video_id" TEXT NOT NULL,
    "video_title" TEXT,
    "video_url" TEXT,
    "duration" INTEGER,
    "watched_seconds" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "watched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "career_video_watches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_engagements" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "occupation_id" TEXT NOT NULL,
    "page_views" INTEGER NOT NULL DEFAULT 0,
    "time_spent_seconds" INTEGER NOT NULL DEFAULT 0,
    "last_viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "career_engagements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "career_video_watches_user_id_occupation_id_idx" ON "career_video_watches"("user_id", "occupation_id");

-- CreateIndex
CREATE UNIQUE INDEX "career_video_watches_user_id_occupation_id_video_id_key" ON "career_video_watches"("user_id", "occupation_id", "video_id");

-- CreateIndex
CREATE INDEX "career_engagements_user_id_idx" ON "career_engagements"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "career_engagements_user_id_occupation_id_key" ON "career_engagements"("user_id", "occupation_id");

-- AddForeignKey
ALTER TABLE "career_video_watches" ADD CONSTRAINT "career_video_watches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_engagements" ADD CONSTRAINT "career_engagements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
