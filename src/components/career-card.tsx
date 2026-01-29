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
  return (
    <div className="group relative flex w-[280px] shrink-0 flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative h-40 w-full overflow-hidden bg-gray-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
            <span className="text-4xl">💼</span>
          </div>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            onSave?.();
          }}
          className={cn(
            "absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 transition-colors hover:bg-white",
            isSaved && "text-red-500"
          )}
        >
          <Heart className={cn("h-4 w-4", isSaved && "fill-current")} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-1 font-semibold text-gray-900">{title}</h3>
        <p className="mb-4 line-clamp-2 text-sm text-gray-600">{description}</p>

        <div className="mt-auto flex items-center gap-4 text-xs">
          {matchPercent !== undefined && (
            <div className="flex flex-col">
              <span className="font-bold text-green-600">{matchPercent}%</span>
              <span className="text-gray-500">Match</span>
            </div>
          )}
          {salary && (
            <div className="flex flex-col">
              <span className="font-bold text-[#00B2FF]">{salary}</span>
              <span className="text-gray-500">Salary</span>
            </div>
          )}
          {growth && (
            <div className="flex flex-col">
              <span className="font-bold text-green-600">↗ {growth}</span>
              <span className="text-gray-500">Growth</span>
            </div>
          )}
        </div>

        <Link
          href={`/careers/${id}`}
          className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-[#00B2FF] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#00A0E6]"
        >
          View Career
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
