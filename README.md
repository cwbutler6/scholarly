# Scholarly

Career guidance platform for high school students. Helps students explore career paths, understand their interests through RIASEC assessments, and receive AI-powered personalized recommendations.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Hosting:** Vercel
- **Database:** Vercel Postgres (Neon)
- **ORM:** Prisma 7.3
- **Styling:** Tailwind CSS 4
- **Components:** shadcn/ui
- **Auth:** Clerk
- **Analytics:** PostHog
- **Monitoring:** Sentry
- **AI:** OpenAI + Vercel AI SDK

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 10+
- Vercel account (for Postgres)
- Clerk account (for auth)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/scholarly-v2.git
cd scholarly-v2

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Fill in your environment variables

# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Seed the database with O*NET data
pnpm db:seed

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (sign-in, sign-up)
│   ├── (app)/             # Protected app routes
│   ├── onboarding/        # Onboarding flow
│   ├── api/               # API Route Handlers
│   ├── proxy.ts           # Route protection (formerly middleware)
│   └── globals.css        # Global styles
├── components/
│   ├── ui/                # shadcn/ui components
│   └── ...                # Feature components
├── lib/
│   ├── db.ts              # Prisma client
│   ├── ai.ts              # OpenAI configuration
│   └── actions/           # Server Actions
└── prisma/
    ├── schema.prisma      # Database schema
    └── seed.ts            # O*NET data seeding
```

## Environment Variables

See `.env.example` for all required environment variables.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server with Turbopack |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format with Prettier |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:push` | Push schema to database |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm db:seed` | Seed database with O*NET data |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## License

Private - All rights reserved.
