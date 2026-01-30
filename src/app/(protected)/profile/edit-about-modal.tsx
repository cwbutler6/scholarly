"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { updateBio } from "./actions";

interface EditAboutModalProps {
  bio: string;
  onClose: () => void;
}

export function EditAboutModal({ bio, onClose }: EditAboutModalProps) {
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(bio);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.set("bio", value);

    startTransition(async () => {
      await updateBio(formData);
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-4 shadow-xl sm:max-w-lg sm:rounded-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between sm:mb-6">
          <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Edit About</h2>
          <button
            title="Close"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 sm:h-8 sm:w-8"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Tell others about yourself, your goals, and what you're passionate about..."
            rows={6}
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />

          <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="h-11 rounded-lg bg-linear-to-r from-purple-500 to-pink-500 px-6 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
