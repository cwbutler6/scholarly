import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages } from "ai";
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
- Use the available tools to access their profile and assessment data
- Suggest careers that match their interests
- Provide actionable next steps

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
          "Get the user's RIASEC assessment results to understand their interests",
        inputSchema: z.object({}),
        execute: async () => {
          const assessment = await db.assessment.findFirst({
            where: {
              user: { clerkId: userId },
              completedAt: { not: null },
            },
            orderBy: { completedAt: "desc" },
            select: {
              realistic: true,
              investigative: true,
              artistic: true,
              social: true,
              enterprising: true,
              conventional: true,
              completedAt: true,
            },
          });

          if (!assessment) {
            return {
              completed: false,
              message: "No completed assessment found",
            };
          }

          return {
            completed: true,
            scores: assessment,
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
    },
  });

  return result.toUIMessageStreamResponse();
}
