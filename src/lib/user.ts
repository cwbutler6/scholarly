import { currentUser } from "@clerk/nextjs/server";
import { db } from "./db";

/**
 * Gets or creates the database user for the current Clerk session.
 * Uses upsert to handle race conditions when multiple requests arrive simultaneously.
 */
export async function getOrCreateUser() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress;

  if (!primaryEmail) {
    throw new Error("User has no email address");
  }

  return db.user.upsert({
    where: { clerkId: clerkUser.id },
    update: {
      email: primaryEmail,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
    },
    create: {
      clerkId: clerkUser.id,
      email: primaryEmail,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
    },
  });
}
