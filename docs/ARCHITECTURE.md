# Scholarly Architecture

This document explains how Scholarly is built, why we made certain decisions, and how the pieces fit together.

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │  Dashboard  │  │   Explore   │  │   Career    │  │    Chat     │ │
│  │    Page     │  │    Page     │  │   Detail    │  │    Page     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                            NEXT.JS                                   │
│  ┌─────────────────────────┐  ┌─────────────────────────────────┐   │
│  │    Server Components    │  │         API Routes              │   │
│  │    (Data Fetching)      │  │  /api/chat, /api/careers, etc.  │   │
│  └─────────────────────────┘  └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
       ┌────────────┐  ┌────────────┐  ┌────────────┐
       │  Clerk     │  │  Prisma +  │  │  OpenAI    │
       │  (Auth)    │  │  Postgres  │  │  (AI Chat) │
       └────────────┘  └────────────┘  └────────────┘
```

---

## Core Features & How They Work

### 1. Authentication (Clerk)

**What:** User login, signup, and session management.

**How it works:**

1. User clicks "Sign In" → Redirected to Clerk-hosted page
2. Clerk authenticates → Creates session → Redirects back
3. Our app checks `auth()` to verify user
4. Clerk webhook notifies us when users are created/updated

**Key files:**

- `src/app/(auth)/sign-in/` - Sign in page
- `src/app/api/webhooks/clerk/route.ts` - Handles Clerk events
- `src/proxy.ts` - Route protection middleware

**Why Clerk?** It handles complex auth securely (passwords, OAuth, MFA) so we don't have to.

---

### 2. Career Data (O*NET)

**What:** 900+ occupations with skills, education, salary, and growth data.

**Data source:** [O*NET Web Services](https://services.onetcenter.org/)

**How it works:**

1. `pnpm db:seed` calls O*NET API
2. Data is transformed and stored in our database
3. Users query our database (not O*NET directly)

**Key files:**

- `src/lib/onet/` - API client and data transformation
- `prisma/seed.ts` - Seeding script
- `src/app/api/cron/ingest-onet/` - Scheduled re-sync

**Database tables:**

```
Occupation (main career data)
  ├── OccupationSkill (required skills)
  ├── OccupationKnowledge (knowledge areas)
  ├── OccupationAbility (abilities needed)
  ├── OccupationTechnology (tools/software used)
  ├── OccupationWorkActivity (daily tasks)
  └── OccupationRelation (related careers)
```

**Why store locally?** O*NET has rate limits. Caching locally makes queries instant and free.

---

### 3. RIASEC Assessment

**What:** Personality quiz that identifies career interests.

**The 6 Types:**

| Code | Type | Example Careers |
|------|------|-----------------|
| R | Realistic | Mechanic, Carpenter, Engineer |
| I | Investigative | Scientist, Doctor, Researcher |
| A | Artistic | Designer, Writer, Musician |
| S | Social | Teacher, Counselor, Nurse |
| E | Enterprising | Manager, Salesperson, Lawyer |
| C | Conventional | Accountant, Administrator, Analyst |

**How it works:**

1. User answers questions during onboarding
2. Each answer adds points to one or more RIASEC types
3. Final scores stored in `Assessment` table
4. When browsing careers, we compare user's scores to career's RIASEC profile
5. Higher match = career appears higher in recommendations

**Key files:**

- `src/app/(onboarding)/onboarding/steps/assessment.tsx` - Quiz UI
- `src/lib/careers.ts` → `calculateMatch()` - Matching algorithm

---

### 4. Conviction Score

**What:** A 0-100 score showing how "ready" a student is for a specific career.

**Components:**

| Factor | Weight | What It Measures |
|--------|--------|------------------|
| RIASEC Match | 30% | Do their interests align? |
| Skills Match | 30% | Do they have required skills? |
| Education | 20% | Is their education level sufficient? |
| Engagement | 20% | Have they explored this career? |

**How it works:**

1. User views a career page
2. We fetch their profile, skills, assessment, and engagement data
3. Each component is scored 0-100
4. Weighted average = final conviction score

**Key files:**

- `src/lib/careers.ts` → `calculateConvictionScore()` - Main calculation
- `src/lib/careers.ts` → `getConvictionBreakdown()` - Detailed breakdown
- `src/app/api/careers/conviction/route.ts` - API endpoint

**Design decision:** Scores are calculated on-demand, not stored. This ensures they're always current as users update their profiles.

---

### 5. AI Career Coach (ScholarlyGPT)

**What:** AI chatbot that helps students explore careers.

**Technology:** OpenAI GPT-4o-mini via Vercel AI SDK

**Architecture:**

```
User message
     │
     ▼
┌─────────────────┐
│  /api/chat      │
│  (route.ts)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  streamText()   │ ← Vercel AI SDK
│  + tools        │
└────────┬────────┘
         │
    ┌────┴────┐
    │ OpenAI  │
    │ GPT-4o  │
    └────┬────┘
         │
    Tool calls (if needed)
         │
         ▼
