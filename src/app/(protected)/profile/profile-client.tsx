"use client";

import { useState } from "react";
import Image from "next/image";
import { Mail, MapPin, Calendar, GraduationCap } from "lucide-react";
import { EditPersonalInfoModal } from "./edit-personal-info-modal";
import { EditAboutModal } from "./edit-about-modal";
import { EditSkillsModal } from "./edit-skills-modal";
import { EditInterestsModal } from "./edit-interests-modal";
import type { User, Skill, UserSkill, UserInterest } from "@/generated/prisma";

type UserSkillWithSkill = UserSkill & { skill: Skill };

interface ProfileClientProps {
  user: User;
  userSkills: UserSkillWithSkill[];
  userInterests: UserInterest[];
  skillsByCategory: Record<string, Skill[]>;
}

const accountTypeLabels: Record<string, string> = {
  high_school: "High School Student",
  college: "College Student",
  graduate: "Graduate Student",
  professional: "Professional",
};

const accountTypeShort: Record<string, string> = {
  high_school: "High School",
  college: "College",
  graduate: "Graduate",
  professional: "Professional",
};

export function ProfileClient({
  user,
  userSkills,
  userInterests,
  skillsByCategory,
}: ProfileClientProps) {
  const [showPersonalInfoModal, setShowPersonalInfoModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [showInterestsModal, setShowInterestsModal] = useState(false);

  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || "Student";
  const initials =
    [user.firstName?.[0], user.lastName?.[0]].filter(Boolean).join("") || "S";

  const technicalSkills = userSkills.filter(
    (us) => us.skill.category === "onet_skill"
  );
  const programmingSkills = userSkills.filter(
    (us) => us.skill.category === "programming"
  );
  const toolsAndFrameworks = userSkills.filter(
    (us) =>
      us.skill.category === "tools" || us.skill.category === "frameworks"
  );

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 grid grid-cols-3 gap-6">
          <div
            className="flex h-96 flex-col items-start rounded-3xl p-8 text-white"
            style={{
              background: "linear-gradient(180deg, #AD46FF 0%, #D946EF 50%, #F6339A 100%)",
            }}
          >
            <div className="mb-6 flex h-[100px] w-[100px] items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white">
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#AD46FF] to-[#F6339A] text-3xl font-bold text-white">
                {initials}
              </div>
            </div>
            <h1 className="text-4xl font-bold leading-tight">{fullName}</h1>
            <div className="mt-auto w-full">
              <button
                onClick={() => setShowPersonalInfoModal(true)}
                className="w-full rounded-full bg-white/20 px-6 py-3.5 font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30"
              >
                Edit Profile
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6">
            <h2 className="mb-6 text-xl font-bold text-gray-900">
              Personal Info
            </h2>
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{user.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium text-gray-900">
                    {user.location || "Not set"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(user.dateOfBirth) || "Not set"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <GraduationCap className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Account Type</p>
                  <p className="font-medium text-gray-900">
                    {accountTypeLabels[user.accountType || ""] || "Not set"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">About Me</h2>
              <button
                onClick={() => setShowAboutModal(true)}
                className="text-sm font-medium text-[#22C55E] hover:underline"
              >
                Edit
              </button>
            </div>
            {user.bio ? (
              <p className="whitespace-pre-wrap leading-relaxed text-gray-600">
                {user.bio}
              </p>
            ) : (
              <p className="text-gray-400">
                Add a bio to tell others about yourself...
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 rounded-3xl bg-white p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Skills & Interests
              </h2>
              <button
                onClick={() => setShowSkillsModal(true)}
                className="text-sm font-medium text-[#22C55E] hover:underline"
              >
                Edit
              </button>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                {technicalSkills.length > 0 && (
                  <div className="mb-6">
                    <h3 className="mb-4 text-sm font-semibold text-gray-700">
                      Technical Skills
                    </h3>
                    <div className="space-y-4">
                      {technicalSkills.slice(0, 3).map((us) => (
                        <div key={us.id}>
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-800">
                              {us.skill.name}
                            </span>
                            <span className="text-sm text-gray-500">
                              {us.proficiency}%
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-[#3B82F6]"
                              style={{ width: `${us.proficiency}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {programmingSkills.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-gray-700">
                      Programming Languages
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {programmingSkills.map((us) => (
                        <span
                          key={us.id}
                          className="rounded-full border border-[#AD46FF]/20 px-4 py-2 text-[13px] font-medium leading-[19.5px] text-[#9810FA]"
                          style={{
                            background: "linear-gradient(180deg, rgba(173, 70, 255, 0.1) 0%, rgba(246, 51, 154, 0.1) 100%)",
                          }}
                        >
                          {us.skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                {toolsAndFrameworks.length > 0 && (
                  <div className="mb-6">
                    <h3 className="mb-3 text-sm font-semibold text-gray-700">
                      Tools & Frameworks
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {toolsAndFrameworks.map((us) => (
                        <span
                          key={us.id}
                          className="rounded-full border border-[#F0F0F0] bg-[#FAFAFA] px-4 py-2 text-[13px] font-normal leading-[19.5px] text-[#4A5565]"
                        >
                          {us.skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700">
                      General Interests
                    </h3>
                    <button
                      onClick={() => setShowInterestsModal(true)}
                      className="text-xs font-medium text-[#22C55E] hover:underline"
                    >
                      {userInterests.length > 0 ? "Edit" : "+ Add"}
                    </button>
                  </div>
                  {userInterests.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {userInterests.map((interest) => (
                        <span
                          key={interest.id}
                          className="rounded-full border border-[#315A3F]/20 px-4 py-2 text-[13px] font-normal leading-[19.5px] text-[#315A3F]"
                          style={{
                            background: "linear-gradient(180deg, rgba(49, 90, 63, 0.1) 0%, rgba(45, 100, 11, 0.1) 100%)",
                          }}
                        >
                          {interest.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">
                      No interests added yet
                    </p>
                  )}
                </div>
              </div>
            </div>

            {userSkills.length === 0 && userInterests.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="mb-4 text-gray-400">
                  Add skills and interests to showcase your abilities...
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSkillsModal(true)}
                    className="rounded-full bg-[#22C55E] px-4 py-2 text-sm font-medium text-white hover:bg-[#16A34A]"
                  >
                    Add Skills
                  </button>
                  <button
                    onClick={() => setShowInterestsModal(true)}
                    className="rounded-full border border-[#22C55E] px-4 py-2 text-sm font-medium text-[#22C55E] hover:bg-[#22C55E]/10"
                  >
                    Add Interests
                  </button>
                </div>
              </div>
            )}
          </div>

          <div
            className="flex h-[300px] flex-col items-center justify-center rounded-3xl p-8 text-white"
            style={{
              background: "linear-gradient(180deg, #315A3F 0%, #2D640B 100%)",
            }}
          >
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
              <Image
                src="/images/icon-graduation-cap.png"
                alt="Student"
                width={48}
                height={48}
              />
            </div>
            <h3 className="mb-2 text-2xl font-bold">Student Profile</h3>
            <p className="text-center text-white/70">
              {accountTypeShort[user.accountType || ""] || "Student"}
              {user.graduationYear && ` · Class of ${user.graduationYear}`}
            </p>
          </div>
        </div>
      </div>

      {showPersonalInfoModal && (
        <EditPersonalInfoModal
          user={user}
          onClose={() => setShowPersonalInfoModal(false)}
        />
      )}

      {showAboutModal && (
        <EditAboutModal
          bio={user.bio || ""}
          onClose={() => setShowAboutModal(false)}
        />
      )}

      {showSkillsModal && (
        <EditSkillsModal
          userSkills={userSkills}
          skillsByCategory={skillsByCategory}
          onClose={() => setShowSkillsModal(false)}
        />
      )}

      {showInterestsModal && (
        <EditInterestsModal
          userInterests={userInterests}
          onClose={() => setShowInterestsModal(false)}
        />
      )}
    </div>
  );
}
