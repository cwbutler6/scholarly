-- CreateTable
CREATE TABLE "crosswords" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "rows" INTEGER NOT NULL DEFAULT 5,
    "cols" INTEGER NOT NULL DEFAULT 5,
    "grid" JSONB NOT NULL,
    "clues" JSONB NOT NULL,
    "hint" TEXT,
    "fun_fact_title" TEXT,
    "fun_fact_text" TEXT,
    "active_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crosswords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crossword_progress" (
    "id" TEXT NOT NULL,
    "crossword_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_grid" JSONB NOT NULL,
    "hints_used" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crossword_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crosswords_active_date_idx" ON "crosswords"("active_date");

-- CreateIndex
CREATE UNIQUE INDEX "crossword_progress_crossword_id_user_id_key" ON "crossword_progress"("crossword_id", "user_id");

-- AddForeignKey
ALTER TABLE "crossword_progress" ADD CONSTRAINT "crossword_progress_crossword_id_fkey" FOREIGN KEY ("crossword_id") REFERENCES "crosswords"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crossword_progress" ADD CONSTRAINT "crossword_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
