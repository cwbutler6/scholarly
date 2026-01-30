import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  DollarSign,
  TrendingUp,
  GraduationCap,
  Zap,
} from "lucide-react";
import { getCareerById, getRecommendedCareers } from "@/lib/careers";
import { CareerList } from "@/components/career-list";
import { ConvictionScore } from "./conviction-score";
import { CareerTracker } from "./career-tracker";

interface CareerPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}

export default async function CareerPage({
  params,
  searchParams,
}: CareerPageProps) {
  const { id } = await params;
  const { from } = await searchParams;
  const fromSource =
    from === "dashboard" || from === "explore" ? from : undefined;
  const [career, fallbackCareers] = await Promise.all([
    getCareerById(id),
    getRecommendedCareers(10),
  ]);

  if (!career) {
    notFound();
  }

  const relatedCareers =
    career.relatedCareers.length > 0
      ? fallbackCareers.filter((c) =>
          career.relatedCareers.some((r) => r.id === c.id)
        )
      : fallbackCareers.filter((c) => c.id !== career.id);

  const salaryDisplay =
    career.salaryLow && career.salaryHigh
      ? `${career.salaryLow} - ${career.salaryHigh}`
      : career.salaryLow || "N/A";

  const growthDisplay = career.projectedGrowth
    ? `${career.projectedGrowth > 0 ? "+" : ""}${career.projectedGrowth.toFixed(1)}%`
    : career.growth
      ? `+${career.growth.replace(/[^0-9.-]/g, "")}%`
      : "N/A";

  const educationDisplay =
    career.typicalEducation || career.education || "Bachelor's or equivalent";

  const topSkills = career.skills.slice(0, 8);
  const topKnowledge = career.knowledge.slice(0, 6);
  const topAbilities = career.abilities.slice(0, 6);
  const hotTechnologies = career.technologies.filter((t) => t.isHot);
  const otherTechnologies = career.technologies
    .filter((t) => !t.isHot)
    .slice(0, 8);

  return (
    <div className="bg-white">
      <CareerTracker occupationId={career.id} />
      <div className="flex flex-col gap-4 bg-[#FE9900] px-4 py-6 md:gap-6 md:px-8 md:py-10 lg:px-[60px]">
        <Link
          href="/explore"
          className="inline-flex w-fit items-center gap-1 text-sm font-medium text-gray-900 hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Go back
        </Link>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-3">
            {career.category && (
              <span className="w-fit rounded-[30px] bg-[#313035] px-2.5 py-2.5 text-sm font-medium text-white">
                {career.category}
              </span>
            )}
            <h1 className="text-3xl font-bold leading-tight tracking-[0.26px] text-[#4A4A4A] md:text-5xl md:leading-[50px] lg:text-[60px] lg:leading-[60px]">
              {career.title}
            </h1>
            <p className="text-gray-800">
              Brief description of a {career.title.toLowerCase()}
            </p>
          </div>

          <div className="flex w-full flex-col gap-4 rounded-2xl border-t border-white/50 bg-[#E6E6E6]/50 p-4 md:gap-6 md:p-[25px] lg:w-[384px]">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#00BC7D]">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500">AVG. SALARY</p>
                <p className="text-2xl font-bold leading-8 tracking-[0.07px] text-[#4A4A4A]">{salaryDisplay}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#2B7FFF]">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500">GROWTH</p>
                <p className="text-2xl font-bold leading-8 tracking-[0.07px] text-[#4A4A4A]">{growthDisplay}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#AD46FF]">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500">EDUCATION</p>
                <p className="text-lg font-bold leading-7 tracking-[-0.44px] text-[#4A4A4A]">
                  {educationDisplay}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6 flex justify-center md:mb-8">
          <div className="inline-flex rounded-full bg-gray-100 p-1">
            <button className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white md:px-6">
              Overview
            </button>
            <button className="rounded-full px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 md:px-6">
              Videos
            </button>
          </div>
        </div>

        <div className="mb-8 flex flex-col gap-6 md:mb-10 md:flex-row md:gap-8">
          <div className="flex-1">
            <h2 className="mb-3 text-xl font-bold text-gray-900 md:mb-4 md:text-2xl">
              What is a {career.title}?
            </h2>
            <p className="leading-relaxed text-gray-600">
              {career.description ||
                `${career.title}s apply their expertise to various aspects of their field. They are professionals who work on diverse projects and solve complex problems in their area of specialization.`}
            </p>
          </div>
          <div className="flex justify-center md:flex-shrink-0">
            <ConvictionScore score={career.matchPercent} />
          </div>
        </div>

        <section className="border-t border-gray-100 pt-8">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">
            Key Skills & Abilities
          </h2>

          {topSkills.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-center text-sm font-medium text-gray-500">
                Core Skills
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
                {topSkills.map((skill) => (
                  <span
                    key={skill.name}
                    className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {topKnowledge.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-center text-sm font-medium text-gray-500">
                Knowledge Areas
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
                {topKnowledge.map((knowledge) => (
                  <span
                    key={knowledge.name}
                    className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700"
                  >
                    {knowledge.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {topAbilities.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-center text-sm font-medium text-gray-500">
                Key Abilities
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
                {topAbilities.map((ability) => (
                  <span
                    key={ability.name}
                    className="rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-sm text-purple-700"
                  >
                    {ability.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {topSkills.length === 0 &&
            topKnowledge.length === 0 &&
            topAbilities.length === 0 && (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 text-center text-sm font-medium text-gray-500">
                    Core Skills
                  </h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[
                      "Problem Solving",
                      "Analysis",
                      "Communication",
                      "Organization",
                      "Planning",
                    ].map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 text-center text-sm font-medium text-gray-500">
                    Soft Skills
                  </h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[
                      "Teamwork",
                      "Adaptability",
                      "Leadership",
                      "Time Management",
                    ].map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
        </section>

        {(hotTechnologies.length > 0 || otherTechnologies.length > 0) && (
          <section className="mt-8 border-t border-gray-100 pt-8">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              Technologies & Tools
            </h2>

            {hotTechnologies.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 flex items-center justify-center gap-2 text-sm font-medium text-gray-500">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Hot Technologies
                </h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {hotTechnologies.map((tech) => (
                    <span
                      key={tech.name}
                      className="rounded-full border border-yellow-300 bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-800"
                    >
                      {tech.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {otherTechnologies.length > 0 && (
              <div>
                <h3 className="mb-3 text-center text-sm font-medium text-gray-500">
                  Common Tools
                </h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {otherTechnologies.map((tech) => (
                    <span
                      key={tech.name}
                      className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700"
                    >
                      {tech.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <section className="mt-12">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">
            {career.relatedCareers.length > 0
              ? "Related Careers"
              : "Recommended Careers"}
          </h2>
          <CareerList initialCareers={relatedCareers} from={fromSource} />
        </section>
      </div>
    </div>
  );
}
