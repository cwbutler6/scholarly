import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";

export default async function DashboardPage() {
  const user = await currentUser();

  return (
    <main className="min-h-screen bg-background-subtle p-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome, {user?.firstName || "Student"}!
            </h1>
            <p className="text-foreground-muted">
              Your career exploration journey starts here.
            </p>
          </div>
          <UserButton />
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="mb-2 text-lg font-semibold">RIASEC Assessment</h2>
            <p className="mb-4 text-sm text-foreground-muted">
              Discover your interests and find careers that match your
              personality.
            </p>
            <span className="text-sm text-primary">Coming soon</span>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="mb-2 text-lg font-semibold">Explore Careers</h2>
            <p className="mb-4 text-sm text-foreground-muted">
              Browse hundreds of career paths and find your perfect fit.
            </p>
            <span className="text-sm text-primary">Coming soon</span>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="mb-2 text-lg font-semibold">Career Coach</h2>
            <p className="mb-4 text-sm text-foreground-muted">
              Chat with an AI coach to get personalized career guidance.
            </p>
            <span className="text-sm text-primary">Coming soon</span>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="mb-2 text-lg font-semibold">Saved Careers</h2>
            <p className="mb-4 text-sm text-foreground-muted">
              Track careers you&apos;re interested in and compare them.
            </p>
            <span className="text-sm text-primary">Coming soon</span>
          </div>
        </div>
      </div>
    </main>
  );
}
