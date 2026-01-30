import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getOrCreateUser } from "@/lib/user";
import { Sidebar } from "@/components/sidebar";
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

  return (
    <ProtectedLayoutClient>
      <div className="flex h-screen">
        <Suspense
          fallback={
            <aside className="fixed left-0 top-0 z-40 flex h-screen w-16 flex-col items-center border-r bg-white py-6" />
          }
        >
          <Sidebar
            userInitials={
              [user?.firstName?.[0], user?.lastName?.[0]]
                .filter(Boolean)
                .join("") || "U"
            }
            userImageUrl={null}
          />
        </Suspense>
        <main className="ml-16 flex w-0 flex-1 flex-col overflow-hidden">
          <HeaderProvider>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </HeaderProvider>
        </main>
      </div>
    </ProtectedLayoutClient>
  );
}
