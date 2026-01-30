import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getOrCreateUser } from "@/lib/user";
import { getRecommendedCareers } from "@/lib/careers";
import { getTodaysQuestion } from "@/lib/questions";
import { getTodaysCrossword } from "@/lib/crossword";
import { recordDailyActivity } from "@/lib/streaks";
import { getAssessmentProgress } from "@/lib/assessment";
import { CareerList } from "@/components/career-list";
import {
  DashboardStreakCard,
  DashboardQOTDCard,
  DashboardChallengeCard,
} from "./dashboard-client";
import {
  submitQOTDAnswer,
  useCrosswordHintAction,
  submitCrosswordAction,
  resetCrosswordAction,
  saveCrosswordProgressAction,
} from "./actions";

export default async function DashboardPage() {
  const user = await getOrCreateUser();
  
  const [careers, question, crossword, streak, assessmentProgress] = await Promise.all([
    getRecommendedCareers(10),
    getTodaysQuestion(),
    getTodaysCrossword(),
    recordDailyActivity(),
    user ? getAssessmentProgress(user.id) : null,
  ]);

  const firstName = user?.firstName || "there";

  return (
    <div className="bg-white">
      <div className="px-4 py-4 md:px-6 md:py-6">
        <section className="mb-6">
          <h1 className="text-[28px] font-semibold text-gray-900">
            Welcome, {firstName}!
          </h1>
          <p className="text-sm text-[#2D640B]">
            Track your progress and discover new career paths
          </p>
        </section>

        {!assessmentProgress?.isComplete && (
          <section className="mb-6 rounded-2xl bg-[#315A3F] p-4 text-white md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <h2 className="mb-2 text-xl font-bold md:text-2xl">Complete Your Profile</h2>
                <p className="mb-4 text-base text-white/80 md:text-[22px]">
                  Complete your profile to get personalized career recommendations.
                </p>
                <div className="mb-1 h-3 w-full max-w-2xl overflow-hidden rounded-full bg-[#1E3D2A]">
                  <div 
                    className="h-full rounded-full bg-[#00D26A] transition-all duration-300" 
                    style={{ width: `${Math.max(assessmentProgress?.percentComplete || 0, 5)}%` }}
                  />
                </div>
                <span className="text-sm text-white/60">{assessmentProgress?.percentComplete || 0}%</span>
              </div>
              <Link
                href="/assessment"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-linear-to-r from-[#AD46FF] to-[#F6339A] px-6 text-base font-semibold transition-opacity hover:opacity-90 md:ml-6 md:w-auto"
              >
                {assessmentProgress?.questionsAnswered ? "Continue Assessment" : "Complete Assessment"}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </section>
        )}

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DashboardStreakCard streak={streak} />
          <DashboardQOTDCard
            question={question}
            submitAnswer={submitQOTDAnswer}
          />
          <DashboardChallengeCard
            crossword={crossword}
            onUseHint={useCrosswordHintAction}
            onSubmit={submitCrosswordAction}
            onReset={resetCrosswordAction}
            onSaveProgress={saveCrosswordProgressAction}
          />
        </section>

        <section className="mb-6 rounded-2xl bg-[#F6F6F6] p-4 md:p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recommended Careers</h2>
            <p className="text-sm text-gray-500">Based on your interests and skills</p>
          </div>

          <CareerList initialCareers={careers} from="dashboard" />

          <div className="mt-6 flex justify-center">
            <Link
              href="/explore"
              className="flex h-[54px] w-full items-center justify-center gap-[7px] rounded-[12px] bg-[#FE9900] font-medium text-black transition-colors hover:bg-[#e68a00] md:w-[400px]"
            >
              See All Recommendations
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
