import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getOrCreateUser } from "@/lib/user";
import { Sidebar } from "@/components/sidebar";
import { MobileMenu } from "@/components/mobile-menu";
import { ProtectedLayoutClient } from "@/components/protected-layout-client";
import { HeaderProvider } from "@/components/header";

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

  const userInitials =
    [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join("") || "U";

  return (
    <ProtectedLayoutClient>
      <div className="flex h-screen">
        <Suspense
          fallback={
            <aside className="fixed left-0 top-0 z-40 hidden h-screen w-16 flex-col items-center border-r bg-white py-6 md:flex" />
          }
        >
          <Sidebar userInitials={userInitials} userImageUrl={null} />
        </Suspense>
        <main className="flex w-full flex-1 flex-col overflow-hidden md:ml-16 md:w-0">
          <HeaderProvider
            mobileMenu={
              <MobileMenu userInitials={userInitials} userImageUrl={null} />
            }
          >
            <div className="flex-1 overflow-y-auto">{children}</div>
          </HeaderProvider>
        </main>
      </div>
    </ProtectedLayoutClient>
  );
}
