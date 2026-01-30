-- AlterTable
ALTER TABLE "occupation_abilities" ADD COLUMN     "element_id" TEXT,
ADD COLUMN     "level" DOUBLE PRECISION,
ALTER COLUMN "importance" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "occupation_skills" ADD COLUMN     "element_id" TEXT,
ADD COLUMN     "level" DOUBLE PRECISION,
ALTER COLUMN "importance" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "occupations" ADD COLUMN     "last_synced" TIMESTAMP(3),
ADD COLUMN     "major_group" TEXT,
ADD COLUMN     "minor_group" TEXT,
ADD COLUMN     "onet_version" TEXT,
ADD COLUMN     "projected_growth" DOUBLE PRECISION,
ADD COLUMN     "projected_openings" INTEGER,
ADD COLUMN     "stem_occupation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "typical_education" TEXT,
ADD COLUMN     "wage_percentile_10" INTEGER,
ADD COLUMN     "wage_percentile_90" INTEGER,
ADD COLUMN     "what_they_do" TEXT,
ALTER COLUMN "riasec_realistic" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "riasec_investigative" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "riasec_artistic" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "riasec_social" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "riasec_enterprising" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "riasec_conventional" SET DATA TYPE DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "occupation_knowledge" (
    "id" TEXT NOT NULL,
    "occupation_id" TEXT NOT NULL,
    "element_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "importance" DOUBLE PRECISION,
    "level" DOUBLE PRECISION,

    CONSTRAINT "occupation_knowledge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occupation_technologies" (
    "id" TEXT NOT NULL,
    "occupation_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hot_technology" BOOLEAN NOT NULL DEFAULT false,
    "category_name" TEXT,

    CONSTRAINT "occupation_technologies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occupation_work_activities" (
    "id" TEXT NOT NULL,
    "occupation_id" TEXT NOT NULL,
    "element_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "importance" DOUBLE PRECISION,
    "level" DOUBLE PRECISION,

    CONSTRAINT "occupation_work_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occupation_relations" (
    "id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "similarity" DOUBLE PRECISION,

    CONSTRAINT "occupation_relations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "occupation_knowledge_name_idx" ON "occupation_knowledge"("name");

-- CreateIndex
CREATE UNIQUE INDEX "occupation_knowledge_occupation_id_element_id_key" ON "occupation_knowledge"("occupation_id", "element_id");

-- CreateIndex
CREATE INDEX "occupation_technologies_hot_technology_idx" ON "occupation_technologies"("hot_technology");

-- CreateIndex
CREATE UNIQUE INDEX "occupation_technologies_occupation_id_name_key" ON "occupation_technologies"("occupation_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "occupation_work_activities_occupation_id_element_id_key" ON "occupation_work_activities"("occupation_id", "element_id");

-- CreateIndex
CREATE UNIQUE INDEX "occupation_relations_source_id_target_id_key" ON "occupation_relations"("source_id", "target_id");

-- CreateIndex
CREATE INDEX "occupation_abilities_name_idx" ON "occupation_abilities"("name");

-- CreateIndex
CREATE INDEX "occupation_skills_name_idx" ON "occupation_skills"("name");

-- CreateIndex
CREATE INDEX "occupations_major_group_idx" ON "occupations"("major_group");

-- AddForeignKey
ALTER TABLE "occupation_knowledge" ADD CONSTRAINT "occupation_knowledge_occupation_id_fkey" FOREIGN KEY ("occupation_id") REFERENCES "occupations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupation_technologies" ADD CONSTRAINT "occupation_technologies_occupation_id_fkey" FOREIGN KEY ("occupation_id") REFERENCES "occupations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupation_work_activities" ADD CONSTRAINT "occupation_work_activities_occupation_id_fkey" FOREIGN KEY ("occupation_id") REFERENCES "occupations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupation_relations" ADD CONSTRAINT "occupation_relations_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "occupations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupation_relations" ADD CONSTRAINT "occupation_relations_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "occupations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
