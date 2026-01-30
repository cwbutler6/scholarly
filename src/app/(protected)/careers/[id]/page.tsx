import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, DollarSign, TrendingUp, GraduationCap } from "lucide-react";
import { getCareerById, getRecommendedCareers } from "@/lib/careers";
import { CareerList } from "@/components/career-list";
import { ConvictionScore } from "./conviction-score";

interface CareerPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}

export default async function CareerPage({ params, searchParams }: CareerPageProps) {
  const { id } = await params;
  const { from } = await searchParams;
  const fromSource = from === "dashboard" || from === "explore" ? from : undefined;
  const [career, relatedCareers] = await Promise.all([
    getCareerById(id),
    getRecommendedCareers(10),
  ]);

  if (!career) {
    notFound();
  }

  const salaryDisplay =
    career.salaryLow && career.salaryHigh
      ? `${career.salaryLow} - ${career.salaryHigh}`
      : career.salaryLow || "N/A";

  const growthDisplay = career.growth
    ? `+${career.growth.replace(/[^0-9.-]/g, "")}%`
    : "N/A";

  return (
    <div className="bg-white">
      <div className="flex flex-col gap-6 bg-[#FE9900] px-[60px] py-10">
        <Link
          href="/explore"
          className="inline-flex w-fit items-center gap-1 text-sm font-medium text-gray-900 hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Go back
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-3">
            {career.category && (
              <span className="w-fit rounded-[30px] bg-[#313035] px-2.5 py-2.5 text-sm font-medium text-white">
                {career.category}
              </span>
            )}
            <h1 className="text-[60px] font-bold leading-[60px] tracking-[0.26px] text-[#4A4A4A]">
              {career.title}
            </h1>
            <p className="text-gray-800">
              Brief description of a {career.title.toLowerCase()}
            </p>
          </div>

          <div className="flex w-[384px] flex-col gap-6 rounded-2xl border-t border-white/50 bg-[#E6E6E6]/50 p-[25px]">
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
                  {career.education || "Bachelor's or equivalent"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-full bg-gray-100 p-1">
            <button className="rounded-full bg-gray-900 px-6 py-2 text-sm font-medium text-white">
              Overview
            </button>
            <button className="rounded-full px-6 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">
              Videos
            </button>
          </div>
        </div>

        <div className="mb-10 flex gap-8">
          <div className="flex-1">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              What is a {career.title}?
            </h2>
            <p className="leading-relaxed text-gray-600">
              {career.description ||
                `${career.title}s apply their expertise to various aspects of their field. They are professionals who work on diverse projects and solve complex problems in their area of specialization.`}
            </p>
          </div>
          <div className="flex-shrink-0">
            <ConvictionScore score={career.matchPercent} />
          </div>
        </div>

        <section className="border-t border-gray-100 pt-8">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                Key Skills & Abilities
              </h2>

              {career.skills.technical.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 text-center text-sm font-medium text-gray-500">
                    Technical Skills
                  </h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    {career.skills.technical.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {career.skills.soft.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 text-center text-sm font-medium text-gray-500">
                    Soft Skills
                  </h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    {career.skills.soft.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {career.abilities.length > 0 && (
                <div>
                  <h3 className="mb-3 text-center text-sm font-medium text-gray-500">
                    Key Abilities
                  </h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    {career.abilities.map((ability) => (
                      <span
                        key={ability}
                        className="rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-sm text-purple-700"
                      >
                        {ability}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {career.skills.technical.length === 0 &&
                career.skills.soft.length === 0 &&
                career.abilities.length === 0 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="mb-3 text-center text-sm font-medium text-gray-500">
                        Technical Skills
                      </h3>
                      <div className="flex flex-wrap justify-center gap-2">
                        {["Problem Solving", "Analysis", "Communication", "Organization", "Planning"].map((skill) => (
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
                        {["Teamwork", "Adaptability", "Leadership", "Time Management"].map((skill) => (
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

        <section className="mt-12">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">
            Recommended Careers
          </h2>
          <CareerList initialCareers={relatedCareers.filter((c) => c.id !== career.id)} from={fromSource} />
        </section>
      </div>
    </div>
  );
}
