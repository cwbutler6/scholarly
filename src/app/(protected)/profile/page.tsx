import { getOrCreateUser } from "@/lib/user";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ProfileClient } from "./profile-client";

async function getProfileData(userId: string) {
  const [user, userSkills, userInterests, allSkills] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
    }),
    db.userSkill.findMany({
      where: { userId },
      include: { skill: true },
      orderBy: { skill: { name: "asc" } },
    }),
    db.userInterest.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    }),
    db.skill.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
  ]);

  return { user, userSkills, userInterests, allSkills };
}

export default async function ProfilePage() {
  const user = await getOrCreateUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { userSkills, userInterests, allSkills } = await getProfileData(
    user.id
  );

  const skillsByCategory = allSkills.reduce(
    (acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = [];
      }
      acc[skill.category].push(skill);
      return acc;
    },
    {} as Record<string, typeof allSkills>
  );

  return (
    <ProfileClient
      user={user}
      userSkills={userSkills}
      userInterests={userInterests}
      skillsByCategory={skillsByCategory}
    />
  );
}
