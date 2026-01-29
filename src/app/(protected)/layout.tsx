import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getOrCreateUser } from "@/lib/user";
import { Sidebar } from "@/components/sidebar";

/**
 * Server Layout Guard for protected routes.
 * Redirects unauthenticated users to sign-in.
 * Redirects users who haven't completed onboarding.
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await getOrCreateUser();

  if (user && !user.onboardingComplete) {
    redirect("/onboarding");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-16 flex-1">{children}</main>
    </div>
  );
}
