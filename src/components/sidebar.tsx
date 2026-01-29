"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";

const navItems = [
  { href: "/dashboard", icon: "/images/icon-grid.png", label: "Dashboard" },
  { href: "/explore", icon: "/images/icon-explore.png", label: "Explore" },
  { href: "/saved", icon: "/images/icon-careers.png", label: "Saved" },
  { href: "/chat", icon: "/images/icon-chat.png", label: "Chat" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-16 flex-col items-center border-r bg-white py-6">
      <Link href="/dashboard" className="mb-8">
        <Image
          src="/images/logo-scholarly.svg"
          alt="Scholarly"
          width={32}
          height={32}
        />
      </Link>

      <nav className="flex flex-1 flex-col items-center gap-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                isActive
                  ? "bg-[#00B2FF]/10"
                  : "hover:bg-gray-100"
              )}
              title={item.label}
            >
              <Image
                src={item.icon}
                alt={item.label}
                width={20}
                height={20}
                className={cn(isActive && "opacity-100", !isActive && "opacity-60")}
              />
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-10 w-10",
            },
          }}
        />
      </div>
    </aside>
  );
}
