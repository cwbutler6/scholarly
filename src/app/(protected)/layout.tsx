import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getOrCreateUser } from "@/lib/user";

/**
 * Server Layout Guard for protected routes.
 * Redirects unauthenticated users to sign-in.
 * Syncs Clerk user to database on first access.
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

  // JIT sync: create DB user if doesn't exist
  await getOrCreateUser();

  return <>{children}</>;
}
