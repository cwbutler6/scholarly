"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";
import {
  DashboardIcon,
  ExploreIcon,
  ChatIcon,
  LearnIcon,
  SavedIcon,
} from "@/components/icons/nav-icons";

const navItems = [
  { href: "/dashboard", icon: DashboardIcon, label: "Dashboard" },
  { href: "/explore", icon: ExploreIcon, label: "Explore" },
  { href: "/chat", icon: ChatIcon, label: "Chat" },
  { href: "/learn", icon: LearnIcon, label: "Learn" },
  { href: "/saved", icon: SavedIcon, label: "Saved" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-16 flex-col items-center border-r bg-white py-6">
      <nav className="flex flex-1 flex-col items-center justify-center gap-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
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

        <div className="mt-4">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-10 w-10 ring-2 ring-[#FE9900] ring-offset-2",
              },
            }}
          />
        </div>
      </nav>
    </aside>
  );
}
