import { redirect } from "next/navigation";
import { getOrCreateUser } from "@/lib/user";
import { getAssessmentProgress } from "@/lib/assessment";
import { AssessmentClient } from "./assessment-client";

export default async function AssessmentPage() {
  const user = await getOrCreateUser();

  if (!user) {
    redirect("/sign-in");
  }

  const progress = await getAssessmentProgress(user.id);

  if (progress.isComplete) {
    redirect("/dashboard");
  }

  return <AssessmentClient />;
}
