import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const { userId } = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background-subtle">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-primary">Scholarly</h1>
        <p className="mb-8 text-lg text-foreground-muted">
          Career guidance for high school students
        </p>

        <div className="flex gap-4 justify-center">
          {userId ? (
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/sign-up">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