┌─────────────────┐
│  Database       │
│  (via Prisma)   │
└─────────────────┘
```

**Available Tools:**

| Tool | Purpose |
|------|---------|
| `getUserProfile` | Get student's name, grade |
| `getAssessmentResults` | Get RIASEC scores |
| `getSavedCareers` | Get bookmarked careers |
| `searchCareers` | Find careers by query/RIASEC |
| `getCareerDetails` | Get full career info |
| `getConvictionScore` | Get readiness score |

**How tool calling works:**

1. User asks: "What careers match my interests?"
2. AI decides it needs `getAssessmentResults` and `searchCareers`
3. Our code executes those functions against the database
4. Results are sent back to AI
5. AI formulates a human-friendly response

**Key files:**

- `src/app/api/chat/route.ts` - Main chat endpoint with all tools
- `src/components/ai-chat-*.tsx` - Chat UI components
- `src/hooks/use-ai-chat.ts` - Client-side chat state

**Why this approach vs. OpenAI Assistant API?**

- Simpler architecture (stateless)
- Faster (no cold starts)
- Cheaper (no thread storage)
- Easier to debug

---

### 6. Engagement Tracking

**What:** Tracks how users interact with careers.

**What we track:**

- Page views per career
- Time spent on career pages
- Videos watched (and completion)
- Careers saved

**How it works:**

1. Client sends events via API routes
2. Events stored in `CareerEngagement` and `CareerVideoWatch` tables
3. Engagement data feeds into Conviction Score calculation

**Key files:**

- `src/app/api/careers/engagement/route.ts` - Page view tracking
- `src/app/api/careers/video-watch/route.ts` - Video tracking
- `src/hooks/use-video-tracking.ts` - Client-side video hooks

---

### 7. Gamification

**What:** Features to keep students engaged.

**Current features:**

| Feature | Description |
|---------|-------------|
| **Streak Tracking** | Days in a row the user logged in |
| **Question of the Day** | Daily trivia question |
| **Crossword Puzzle** | Career-themed crossword |

**Key files:**

- `src/lib/streaks.ts` - Streak calculation
- `src/lib/questions.ts` - Question of the day
- `src/lib/crossword.ts` - Crossword logic
- `src/components/*-modal.tsx` - UI for each feature

---

## Database Schema Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                             USER DOMAIN                             │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  User ──────┬──── Assessment (RIASEC scores)                        │
│             ├──── UserSkill (skills they have)                      │
│             ├──── UserInterest (their interests)                    │
│             ├──── SavedCareer (bookmarked careers)                  │
│             ├──── CareerEngagement (page views, time)               │
│             ├──── CareerVideoWatch (videos watched)                 │
│             ├──── ChatSession ──── ChatMessage                      │
│             ├──── QuestionAnswer (daily question responses)         │
│             └──── CrosswordProgress                                 │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                           CAREER DOMAIN                             │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Occupation ──┬── OccupationSkill                                   │
│               ├── OccupationKnowledge                               │
│               ├── OccupationAbility                                 │
│               ├── OccupationTechnology                              │
│               ├── OccupationWorkActivity                            │
│               └── OccupationRelation (related careers)              │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                         CONTENT DOMAIN                              │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Question (daily questions)                                         │
│  Crossword (puzzles)                                                │
│  Skill (master list of skills)                                      │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

---

## External Services

| Service | Purpose | When It's Called |
|---------|---------|------------------|
| **Clerk** | Authentication | Every page load, sign in/up |
| **OpenAI** | AI chat responses | When user sends chat message |
| **PostHog** | Analytics | Every page view, user actions |
| **Sentry** | Error monitoring | When errors occur |
| **O*NET** | Career data source | Daily cron job (sync) |
| **Unsplash** | Career images | When career needs an image |
| **Neon (Vercel Postgres)** | Database | Every data operation |

---

## Security Considerations

### Authentication

- All protected routes require valid Clerk session
- `proxy.ts` middleware enforces auth on `/dashboard`, `/explore`, etc.

### API Security

- API routes check `auth()` before processing
- User can only access their own data (enforced in queries)

### Environment Variables

- Secrets stored in `.env` (never committed)
- Client-side vars use `NEXT_PUBLIC_` prefix
- Server-side secrets never exposed to browser

### Database

- Connections use SSL (`sslmode=require`)
- Prisma prevents SQL injection
- Sensitive data (passwords) handled by Clerk, not us

---

## Performance Considerations

### Database Queries

- Use `select` to limit returned fields
- Use `take` to limit result count
- Add indexes for frequently queried columns (already done in schema)

### API Responses

- Career searches limited to reasonable page sizes
- Images fetched and cached (stored in `imageUrl` field)
- Conviction scores calculated on-demand (not stored) to stay current

### Client-Side

- Server Components reduce JS bundle size
- Only use `'use client'` when necessary
- Skeleton loaders for perceived performance

---

## Deployment

### Production Stack

```
Vercel (Hosting)
    ├── Next.js App (Edge Runtime)
    ├── Serverless Functions (API Routes)
    └── Vercel Postgres (Neon)

External Services
    ├── Clerk (Auth)
    ├── OpenAI (AI)
    ├── PostHog (Analytics)
    └── Sentry (Errors)
```

### Environment Separation

| Environment | Database | Purpose |
|-------------|----------|---------|
| Development | Local or shared dev DB | Active development |
| Preview | Vercel preview deployments | PR testing |
| Production | Production DB | Live users |

### CI/CD

1. Push to `dev` branch
2. Vercel creates preview deployment
3. PR reviewed and approved
4. Merged to `main`
5. Vercel deploys to production
6. Prisma migrations run automatically (`pnpm build` includes `prisma migrate deploy`)

---

## Future Architecture Considerations

### Scaling

- Current setup handles thousands of users easily
- If needed: Add Redis for caching, split database reads/writes

### AI Improvements

- Could add conversation history storage
- Could implement RAG with career documents
- Could fine-tune a model on career counseling

### Mobile App

- Could share API routes with a React Native app
- Authentication via Clerk's mobile SDK

---

## Questions?

If something isn't covered here, ask in the team chat!
