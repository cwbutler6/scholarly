import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * Server Layout Guard for protected routes.
 * Redirects unauthenticated users to sign-in.
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

  return <>{children}</>;
}
