"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getOrCreateUser } from "@/lib/user";

export async function updatePersonalInfo(formData: FormData) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Not authenticated");

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const location = formData.get("location") as string;
  const accountType = formData.get("accountType") as string;
  const graduationYear = formData.get("graduationYear") as string;
  const dateOfBirth = formData.get("dateOfBirth") as string;

  await db.user.update({
    where: { id: user.id },
    data: {
      firstName: firstName || null,
      lastName: lastName || null,
      location: location || null,
      accountType: accountType || null,
      graduationYear: graduationYear ? parseInt(graduationYear, 10) : null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
    },
  });

  revalidatePath("/profile");
}

export async function updateBio(formData: FormData) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Not authenticated");

  const bio = formData.get("bio") as string;

  await db.user.update({
    where: { id: user.id },
    data: { bio: bio || null },
  });

  revalidatePath("/profile");
}

export async function addUserSkill(skillId: string, proficiency: number = 50) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Not authenticated");

  await db.userSkill.upsert({
    where: {
      userId_skillId: { userId: user.id, skillId },
    },
    update: { proficiency },
    create: {
      userId: user.id,
      skillId,
      proficiency,
    },
  });

  revalidatePath("/profile");
}

export async function removeUserSkill(skillId: string) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Not authenticated");

  await db.userSkill.deleteMany({
    where: {
      userId: user.id,
      skillId,
    },
  });

  revalidatePath("/profile");
}

export async function updateSkillProficiency(
  skillId: string,
  proficiency: number
) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Not authenticated");

  await db.userSkill.updateMany({
    where: {
      userId: user.id,
      skillId,
    },
    data: { proficiency },
  });

  revalidatePath("/profile");
}

export async function addUserInterest(name: string) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Not authenticated");

  const trimmedName = name.trim();
  if (!trimmedName) return;

  await db.userInterest.upsert({
    where: {
      userId_name: { userId: user.id, name: trimmedName },
    },
    update: {},
    create: {
      userId: user.id,
      name: trimmedName,
    },
  });

  revalidatePath("/profile");
}

export async function removeUserInterest(interestId: string) {
  const user = await getOrCreateUser();
  if (!user) throw new Error("Not authenticated");

  await db.userInterest.delete({
    where: {
      id: interestId,
      userId: user.id,
    },
  });

  revalidatePath("/profile");
}
