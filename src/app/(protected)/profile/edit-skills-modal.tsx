"use client";

import { useState, useTransition } from "react";
import { X, Check, Search } from "lucide-react";
import { addUserSkill, removeUserSkill, updateSkillProficiency } from "./actions";
import type { Skill, UserSkill } from "@/generated/prisma";

type UserSkillWithSkill = UserSkill & { skill: Skill };

interface EditSkillsModalProps {
  userSkills: UserSkillWithSkill[];
  skillsByCategory: Record<string, Skill[]>;
  onClose: () => void;
}

const categoryLabels: Record<string, string> = {
  programming: "Programming Languages",
  frameworks: "Frameworks",
  tools: "Tools",
  onet_skill: "Core Skills",
  onet_knowledge: "Knowledge Areas",
};

const categoryOrder = [
  "programming",
  "frameworks",
  "tools",
  "onet_skill",
  "onet_knowledge",
];

export function EditSkillsModal({
  userSkills,
  skillsByCategory,
  onClose,
}: EditSkillsModalProps) {
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingProficiency, setEditingProficiency] = useState<string | null>(
    null
  );
  const [proficiencyValue, setProficiencyValue] = useState(50);

  const userSkillIds = new Set(userSkills.map((us) => us.skillId));

  const handleToggleSkill = (skill: Skill) => {
    startTransition(async () => {
      if (userSkillIds.has(skill.id)) {
        await removeUserSkill(skill.id);
      } else {
        await addUserSkill(skill.id, 50);
      }
    });
  };

  const handleUpdateProficiency = (skillId: string) => {
    startTransition(async () => {
      await updateSkillProficiency(skillId, proficiencyValue);
      setEditingProficiency(null);
    });
  };

  const filteredCategories = categoryOrder.filter((cat) =>
    skillsByCategory[cat]?.some((skill) =>
      skill.name.toLowerCase().includes(search.toLowerCase())
    )
  );

  const displayCategories = selectedCategory
    ? [selectedCategory]
    : filteredCategories;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">Manage Skills</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b px-6 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search skills..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                !selectedCategory
                  ? "bg-purple-100 text-purple-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            {categoryOrder.map((cat) => (
              <button
                key={cat}
                onClick={() =>
                  setSelectedCategory(selectedCategory === cat ? null : cat)
                }
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-purple-100 text-purple-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {categoryLabels[cat]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {displayCategories.map((category) => {
            const skills = skillsByCategory[category]?.filter((skill) =>
              skill.name.toLowerCase().includes(search.toLowerCase())
            );
            if (!skills || skills.length === 0) return null;

            return (
              <div key={category} className="mb-6">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  {categoryLabels[category]}
                </h3>
                <div className="space-y-2">
                  {skills.map((skill) => {
                    const isSelected = userSkillIds.has(skill.id);
                    const userSkill = userSkills.find(
                      (us) => us.skillId === skill.id
                    );

                    return (
                      <div
                        key={skill.id}
                        className="flex items-center gap-3 rounded-lg border border-gray-200 p-3"
                      >
                        <button
                          onClick={() => handleToggleSkill(skill)}
                          disabled={isPending}
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                            isSelected
                              ? "border-purple-500 bg-purple-500 text-white"
                              : "border-gray-300 hover:border-purple-300"
                          }`}
                        >
                          {isSelected && <Check className="h-4 w-4" />}
                        </button>

                        <span className="flex-1 font-medium text-gray-800">
                          {skill.name}
                        </span>

                        {isSelected && userSkill && (
                          <div className="flex items-center gap-2">
                            {editingProficiency === skill.id ? (
                              <>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={proficiencyValue}
                                  onChange={(e) =>
                                    setProficiencyValue(Number(e.target.value))
                                  }
                                  className="w-24"
                                />
                                <span className="w-10 text-sm text-gray-600">
                                  {proficiencyValue}%
                                </span>
                                <button
                                  onClick={() =>
                                    handleUpdateProficiency(skill.id)
                                  }
                                  disabled={isPending}
                                  className="rounded bg-purple-500 px-2 py-1 text-xs text-white"
                                >
                                  Save
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingProficiency(skill.id);
                                  setProficiencyValue(userSkill.proficiency);
                                }}
                                className="text-sm text-purple-600 hover:underline"
                              >
                                {userSkill.proficiency}%
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 py-2.5 font-medium text-white hover:opacity-90"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
