import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export const maxDuration = 30;

const systemPrompt = `You are a friendly and supportive career coach for high school students. 
Your role is to help students explore career options, understand their interests through 
RIASEC assessments, and provide guidance on educational pathways.

When helping students:
- Be encouraging and positive
- Explain concepts in simple, relatable terms
- Use the available tools to access their profile, assessment data, and career information
- Suggest careers that match their interests
- Provide actionable next steps
- When discussing a specific career, use getCareerDetails to provide accurate information
- When a student asks how ready they are for a career, use getConvictionScore to give personalized feedback
- Use getRecentActivity to understand what the student has been exploring and tailor your advice accordingly

The conviction score (0-100) measures how prepared a student is for a specific career based on:
- RIASEC personality match (30%) - how their interests align
- Skills match (30%) - skills they have vs. skills needed
- Education alignment (20%) - their education level vs. requirements
- Engagement (20%) - how much they've explored the career

IMPORTANT - Be proactive:
- When a student says they completed the assessment, IMMEDIATELY use getAssessmentResults to look up their results and explain what their RIASEC profile means
- After showing results, use searchCareers to suggest 3-5 specific careers that match their top RIASEC types
- Always follow up with actionable guidance - never leave the student hanging
- If a student seems unsure what to do next, take initiative and guide them
- Reference the student's recent activity when giving advice (e.g., "I see you've been exploring software careers...")

If a student hasn't completed their RIASEC assessment, encourage them to do so.`;

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools: {
      getUserProfile: {
        description: "Get the current user's profile information",
        inputSchema: z.object({}),
        execute: async () => {
          const user = await db.user.findUnique({
            where: { clerkId: userId },
            select: {
              firstName: true,
              lastName: true,
              grade: true,
            },
          });
          return user || { message: "User profile not found" };
        },
      },

      getAssessmentResults: {
        description:
          "Get the user's RIASEC assessment results to understand their interests. Returns partial or complete results.",
        inputSchema: z.object({}),
        execute: async () => {
          const assessment = await db.assessment.findFirst({
            where: {
              user: { clerkId: userId },
            },
            orderBy: { createdAt: "desc" },
            select: {
              realistic: true,
              investigative: true,
              artistic: true,
              social: true,
              enterprising: true,
              conventional: true,
              questionsAnswered: true,
              isComplete: true,
              completedAt: true,
            },
          });

          if (!assessment) {
            return {
              hasAssessment: false,
              message: "No assessment found. The student should take the RIASEC assessment.",
            };
          }

          const totalQuestions = 30;
          const isFullyComplete = assessment.isComplete && assessment.completedAt;

          return {
            hasAssessment: true,
            isFullyComplete,
            questionsAnswered: assessment.questionsAnswered,
            totalQuestions,
            scores: {
              realistic: assessment.realistic,
              investigative: assessment.investigative,
              artistic: assessment.artistic,
              social: assessment.social,
              enterprising: assessment.enterprising,
              conventional: assessment.conventional,
            },
            recommendation: isFullyComplete
              ? "Assessment complete - results are accurate"
              : `Student has only answered ${assessment.questionsAnswered} of ${totalQuestions} questions. Use these preliminary scores to give guidance, but encourage completing the full assessment for more accurate career matches.`,
          };
        },
      },

      getSavedCareers: {
        description: "Get the list of careers the user has saved",
        inputSchema: z.object({}),
        execute: async () => {
          const saved = await db.savedCareer.findMany({
            where: { user: { clerkId: userId } },
            include: {
              occupation: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  medianWage: true,
                  brightOutlook: true,
                },
              },
            },
            take: 10,
          });

          return saved.map((s) => ({
            ...s.occupation,
            notes: s.notes,
            savedAt: s.createdAt,
          }));
        },
      },

      searchCareers: {
        description:
          "Search for careers matching specific criteria or RIASEC codes",
        inputSchema: z.object({
          query: z.string().optional().describe("Search term for career title"),
          riasecCode: z
            .string()
            .optional()
            .describe("Primary RIASEC code (R, I, A, S, E, C)"),
          brightOutlook: z
            .boolean()
            .optional()
            .describe("Filter for bright outlook careers"),
          limit: z.number().optional().default(5).describe("Number of results"),
        }),
        execute: async ({
          query,
          riasecCode,
          brightOutlook,
          limit,
        }: {
          query?: string;
          riasecCode?: string;
          brightOutlook?: boolean;
          limit?: number;
        }) => {
          const careers = await db.occupation.findMany({
            where: {
              stemOccupation: true,
              ...(query && {
                title: { contains: query, mode: "insensitive" as const },
              }),
              ...(brightOutlook !== undefined && { brightOutlook }),
            },
            select: {
              id: true,
              title: true,
              description: true,
              medianWage: true,
              brightOutlook: true,
              jobGrowth: true,
              riasecRealistic: true,
              riasecInvestigative: true,
              riasecArtistic: true,
              riasecSocial: true,
              riasecEnterprising: true,
              riasecConventional: true,
            },
            take: limit ?? 5,
          });

          if (riasecCode) {
            const codeMap: Record<string, keyof (typeof careers)[0]> = {
              R: "riasecRealistic",
              I: "riasecInvestigative",
              A: "riasecArtistic",
              S: "riasecSocial",
              E: "riasecEnterprising",
              C: "riasecConventional",
            };
            const field = codeMap[riasecCode.toUpperCase()];
            if (field) {
              return careers.sort(
                (a, b) =>
                  ((b[field] as number) || 0) - ((a[field] as number) || 0)
              );
            }
          }

          return careers;
        },
      },

      getCareerDetails: {
        description:
          "Get detailed information about a specific career including skills, education requirements, salary, and growth outlook",
        inputSchema: z.object({
          careerId: z.string().describe("The ID of the career to get details for"),
        }),
        execute: async ({ careerId }: { careerId: string }) => {
          const occupation = await db.occupation.findFirst({
            where: { id: careerId, stemOccupation: true },
            include: {
              skills: { orderBy: { importance: "desc" }, take: 10 },
              knowledge: { orderBy: { importance: "desc" }, take: 10 },
              technologies: { orderBy: { hotTechnology: "desc" }, take: 10 },
            },
          });

          if (!occupation) {
            return { error: "Career not found or not a STEM career" };
          }

          return {
            id: occupation.id,
            title: occupation.title,
            description: occupation.description,
            whatTheyDo: occupation.whatTheyDo,
            category: occupation.category,
            education: occupation.typicalEducation,
            salaryMedian: occupation.medianWage
              ? `$${Math.round(occupation.medianWage / 1000)}k`
              : null,
            salaryHigh: occupation.medianWageHigh
              ? `$${Math.round(occupation.medianWageHigh / 1000)}k`
              : null,
            growth: occupation.jobGrowth,
            projectedGrowth: occupation.projectedGrowth,
            brightOutlook: occupation.brightOutlook,
            skills: occupation.skills.map((s) => s.name),
            knowledge: occupation.knowledge.map((k) => k.name),
            technologies: occupation.technologies.map((t) => ({
              name: t.name,
              isHot: t.hotTechnology,
            })),
          };
        },
      },

      getConvictionScore: {
        description:
          "Get the user's conviction score for a specific career. The conviction score measures how ready and prepared a student is to pursue this career based on their RIASEC match, skills, education level, and engagement with the career.",
        inputSchema: z.object({
          careerId: z.string().describe("The ID of the career to get conviction score for"),
        }),
        execute: async ({ careerId }: { careerId: string }) => {
          const user = await db.user.findUnique({
            where: { clerkId: userId },
            select: { id: true, accountType: true, graduationYear: true },
          });

          if (!user) {
            return { error: "User not found" };
          }

          const occupation = await db.occupation.findFirst({
            where: { id: careerId, stemOccupation: true },
            select: {
              id: true,
              title: true,
              riasecRealistic: true,
              riasecInvestigative: true,
              riasecArtistic: true,
              riasecSocial: true,
              riasecEnterprising: true,
              riasecConventional: true,
              jobZone: true,
            },
          });

          if (!occupation) {
            return { error: "Career not found or not a STEM career" };
          }

          const [assessment, userSkills, occupationSkills, videoWatches, engagement] =
            await Promise.all([
              db.assessment.findFirst({
                where: { userId: user.id },
                orderBy: { createdAt: "desc" },
              }),
              db.userSkill.findMany({
                where: { userId: user.id },
                include: { skill: true },
              }),
              db.occupationSkill.findMany({
                where: { occupationId: careerId },
              }),
              db.careerVideoWatch.findMany({
                where: { userId: user.id, occupationId: careerId },
              }),
              db.careerEngagement.findUnique({
                where: { userId_occupationId: { userId: user.id, occupationId: careerId } },
              }),
            ]);

          let riasecScore = 50;
          if (assessment) {
            const userTotal =
              assessment.realistic +
              assessment.investigative +
              assessment.artistic +
              assessment.social +
              assessment.enterprising +
              assessment.conventional || 1;
            const occTotal =
              (occupation.riasecRealistic || 0) +
              (occupation.riasecInvestigative || 0) +
              (occupation.riasecArtistic || 0) +
              (occupation.riasecSocial || 0) +
              (occupation.riasecEnterprising || 0) +
              (occupation.riasecConventional || 0) || 1;

            let similarity = 0;
            similarity += (assessment.realistic / userTotal) * ((occupation.riasecRealistic || 0) / occTotal);
            similarity += (assessment.investigative / userTotal) * ((occupation.riasecInvestigative || 0) / occTotal);
            similarity += (assessment.artistic / userTotal) * ((occupation.riasecArtistic || 0) / occTotal);
            similarity += (assessment.social / userTotal) * ((occupation.riasecSocial || 0) / occTotal);
            similarity += (assessment.enterprising / userTotal) * ((occupation.riasecEnterprising || 0) / occTotal);
            similarity += (assessment.conventional / userTotal) * ((occupation.riasecConventional || 0) / occTotal);
            riasecScore = Math.round(similarity * 100);
          }

          let skillsScore = 0;
          if (userSkills.length > 0 && occupationSkills.length > 0) {
            const userSkillNames = new Set(userSkills.map((us) => us.skill.name.toLowerCase()));
            let matched = 0;
            for (const occSkill of occupationSkills) {
              if (userSkillNames.has(occSkill.name.toLowerCase())) {
                matched++;
              }
            }
            skillsScore = Math.round((matched / occupationSkills.length) * 100);
          }

          const educationLevelMap: Record<string, number> = {
            high_school: 2,
            some_college: 3,
            associates: 3,
            bachelors: 4,
            masters: 5,
            doctorate: 5,
          };
          const userEducationLevel = educationLevelMap[user.accountType || "high_school"] || 2;
          const jobZone = occupation.jobZone || 3;
          let educationScore = 50;
          if (userEducationLevel >= jobZone) {
            educationScore = 100;
          } else if (userEducationLevel === jobZone - 1) {
            educationScore = 70;
          } else if (userEducationLevel === jobZone - 2) {
            educationScore = 40;
          } else {
            educationScore = 20;
          }

          const completedVideos = videoWatches.filter((v) => v.completed).length;
          const pageViews = engagement?.pageViews || 0;
          const engagementScore = Math.min(completedVideos * 20 + pageViews * 5, 100);

          const totalScore = Math.round(
            riasecScore * 0.3 +
            skillsScore * 0.3 +
            educationScore * 0.2 +
            engagementScore * 0.2
          );

          return {
            careerId: occupation.id,
            careerTitle: occupation.title,
            totalScore,
            breakdown: {
              riasec: { score: riasecScore, weight: "30%", description: "How well your interests align with this career" },
              skills: { score: skillsScore, weight: "30%", description: "How many required skills you have" },
              education: { score: educationScore, weight: "20%", description: "How your education level matches requirements" },
              engagement: { score: engagementScore, weight: "20%", description: "How much you've explored this career" },
            },
            interpretation:
              totalScore >= 80
                ? "You're highly prepared for this career path!"
                : totalScore >= 60
                  ? "You're on a good track. Keep building relevant skills."
                  : totalScore >= 40
                    ? "This career is a possibility. Focus on developing matching skills and exploring more."
                    : "This may be a stretch goal. Consider building foundational skills first.",
          };
        },
      },

      getRecentActivity: {
        description:
          "Get the user's recent activity to understand their exploration patterns and provide personalized guidance",
        inputSchema: z.object({
          limit: z
            .number()
            .optional()
            .default(20)
            .describe("Number of recent events to retrieve"),
        }),
        execute: async ({ limit }: { limit?: number }) => {
          const user = await db.user.findUnique({
            where: { clerkId: userId },
            select: { id: true },
          });

          if (!user) {
            return { message: "User not found" };
          }

          const events = await db.event.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            take: limit ?? 20,
            select: {
              type: true,
              careerId: true,
              metadata: true,
              createdAt: true,
            },
          });

          const careerIds = [
            ...new Set(events.filter((e) => e.careerId).map((e) => e.careerId)),
          ] as string[];

          const careers =
            careerIds.length > 0
              ? await db.occupation.findMany({
                  where: { id: { in: careerIds } },
                  select: { id: true, title: true },
                })
              : [];

          const careerMap = new Map(careers.map((c) => [c.id, c.title]));

          return {
            recentEvents: events.map((e) => ({
              type: e.type,
              careerTitle: e.careerId ? careerMap.get(e.careerId) : null,
              timestamp: e.createdAt,
              details: e.metadata,
            })),
            summary: {
              totalEvents: events.length,
              uniqueCareersViewed: new Set(
                events.filter((e) => e.type === "career_viewed").map((e) => e.careerId)
              ).size,
              chatMessages: events.filter((e) => e.type === "chat_message_sent").length,
              assessmentActivity: events.some(
                (e) => e.type === "assessment_completed" || e.type === "assessment_started"
              ),
            },
          };
        },
      },
    },
  });

  return result.toUIMessageStreamResponse();
}
