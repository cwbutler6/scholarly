"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { Menu, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DashboardIcon,
  ExploreIcon,
  ChatIcon,
  LearnIcon,
  SavedIcon,
} from "@/components/icons/nav-icons";

const navItems = [
  { href: "/dashboard", icon: DashboardIcon, label: "Dashboard", key: "dashboard" },
  { href: "/explore", icon: ExploreIcon, label: "Explore", key: "explore" },
  { href: "/chat", icon: ChatIcon, label: "Chat", key: "chat" },
  { href: "/learn", icon: LearnIcon, label: "Learn", key: "learn" },
  { href: "/saved", icon: SavedIcon, label: "Saved", key: "saved" },
];

interface MobileMenuProps {
  userInitials: string;
  userImageUrl: string | null;
}

export function MobileMenu({ userInitials, userImageUrl }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { signOut } = useClerk();
  const fromParam = searchParams.get("from");
  const isOnCareerPage = pathname.startsWith("/careers/");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            <Image
              src="/images/logo-scholarly.svg"
              alt="Scholarly"
              width={28}
              height={28}
            />
            <span className="text-lg font-semibold">Scholarly</span>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-1 p-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href + "/") ||
              (isOnCareerPage && fromParam === item.key);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex h-12 items-center gap-3 rounded-xl px-4 transition-colors",
                  isActive
                    ? "bg-[#FE9900]/10 text-[#FE9900]"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <Icon />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t p-4">
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className={cn(
              "flex h-12 items-center gap-3 rounded-xl px-4 transition-colors",
              pathname === "/profile"
                ? "bg-[#FE9900]/10 text-[#FE9900]"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center overflow-hidden rounded-full",
                pathname === "/profile" && "ring-2 ring-[#FE9900]"
              )}
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
            <span className="font-medium">Profile</span>
          </Link>

          <button
            onClick={() => {
              setOpen(false);
              signOut({ redirectUrl: "/" });
            }}
            className="mt-2 flex h-12 w-full items-center gap-3 rounded-xl px-4 text-gray-600 transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Sign out</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
