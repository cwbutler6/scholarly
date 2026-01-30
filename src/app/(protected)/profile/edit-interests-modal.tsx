"use client";

import { useState, useTransition } from "react";
import { X, Plus } from "lucide-react";
import { addUserInterest, removeUserInterest } from "./actions";
import type { UserInterest } from "@/generated/prisma";

interface EditInterestsModalProps {
  userInterests: UserInterest[];
  onClose: () => void;
}

export function EditInterestsModal({
  userInterests,
  onClose,
}: EditInterestsModalProps) {
  const [isPending, startTransition] = useTransition();
  const [newInterest, setNewInterest] = useState("");

  const handleAddInterest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInterest.trim()) return;

    startTransition(async () => {
      await addUserInterest(newInterest);
      setNewInterest("");
    });
  };

  const handleRemoveInterest = (interestId: string) => {
    startTransition(async () => {
      await removeUserInterest(interestId);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Manage Interests</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleAddInterest} className="mb-6 flex gap-2">
          <input
            type="text"
            value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
            placeholder="Add an interest (e.g., Photography, Music, AI)"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={isPending || !newInterest.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </form>

        <div className="mb-6">
          <h3 className="mb-3 text-sm font-medium text-gray-500">
            Your Interests
          </h3>
          {userInterests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {userInterests.map((interest) => (
                <span
                  key={interest.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700"
                >
                  {interest.name}
                  <button
                    onClick={() => handleRemoveInterest(interest.id)}
                    disabled={isPending}
                    className="flex h-4 w-4 items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No interests added yet</p>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 py-2.5 font-medium text-white hover:opacity-90"
        >
          Done
        </button>
      </div>
    </div>
  );
}
