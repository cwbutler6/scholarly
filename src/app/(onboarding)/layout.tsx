import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * Layout for onboarding routes.
 * Only checks authentication - no onboarding redirect to avoid loops.
 */
export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return <>{children}</>;
}
