"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  DashboardIcon,
  ExploreIcon,
  ChatIcon,
  LearnIcon,
  SavedIcon,
} from "@/components/icons/nav-icons";

const navItems = [
  { href: "/dashboard", icon: DashboardIcon, label: "Dashboard", key: "dashboard", disabled: false },
  { href: "/explore", icon: ExploreIcon, label: "Explore", key: "explore", disabled: false },
  { href: "/chat", icon: ChatIcon, label: "Chat", key: "chat", disabled: false },
  { href: "/learn", icon: LearnIcon, label: "Learn", key: "learn", disabled: true },
  { href: "/saved", icon: SavedIcon, label: "Saved", key: "saved", disabled: true },
];

interface SidebarProps {
  userInitials: string;
  userImageUrl: string | null;
}

export function Sidebar({ userInitials, userImageUrl }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fromParam = searchParams.get("from");
  const isOnCareerPage = pathname.startsWith("/careers/");

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-16 flex-col items-center bg-white py-6 md:flex">
      <nav className="flex flex-1 flex-col items-center justify-center gap-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname.startsWith(item.href + "/") ||
            (isOnCareerPage && fromParam === item.key);
          const Icon = item.icon;

          if (item.disabled) {
            return (
              <div
                key={item.href}
                className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-xl text-[#D4D4D4]"
                title={`${item.label} (Coming Soon)`}
              >
                <Icon />
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                isActive
                  ? "bg-[#FE9900]/10 text-[#FE9900]"
                  : "text-[#9C9C9C] hover:bg-gray-100 hover:text-gray-600"
              )}
              title={item.label}
            >
              <Icon />
            </Link>
          );
        })}

        <Link
          href="/profile"
          className="mt-4"
          title="Profile"
        >
          <div
            className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full ring-[3px] ring-[#FE9900]"
          >
            {userImageUrl ? (
              <Image
                src={userImageUrl}
                alt="Profile"
                width={32}
                height={32}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-purple-500 to-pink-500 text-xs font-bold text-white">
                {userInitials}
              </div>
            )}
          </div>
        </Link>
      </nav>
    </aside>
  );
}
