# Scholarly

Career guidance platform for high school students. Helps students explore career paths, understand their interests through RIASEC assessments, and receive AI-powered personalized recommendations.

## Table of Contents

- [What is Scholarly?](#what-is-scholarly)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Key Concepts](#key-concepts)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

---

## What is Scholarly?

Scholarly helps high school students discover careers that match their interests and skills. Here's what it does:

1. **RIASEC Assessment** - A personality quiz that measures 6 interest types (Realistic, Investigative, Artistic, Social, Enterprising, Conventional)
2. **Career Exploration** - Browse 900+ careers from the O*NET database with salary, education, and skill information
3. **AI Career Coach (ScholarlyGPT)** - Chat with an AI that knows about careers and the student's profile
4. **Conviction Score** - A personalized "readiness score" showing how prepared a student is for a specific career
5. **Engagement Features** - Daily questions, crossword puzzles, and streak tracking to keep students engaged

---

## Tech Stack

| Category | Technology | What It Does |
|----------|------------|--------------|
| **Framework** | Next.js 16 (App Router) | React framework for building the web app |
| **Language** | TypeScript | JavaScript with type safety |
| **Hosting** | Vercel | Where the app runs in production |
| **Database** | Vercel Postgres (Neon) | Stores all user and career data |
| **ORM** | Prisma 7 | Makes database queries easier (like SQL but in TypeScript) |
| **Styling** | Tailwind CSS 4 | Utility-first CSS framework |
| **Components** | shadcn/ui | Pre-built UI components (buttons, modals, etc.) |
| **Auth** | Clerk | Handles user login/signup |
| **Analytics** | PostHog | Tracks user behavior for product insights |
| **Monitoring** | Sentry | Catches and reports errors |
| **AI** | OpenAI + Vercel AI SDK | Powers the ScholarlyGPT chat |

---

## Getting Started

### Prerequisites

Before you start, make sure you have:

- **Node.js 22+** - JavaScript runtime ([download here](https://nodejs.org/))
- **pnpm 10+** - Package manager ([install with `npm install -g pnpm`](https://pnpm.io/installation))
- **Git** - Version control
- **VS Code** (recommended) - Code editor with TypeScript support

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/cwbutler6/scholarly
cd scholarly

# 2. Install dependencies (this also generates the Prisma client)
pnpm install

# 3. Set up environment variables
cp .env.example .env
# Ask a team member for the actual values to put in .env

# 4. Push the database schema (creates tables)
pnpm db:push

# 5. Seed the database with career data (takes ~5 minutes)
pnpm db:seed

# 6. Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### First-Time Setup Checklist

- [ ] Cloned the repo
- [ ] Ran `pnpm install`
- [ ] Created `.env` file with values from team
- [ ] Ran `pnpm db:push`
- [ ] Ran `pnpm db:seed`
- [ ] App runs at localhost:3000

---

## Project Structure

```
scholarly-v2/
├── prisma/
│   ├── schema.prisma      # Database schema (defines all tables)
│   └── seed.ts            # Script to load O*NET career data
│
├── public/
│   └── images/            # Static images (logos, icons)
│
├── src/
│   ├── app/                    # Next.js App Router (all pages live here)
│   │   ├── (auth)/             # Login/signup pages
│   │   │   ├── sign-in/
│   │   │   └── sign-up/
│   │   │
│   │   ├── (onboarding)/       # New user onboarding flow
│   │   │   └── onboarding/
│   │   │       └── steps/      # Each step of onboarding
│   │   │
│   │   ├── (protected)/        # Main app (requires login)
│   │   │   ├── dashboard/      # Home page after login
│   │   │   ├── explore/        # Browse all careers
│   │   │   ├── careers/[id]/   # Individual career detail page
│   │   │   ├── chat/           # Full-page AI chat
│   │   │   └── profile/        # User profile page
│   │   │
│   │   ├── api/                # Backend API routes
│   │   │   ├── chat/           # AI chat endpoint
│   │   │   ├── careers/        # Career-related endpoints
│   │   │   ├── cron/           # Scheduled jobs
│   │   │   └── webhooks/       # External service callbacks
│   │   │
│   │   ├── layout.tsx          # Root layout (wraps all pages)
│   │   ├── page.tsx            # Landing page (/)
│   │   └── globals.css         # Global styles
│   │
│   ├── components/             # Reusable UI components
│   │   ├── ui/                 # shadcn/ui base components
│   │   ├── ai-chat-*.tsx       # AI chat widget components
│   │   ├── career-*.tsx        # Career display components
│   │   └── ...
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── use-ai-chat.ts      # AI chat state management
│   │   └── use-video-tracking.ts
│   │
│   ├── lib/                    # Utility functions & business logic
│   │   ├── db.ts               # Prisma client instance
│   │   ├── careers.ts          # Career queries & conviction score
│   │   ├── user.ts             # User-related functions
│   │   ├── streaks.ts          # Streak tracking logic
│   │   ├── questions.ts        # Question of the day
│   │   ├── crossword.ts        # Crossword puzzle logic
│   │   ├── posthog.tsx         # Analytics setup
│   │   ├── unsplash.ts         # Career image fetching
│   │   ├── utils.ts            # General utilities (cn, etc.)
│   │   └── onet/               # O*NET API integration
│   │
│   ├── generated/              # Auto-generated files (don't edit!)
│   │   └── prisma/             # Prisma client (generated from schema)
│   │
│   └── proxy.ts                # Route protection middleware
│
├── .env.example                # Template for environment variables
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
└── next.config.ts              # Next.js configuration
```

### Understanding Route Groups

Next.js uses **route groups** (folders in parentheses) to organize routes without affecting the URL:

| Folder | URL Path | Purpose |
|--------|----------|---------|
| `(auth)` | `/sign-in`, `/sign-up` | Login pages (no layout) |
| `(onboarding)` | `/onboarding` | New user setup flow |
| `(protected)` | `/dashboard`, `/explore`, etc. | Main app (requires auth) |

---

## Key Concepts

### RIASEC Assessment

RIASEC is a career interest model with 6 types:

| Code | Name | Description |
|------|------|-------------|
| **R** | Realistic | Hands-on, practical work (mechanics, builders) |
| **I** | Investigative | Research, analysis (scientists, doctors) |
| **A** | Artistic | Creative expression (artists, designers) |
| **S** | Social | Helping others (teachers, counselors) |
| **E** | Enterprising | Leadership, sales (managers, entrepreneurs) |
| **C** | Conventional | Organization, data (accountants, administrators) |

Each career in O*NET has scores for all 6 types. We match students to careers by comparing their assessment results to career profiles.

### Conviction Score

The **Conviction Score** (0-100) measures how ready a student is to pursue a specific career:

| Component | Weight | What It Measures |
|-----------|--------|------------------|
| RIASEC Match | 30% | Do their interests align with this career? |
| Skills Match | 30% | Do they have the required skills? |
| Education | 20% | Is their education level appropriate? |
| Engagement | 20% | Have they explored this career (videos, page views)? |

Higher score = more prepared for that career path.

### O*NET Data

O*NET (Occupational Information Network) is the US Department of Labor's database of 900+ occupations. We import this data to populate careers with:

- Job descriptions
- Required skills, knowledge, and abilities
- Salary ranges
- Education requirements
- Growth outlook
- RIASEC scores

### Server Components vs Client Components

Next.js 15+ uses React Server Components by default:

| Type | File Marker | Can Use | Example |
|------|-------------|---------|---------|
| **Server** | (none) | `async/await`, database, secrets | `page.tsx` fetching data |
| **Client** | `'use client'` | `useState`, `onClick`, hooks | Interactive forms |

**Rule of thumb:** Start with Server Components. Add `'use client'` only when you need interactivity.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in values from your team:

```bash
# Database - Connects to Vercel Postgres/Neon
DATABASE_URL="postgres://..."

# Clerk - User authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# OpenAI - Powers ScholarlyGPT
OPENAI_API_KEY="sk-..."

# PostHog - Analytics
NEXT_PUBLIC_POSTHOG_KEY="phc_..."

# Sentry - Error monitoring
NEXT_PUBLIC_SENTRY_DSN="https://..."

# O*NET - Career data API
ONET_API_KEY="your-onet-key"
```

**Important:** Never commit `.env` files. They contain secrets!

---

## Available Scripts

Run these from the project root:

| Command | What It Does |
|---------|--------------|
| `pnpm dev` | Start development server (with hot reload) |
| `pnpm build` | Build for production |
| `pnpm start` | Run production build locally |
| `pnpm lint` | Check for code issues |
| `pnpm lint:fix` | Auto-fix linting issues |
| `pnpm format` | Format all files with Prettier |
| `pnpm format:check` | Check if files are formatted |
| `pnpm db:generate` | Regenerate Prisma client after schema changes |
| `pnpm db:migrate` | Create a new migration (for schema changes) |
| `pnpm db:push` | Push schema to database (dev only, no migration) |
| `pnpm db:studio` | Open Prisma Studio (visual database browser) |
| `pnpm db:seed` | Load O*NET career data into database |

### Common Workflows

**Making a schema change:**

```bash
# 1. Edit prisma/schema.prisma
# 2. Create a migration
pnpm db:migrate
# 3. Name your migration (e.g., "add-user-bio")
```

**Viewing database data:**

```bash
pnpm db:studio
# Opens browser at localhost:5555
```

---

## Common Tasks

### Adding a New Page

1. Create a folder in `src/app/(protected)/your-page/`
2. Add `page.tsx` inside it
3. Export a default component

```tsx
// src/app/(protected)/your-page/page.tsx
export default function YourPage() {
  return (
    <div>
      <h1>Your Page</h1>
    </div>
  );
}
```

### Adding a New API Endpoint

1. Create a folder in `src/app/api/your-endpoint/`
2. Add `route.ts` inside it
3. Export HTTP method handlers

```tsx
// src/app/api/your-endpoint/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Hello!" });
}

export async function POST(request: Request) {
  const body = await request.json();
  // Do something with body
  return NextResponse.json({ success: true });
}
```

### Querying the Database

Use the Prisma client from `@/lib/db`:

```tsx
import { db } from "@/lib/db";

// Get all careers
const careers = await db.occupation.findMany({
  take: 10,
  orderBy: { title: "asc" },
});

// Get a specific user
const user = await db.user.findUnique({
  where: { clerkId: "user_123" },
  include: { assessments: true },
});

// Create a record
await db.savedCareer.create({
  data: {
    userId: user.id,
    occupationId: "15-1252.00",
  },
});
```

### Using the AI Chat

The AI chat is powered by the Vercel AI SDK with OpenAI. See `src/app/api/chat/route.ts` for the implementation.

The AI has access to these **tools** (functions it can call):

| Tool | Description |
|------|-------------|
| `getUserProfile` | Get student's name and grade |
| `getAssessmentResults` | Get RIASEC scores |
| `getSavedCareers` | Get bookmarked careers |
| `searchCareers` | Search careers by query or RIASEC code |
| `getCareerDetails` | Get full info about a specific career |
| `getConvictionScore` | Get readiness score for a career |

---

## Troubleshooting

### "Cannot find module '@/lib/db'"

The Prisma client needs to be generated:

```bash
pnpm db:generate
```

### "Error: DATABASE_URL is not set"

You're missing environment variables:

```bash
cp .env.example .env
# Then fill in the values
```

### "Prisma schema validation error"

Your schema has a syntax error. Check `prisma/schema.prisma` for typos.

### Port 3000 already in use

Another process is using port 3000:

```bash
# Find what's using it
lsof -i :3000
# Kill it
kill -9 <PID>
```

### Database tables are empty

You need to seed the database:

```bash
pnpm db:seed
```

### Clerk redirects to wrong URL

Check your `.env` file has the correct Clerk URLs:

```
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/onboarding"
```

---

## Additional Documentation

- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Development guidelines, code style, Git workflow
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - System architecture, how features work, database design

---

## Getting Help

1. **Check existing code** - Look for similar patterns in the codebase
2. **Read the error message** - They're usually helpful!
3. **Search the docs** - [Next.js](https://nextjs.org/docs), [Prisma](https://prisma.io/docs), [Clerk](https://clerk.com/docs)
4. **Ask the team** - Post in the team chat with:
   - What you're trying to do
   - What you tried
   - The error message

---

## License

Private - All rights reserved.
