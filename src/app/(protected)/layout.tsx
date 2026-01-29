import { Suspense } from "react";
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
      <Suspense fallback={<aside className="fixed left-0 top-0 z-40 flex h-screen w-16 flex-col items-center border-r bg-white py-6" />}>
        <Sidebar />
      </Suspense>
      <main className="ml-16 w-0 flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
