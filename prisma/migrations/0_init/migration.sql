-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clerk_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "grade" INTEGER,
    "school_id" TEXT,
    "onboarding_complete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'riasec',
    "realistic" INTEGER NOT NULL DEFAULT 0,
    "investigative" INTEGER NOT NULL DEFAULT 0,
    "artistic" INTEGER NOT NULL DEFAULT 0,
    "social" INTEGER NOT NULL DEFAULT 0,
    "enterprising" INTEGER NOT NULL DEFAULT 0,
    "conventional" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_careers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "occupation_id" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_careers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occupations" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "category" TEXT,
    "job_zone" INTEGER,
    "bright_outlook" BOOLEAN NOT NULL DEFAULT false,
    "green_occupation" BOOLEAN NOT NULL DEFAULT false,
    "education" TEXT,
    "riasec_realistic" INTEGER,
    "riasec_investigative" INTEGER,
    "riasec_artistic" INTEGER,
    "riasec_social" INTEGER,
    "riasec_enterprising" INTEGER,
    "riasec_conventional" INTEGER,
    "median_wage" INTEGER,
    "median_wage_high" INTEGER,
    "job_growth" TEXT,
    "total_employment" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "occupations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occupation_skills" (
    "id" TEXT NOT NULL,
    "occupation_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'technical',
    "importance" INTEGER,

    CONSTRAINT "occupation_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occupation_abilities" (
    "id" TEXT NOT NULL,
    "occupation_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "importance" INTEGER,

    CONSTRAINT "occupation_abilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_clerk_id_key" ON "users"("clerk_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "saved_careers_user_id_occupation_id_key" ON "saved_careers"("user_id", "occupation_id");

-- CreateIndex
CREATE INDEX "occupations_job_zone_idx" ON "occupations"("job_zone");

-- CreateIndex
CREATE INDEX "occupations_bright_outlook_idx" ON "occupations"("bright_outlook");

-- CreateIndex
CREATE INDEX "occupations_category_idx" ON "occupations"("category");

-- CreateIndex
CREATE UNIQUE INDEX "occupation_skills_occupation_id_name_key" ON "occupation_skills"("occupation_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "occupation_abilities_occupation_id_name_key" ON "occupation_abilities"("occupation_id", "name");

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_careers" ADD CONSTRAINT "saved_careers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_careers" ADD CONSTRAINT "saved_careers_occupation_id_fkey" FOREIGN KEY ("occupation_id") REFERENCES "occupations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupation_skills" ADD CONSTRAINT "occupation_skills_occupation_id_fkey" FOREIGN KEY ("occupation_id") REFERENCES "occupations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupation_abilities" ADD CONSTRAINT "occupation_abilities_occupation_id_fkey" FOREIGN KEY ("occupation_id") REFERENCES "occupations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

