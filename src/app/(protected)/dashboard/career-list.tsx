"use client";

import { useState, useTransition } from "react";
import { CareerCard } from "@/components/career-card";
import { toggleSaveCareer, type CareerWithMatch } from "@/lib/careers";

interface CareerListProps {
  initialCareers: CareerWithMatch[];
}

export function CareerList({ initialCareers }: CareerListProps) {
  const [careers, setCareers] = useState(initialCareers);
  const [isPending, startTransition] = useTransition();

  const handleSave = (careerId: string) => {
    startTransition(async () => {
      const isSaved = await toggleSaveCareer(careerId);
      setCareers((prev) =>
        prev.map((career) =>
          career.id === careerId ? { ...career, isSaved } : career
        )
      );
    });
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {careers.length === 0 ? (
        <div className="flex h-48 w-full items-center justify-center text-gray-500">
          <p>No careers found. Check back after O*NET data is imported.</p>
        </div>
      ) : (
        careers.map((career) => (
          <CareerCard
            key={career.id}
            id={career.id}
            title={career.title}
            description={career.description || "Explore this career path"}
            matchPercent={career.matchPercent}
            salary={career.salary || undefined}
            growth={career.growth || undefined}
            isSaved={career.isSaved}
            onSave={() => handleSave(career.id)}
          />
        ))
      )}
    </div>
  );
}
