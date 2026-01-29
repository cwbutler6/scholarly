import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getOrCreateUser } from "@/lib/user";

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

  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "";
  const isOnboarding = pathname.startsWith("/onboarding");

  if (user && !user.onboardingComplete && !isOnboarding) {
    redirect("/onboarding");
  }

  return <>{children}</>;
}
