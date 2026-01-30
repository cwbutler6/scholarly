# Contributing to Scholarly

Welcome to the team! This guide will help you become productive quickly, even if you're new to web development.

## Table of Contents

- [Before You Start](#before-you-start)
- [Understanding the Codebase](#understanding-the-codebase)
- [Development Workflow](#development-workflow)
- [Code Style Guide](#code-style-guide)
- [Working with Components](#working-with-components)
- [Working with the Database](#working-with-the-database)
- [Working with the AI Chat](#working-with-the-ai-chat)
- [Testing Your Changes](#testing-your-changes)
- [Git Workflow](#git-workflow)
- [Common Mistakes to Avoid](#common-mistakes-to-avoid)
- [Glossary](#glossary)

---

## Before You Start

### Required Reading (15 min each)

If you're new to these technologies, spend some time on these:

1. **React Basics** - [React Quick Start](https://react.dev/learn)
2. **TypeScript Basics** - [TypeScript for JavaScript Programmers](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html)
3. **Next.js App Router** - [App Router Tutorial](https://nextjs.org/learn)
4. **Tailwind CSS** - [Core Concepts](https://tailwindcss.com/docs/utility-first)

### Tools to Install

1. **VS Code Extensions:**
   - ESLint (catches code issues)
   - Prettier (formats code)
   - Tailwind CSS IntelliSense (autocomplete for Tailwind)
   - Prisma (syntax highlighting for schema)

2. **Browser Extensions:**
   - React Developer Tools

### Understanding the User Journey

Before coding, understand what users experience:

1. **New User:** Sign up → Onboarding (RIASEC quiz, profile setup) → Dashboard
2. **Returning User:** Sign in → Dashboard → Explore careers → Save favorites → Chat with AI
3. **Career Page:** View details → Watch videos → See conviction score → Save career

---

## Understanding the Codebase

### The Big Picture

```
User clicks button → React component handles it → 
  → API route processes request → Prisma queries database → 
  → Response goes back → UI updates
```

### Key Files to Know

| File | What It Does | When You'll Edit It |
|------|--------------|---------------------|
| `src/lib/careers.ts` | Career queries, conviction score calculation | Adding career features |
| `src/app/api/chat/route.ts` | AI chat with function calling | Adding AI capabilities |
| `src/lib/user.ts` | User-related functions | User profile changes |
| `prisma/schema.prisma` | Database table definitions | Adding new data fields |
| `src/components/ui/*.tsx` | Base UI components | Rarely (they're from shadcn) |

### How Data Flows

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  React Component │ ──▶ │  Server Action   │ ──▶ │   Prisma    │
│  (src/components)│     │  or API Route    │     │  (database) │
└─────────────────┘     └──────────────────┘     └─────────────┘
        ▲                         │
        └─────────────────────────┘
              (data returns)
```

---

## Development Workflow

### Starting Your Day

```bash
# 1. Pull latest changes
git checkout dev
git pull origin dev

# 2. Create a feature branch
git checkout -b feat/your-feature-name

# 3. Start the dev server
pnpm dev

# 4. Open localhost:3000 in your browser
```

### While Coding

1. **Save often** - The dev server hot-reloads
2. **Check the browser console** for errors (F12 → Console)
3. **Check the terminal** for server-side errors
4. **Use Prisma Studio** to inspect data: `pnpm db:studio`

### Before Committing

```bash
# Format your code
pnpm format

# Check for linting errors
pnpm lint

# Fix auto-fixable issues
pnpm lint:fix
```

---

## Code Style Guide

### TypeScript

```typescript
// ✅ Good: Use interface for object shapes
interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ Good: Use explicit types for function parameters and returns
function getUser(id: string): Promise<User | null> {
  return db.user.findUnique({ where: { id } });
}

// ❌ Bad: Using 'any' type
function processData(data: any) { ... }

// ✅ Better: Use 'unknown' and type-guard
function processData(data: unknown) {
  if (typeof data === "string") {
    // Now TypeScript knows it's a string
  }
}
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `CareerCard.tsx` |
| Functions | camelCase | `getCareerById()` |
| Variables | camelCase | `const userName = ...` |
| Constants | SCREAMING_SNAKE_CASE | `const MAX_RETRIES = 3` |
| Files (components) | PascalCase | `CareerCard.tsx` |
| Files (utilities) | camelCase or kebab-case | `formatSalary.ts` or `format-salary.ts` |
| Folders | kebab-case | `career-detail/` |

### Formatting

We use Prettier for consistent formatting. Run before committing:

```bash
pnpm format
```

Settings are in `.prettierrc`:
- 2 spaces for indentation
- Double quotes for strings
- Semicolons required
- Trailing commas

### Comments

```typescript
// ❌ Bad: Comments that describe what the code does (the code already shows this)
// Loop through users and get their names
for (const user of users) {
  names.push(user.name);
}

// ✅ Good: Comments that explain WHY
// We cap at 100 to prevent memory issues with very active users
const recentActivities = activities.slice(0, 100);

// ✅ Good: JSDoc for exported functions
/**
 * Calculates how prepared a student is for a career.
 * 
 * @param userId - The student's database ID
 * @param occupationId - The O*NET occupation code
 * @returns A score from 0-100
 */
export async function calculateConvictionScore(
  userId: string,
  occupationId: string
): Promise<number> {
  // ...
}
```

---

## Working with Components

### Server vs Client Components

**Server Components** (default) run on the server:

```tsx
// src/app/(protected)/careers/page.tsx
// No 'use client' directive = Server Component

import { db } from "@/lib/db";

export default async function CareersPage() {
  // ✅ Can fetch data directly
  const careers = await db.occupation.findMany({ take: 20 });
  
  return (
    <div>
      {careers.map((career) => (
        <div key={career.id}>{career.title}</div>
      ))}
    </div>
  );
}
```

**Client Components** run in the browser:

```tsx
// src/components/career-card.tsx
'use client';  // ← This makes it a Client Component

import { useState } from 'react';

export function CareerCard({ career }) {
  // ✅ Can use hooks and event handlers
  const [saved, setSaved] = useState(false);
  
  return (
    <div onClick={() => setSaved(!saved)}>
      {career.title}
      {saved && '⭐'}
    </div>
  );
}
```

**When to use Client Components:**
- You need `useState`, `useEffect`, or other hooks
- You need event handlers like `onClick`, `onChange`
- You need browser APIs like `localStorage`, `window`

### Component File Structure

```tsx
// 1. Imports
import { db } from "@/lib/db";
import { CareerCard } from "@/components/career-card";

// 2. Types (if needed)
interface PageProps {
  params: { id: string };
}

// 3. Component
export default async function CareerPage({ params }: PageProps) {
  // 4. Data fetching
  const career = await db.occupation.findUnique({
    where: { id: params.id },
  });
  
  // 5. Early returns for error states
  if (!career) {
    return <div>Career not found</div>;
  }
  
  // 6. Main render
  return (
    <main className="p-4">
      <h1>{career.title}</h1>
      <CareerCard career={career} />
    </main>
  );
}
```

### Using shadcn/ui Components

We use shadcn/ui for base components. They're in `src/components/ui/`.

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";

// Usage
<Button variant="outline" size="sm">
  Click me
</Button>

<Card>
  <CardHeader>
    <CardTitle>My Card</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

See all available components: [shadcn/ui docs](https://ui.shadcn.com/docs/components)

---

## Working with the Database

### Prisma Basics

Prisma is our ORM (Object-Relational Mapping). It lets us query the database using TypeScript instead of raw SQL.

```typescript
import { db } from "@/lib/db";

// Find one record
const user = await db.user.findUnique({
  where: { id: "123" },
});

// Find many records
const careers = await db.occupation.findMany({
  where: { brightOutlook: true },
  take: 10,
  orderBy: { title: "asc" },
});

// Include related data
const userWithAssessments = await db.user.findUnique({
  where: { id: "123" },
  include: { assessments: true },
});

// Create a record
const newSave = await db.savedCareer.create({
  data: {
    userId: user.id,
    occupationId: career.id,
  },
});

// Update a record
await db.user.update({
  where: { id: "123" },
  data: { onboardingComplete: true },
});

// Delete a record
await db.savedCareer.delete({
  where: { id: saveId },
});
```

### Making Schema Changes

1. **Edit the schema:**
   ```prisma
   // prisma/schema.prisma
   model User {
     id    String @id
     email String
     bio   String?  // ← Add new field
   }
   ```

2. **Create a migration:**
   ```bash
   pnpm db:migrate
   # Enter a name like "add-user-bio"
   ```

3. **The Prisma client auto-regenerates** with the new types.

### Viewing Your Data

```bash
pnpm db:studio
# Opens a browser at localhost:5555
```

This gives you a visual interface to browse and edit database records.

---

## Working with the AI Chat

### How ScholarlyGPT Works

The AI chat uses the **Vercel AI SDK** with **OpenAI GPT-4o-mini**. It has access to "tools" (functions) that let it query our database.

Location: `src/app/api/chat/route.ts`

### Available AI Tools

| Tool | What It Does |
|------|--------------|
| `getUserProfile` | Gets student's name, grade |
| `getAssessmentResults` | Gets RIASEC scores |
| `getSavedCareers` | Gets bookmarked careers |
| `searchCareers` | Searches careers by query, RIASEC code |
| `getCareerDetails` | Gets full career info (salary, skills, etc.) |
| `getConvictionScore` | Gets readiness score for a career |

### Adding a New AI Tool

```typescript
// In src/app/api/chat/route.ts, inside the tools object:

myNewTool: {
  description: "Describe what this tool does for the AI",
  inputSchema: z.object({
    param1: z.string().describe("Describe this parameter"),
    param2: z.number().optional().describe("Optional param"),
  }),
  execute: async ({ param1, param2 }) => {
    // Query the database or do something
    const result = await db.something.findMany({ ... });
    
    // Return data for the AI to use
    return {
      data: result,
      message: "Found X items",
    };
  },
},
```

### Tips for AI Tools

1. **Be specific in descriptions** - The AI uses them to decide when to call the tool
2. **Return structured data** - Makes it easier for the AI to format responses
3. **Handle errors gracefully** - Return helpful error messages
4. **Keep responses concise** - Large responses use more tokens (costs money)

---

## Testing Your Changes

### Manual Testing Checklist

Before submitting a PR, test:

- [ ] **Happy path** - Does it work as expected?
- [ ] **Error states** - What happens with invalid input?
- [ ] **Empty states** - What shows when there's no data?
- [ ] **Loading states** - Is there feedback while loading?
- [ ] **Mobile view** - Resize browser to phone size
- [ ] **Different users** - Test with new user vs. existing user

### Using Browser Dev Tools

Press **F12** to open dev tools:

- **Console tab** - JavaScript errors show here
- **Network tab** - See API calls and responses
- **React DevTools** - Inspect React component state
- **Application tab** - View cookies, local storage

### Checking the Server

Watch the terminal where `pnpm dev` is running:
- Server-side errors appear here
- Database query errors show here
- API route logs appear here

---

## Git Workflow

### Branch Naming

```
feat/short-description    # New feature
fix/short-description     # Bug fix
refactor/short-description # Code cleanup
docs/short-description    # Documentation
```

Examples:
- `feat/career-recommendations`
- `fix/conviction-score-calculation`
- `docs/update-readme`

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type: short description

Longer description if needed.
```

Types:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Formatting (no code change)
- `refactor:` Code restructuring (no new features)
- `test:` Adding tests
- `chore:` Maintenance (dependencies, configs)

Examples:
```
feat: add conviction score to career detail page

fix: correct salary formatting for high earners

docs: add database diagram to README

refactor: extract career matching logic to separate function
```

### Pull Request Process

1. **Push your branch:**
   ```bash
   git push -u origin feat/your-feature
   ```

2. **Create a PR on GitHub** with:
   - Clear title describing the change
   - Description of what you did
   - Screenshots if it's a UI change
   - Link to the Linear ticket (if applicable)

3. **Address review feedback:**
   ```bash
   # Make changes, then:
   git add .
   git commit -m "fix: address review feedback"
   git push
   ```

4. **After approval**, the PR will be merged by a maintainer.

---

## Common Mistakes to Avoid

### 1. Forgetting 'use client'

```tsx
// ❌ This will error - hooks don't work in Server Components
export default function Page() {
  const [count, setCount] = useState(0);  // Error!
}

// ✅ Add 'use client' at the top
'use client';
export default function Page() {
  const [count, setCount] = useState(0);  // Works
}
```

### 2. Using process.env in Client Components

```tsx
// ❌ NEXT_PUBLIC_ prefix is required for client-side env vars
const apiKey = process.env.SECRET_KEY;  // undefined in browser!

// ✅ Use NEXT_PUBLIC_ prefix for client-side
const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;  // Works
```

### 3. Awaiting Non-Async Functions

```tsx
// ❌ formatSalary is not async - don't await it
const salary = await formatSalary(50000);

// ✅ Just call it directly
const salary = formatSalary(50000);
```

### 4. Mutating State Directly

```tsx
// ❌ Never mutate state directly
const [items, setItems] = useState([]);
items.push(newItem);  // Wrong!

// ✅ Create a new array
setItems([...items, newItem]);
```

### 5. Committing .env Files

```bash
# ❌ Never commit secrets
git add .env
git commit -m "add env"

# ✅ .env is in .gitignore - this is correct
# Just make sure to never force-add it
```

### 6. Not Handling Loading States

```tsx
// ❌ No loading feedback
const [data, setData] = useState(null);
useEffect(() => {
  fetchData().then(setData);
}, []);
return <div>{data.title}</div>;  // Crashes if data is null!

// ✅ Handle loading state
if (!data) return <div>Loading...</div>;
return <div>{data.title}</div>;
```

---

## Glossary

| Term | Meaning |
|------|---------|
| **API Route** | Server-side endpoint in `src/app/api/` that handles HTTP requests |
| **Client Component** | React component that runs in the browser (has `'use client'`) |
| **Clerk** | Authentication service that handles login/signup |
| **Conviction Score** | 0-100 score measuring readiness for a career |
| **CRUD** | Create, Read, Update, Delete - basic database operations |
| **Hook** | React function starting with `use` (useState, useEffect, etc.) |
| **Middleware** | Code that runs between request and response |
| **Migration** | A file that describes a database schema change |
| **O*NET** | US Department of Labor career database |
| **ORM** | Object-Relational Mapping - translates between code and database |
| **Prisma** | Our ORM for database queries |
| **RIASEC** | 6-type career interest model (Realistic, Investigative, Artistic, Social, Enterprising, Conventional) |
| **Route Group** | Folder in parentheses like `(protected)/` - organizes routes without affecting URL |
| **Schema** | Definition of database structure (tables, columns, relationships) |
| **Server Action** | Function that runs on server, called from client |
| **Server Component** | React component that runs on the server (default in Next.js) |
| **shadcn/ui** | Component library we use for UI elements |
| **Tailwind** | CSS utility framework (`className="p-4 bg-blue-500"`) |
| **Vercel** | Hosting platform for Next.js apps |

---

## Questions?

Don't hesitate to ask! Post in the team chat with:
1. What you're trying to do
2. What you've tried
3. Any error messages

We all started somewhere. Good luck! 🚀
