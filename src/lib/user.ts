import { currentUser } from "@clerk/nextjs/server";
import { db } from "./db";

/**
 * Gets or creates the database user for the current Clerk session.
 * Uses just-in-time sync for immediate, reliable user creation.
 */
export async function getOrCreateUser() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const existingUser = await db.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  if (existingUser) {
    return existingUser;
  }

  const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress;

  if (!primaryEmail) {
    throw new Error("User has no email address");
  }

  return db.user.create({
    data: {
      clerkId: clerkUser.id,
      email: primaryEmail,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
    },
  });
}
