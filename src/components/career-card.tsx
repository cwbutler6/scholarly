"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface CareerCardProps {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  matchPercent?: number;
  salary?: string;
  growth?: string;
  isSaved?: boolean;
  onSave?: () => void;
  from?: "dashboard" | "explore";
}

export function CareerCard({
  id,
  title,
  description,
  imageUrl,
  matchPercent,
  salary,
  growth,
  isSaved = false,
  onSave,
  from,
}: CareerCardProps) {
  const formatGrowth = (g: string | undefined) => {
    if (!g) return "N/A";
    const num = parseFloat(g.replace(/[^0-9.-]/g, ""));
    if (!isNaN(num)) return `↗ ${num}%`;
    if (g.toLowerCase().includes("faster")) return "↗ Fast";
    if (g.toLowerCase().includes("slower")) return "↘ Slow";
    return g;
  };

  return (
    <div className="group relative flex h-auto min-h-[450px] w-[280px] shrink-0 flex-col overflow-hidden rounded-[15px] border border-black/10 bg-[#F0F0F0] md:h-[539px] md:w-[375px]">
      <div className="relative h-[200px] w-full overflow-hidden md:h-[270px]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
            <span className="text-6xl">💼</span>
          </div>
        )}
        <button
          title="Save career"
          onClick={(e) => {
            e.preventDefault();
            onSave?.();
          }}
          className={cn(
            "absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-gray-800/60 text-white transition-colors hover:bg-gray-800/80 md:right-4 md:top-4",
            isSaved && "bg-red-500/80 hover:bg-red-500"
          )}
        >
          <Heart className={cn("h-5 w-5", isSaved && "fill-current")} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4 md:p-5">
        <h3 
          className="mb-2 truncate text-lg font-bold text-[#0A0A0A] md:text-xl"
          title={title}
        >
          {title}
        </h3>
        <p className="mb-4 line-clamp-2 text-sm text-gray-500 md:mb-6 md:text-base">{description}</p>

        <div className="mb-4 grid grid-cols-3 divide-x divide-gray-300 text-center md:mb-6">
          <div className="flex flex-col gap-0.5 px-1 md:gap-1 md:px-2">
            <span className="text-base font-semibold text-green-500 md:text-lg">{matchPercent ?? 0}%</span>
            <span className="text-xs text-gray-500 md:text-sm">Match</span>
          </div>
          <div className="flex flex-col gap-0.5 px-1 md:gap-1 md:px-2">
            <span className="text-base font-semibold text-purple-500 md:text-lg">{salary ?? "N/A"}</span>
            <span className="text-xs text-gray-500 md:text-sm">Salary</span>
          </div>
          <div className="flex flex-col gap-0.5 px-1 md:gap-1 md:px-2">
            <span className="text-base font-semibold text-green-500 md:text-lg">{formatGrowth(growth)}</span>
            <span className="text-xs text-gray-500 md:text-sm">Growth</span>
          </div>
        </div>

        <Link
          href={`/careers/${id}${from ? `?from=${from}` : ""}`}
          className="mt-auto flex h-11 items-center justify-center gap-1.5 rounded-[12px] bg-[#010101] text-base font-medium text-white transition-colors hover:bg-gray-800"
        >
          View Career
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
