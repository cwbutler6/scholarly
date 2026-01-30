-- CreateTable
CREATE TABLE "occupation_tasks" (
    "id" TEXT NOT NULL,
    "occupation_id" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "importance" DOUBLE PRECISION,

    CONSTRAINT "occupation_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occupation_work_context" (
    "id" TEXT NOT NULL,
    "occupation_id" TEXT NOT NULL,
    "element_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "score" DOUBLE PRECISION,

    CONSTRAINT "occupation_work_context_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occupation_work_styles" (
    "id" TEXT NOT NULL,
    "occupation_id" TEXT NOT NULL,
    "element_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "importance" DOUBLE PRECISION,

    CONSTRAINT "occupation_work_styles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "occupation_tasks_occupation_id_statement_key" ON "occupation_tasks"("occupation_id", "statement");

-- CreateIndex
CREATE UNIQUE INDEX "occupation_work_context_occupation_id_element_id_key" ON "occupation_work_context"("occupation_id", "element_id");

-- CreateIndex
CREATE UNIQUE INDEX "occupation_work_styles_occupation_id_element_id_key" ON "occupation_work_styles"("occupation_id", "element_id");

-- AddForeignKey
ALTER TABLE "occupation_tasks" ADD CONSTRAINT "occupation_tasks_occupation_id_fkey" FOREIGN KEY ("occupation_id") REFERENCES "occupations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupation_work_context" ADD CONSTRAINT "occupation_work_context_occupation_id_fkey" FOREIGN KEY ("occupation_id") REFERENCES "occupations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupation_work_styles" ADD CONSTRAINT "occupation_work_styles_occupation_id_fkey" FOREIGN KEY ("occupation_id") REFERENCES "occupations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
