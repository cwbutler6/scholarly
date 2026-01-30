-- AlterTable
ALTER TABLE "assessments" ADD COLUMN     "answers_json" JSONB,
ADD COLUMN     "is_complete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "questions_answered" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "riasec_questions" (
    "id" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "riasec_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "riasec_questions_index_key" ON "riasec_questions"("index");
