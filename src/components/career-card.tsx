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
    if (!isNaN(num)) return `${num}%`;
    if (g.toLowerCase().includes("faster")) return "↗ Fast";
    if (g.toLowerCase().includes("slower")) return "↘ Slow";
    return g;
  };

  return (
    <div className="group relative flex w-[280px] shrink-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-lg">
      <div className="relative h-44 w-full overflow-hidden bg-gray-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
            <span className="text-5xl">💼</span>
          </div>
        )}
        <button
          title="Save career"
          onClick={(e) => {
            e.preventDefault();
            onSave?.();
          }}
          className={cn(
            "absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-gray-800/60 text-white transition-colors hover:bg-gray-800/80",
            isSaved && "bg-red-500/80 hover:bg-red-500"
          )}
        >
          <Heart className={cn("h-4 w-4", isSaved && "fill-current")} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 
          className="mb-1 truncate text-lg font-semibold text-[#0A0A0A]"
          title={title}
        >
          {title}
        </h3>
        <p className="mb-4 line-clamp-2 h-10 text-sm text-gray-500">{description}</p>

        <div className="mt-auto grid grid-cols-3 gap-2 text-center">
          <div className="flex flex-col">
            <span className="text-base font-semibold text-green-500">{matchPercent ?? 0}%</span>
            <span className="text-xs text-gray-500">Match</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold text-purple-500">{salary ?? "N/A"}</span>
            <span className="text-xs text-gray-500">Salary</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold text-green-500">{formatGrowth(growth)}</span>
            <span className="text-xs text-gray-500">Growth</span>
          </div>
        </div>

        <Link
          href={`/careers/${id}`}
          className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#0A0A0A] py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          View Career
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
