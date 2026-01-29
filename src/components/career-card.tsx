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
    <div className="group relative flex h-[539px] w-[375px] shrink-0 flex-col overflow-hidden rounded-[15px] border border-black/10 bg-[#F0F0F0]">
      <div className="relative h-[270px] w-full overflow-hidden">
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
            "absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-gray-800/60 text-white transition-colors hover:bg-gray-800/80",
            isSaved && "bg-red-500/80 hover:bg-red-500"
          )}
        >
          <Heart className={cn("h-5 w-5", isSaved && "fill-current")} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 
          className="mb-2 truncate text-xl font-bold text-[#0A0A0A]"
          title={title}
        >
          {title}
        </h3>
        <p className="mb-6 line-clamp-2 text-base text-gray-500">{description}</p>

        <div className="mb-6 grid grid-cols-3 divide-x divide-gray-300 text-center">
          <div className="flex flex-col gap-1 px-2">
            <span className="text-lg font-semibold text-green-500">{matchPercent ?? 0}%</span>
            <span className="text-sm text-gray-500">Match</span>
          </div>
          <div className="flex flex-col gap-1 px-2">
            <span className="text-lg font-semibold text-purple-500">{salary ?? "N/A"}</span>
            <span className="text-sm text-gray-500">Salary</span>
          </div>
          <div className="flex flex-col gap-1 px-2">
            <span className="text-lg font-semibold text-green-500">{formatGrowth(growth)}</span>
            <span className="text-sm text-gray-500">Growth</span>
          </div>
        </div>

        <Link
          href={`/careers/${id}`}
          className="mt-auto flex h-11 items-center justify-center gap-1.5 rounded-[12px] bg-[#010101] text-base font-medium text-white transition-colors hover:bg-gray-800"
        >
          View Career
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
