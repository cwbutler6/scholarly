"use client";

import { useState } from "react";
import { WelcomeStep } from "./steps/welcome";
import { ProfileMethodStep } from "./steps/profile-method";
import { BuildProfileStep } from "./steps/build-profile";
import { AssessmentStep } from "./steps/assessment";
import { SkillsStep } from "./steps/skills";

export type OnboardingStep =
  | "welcome"
  | "profile-method"
  | "build-profile"
  | "assessment"
  | "skills";

export default function OnboardingPage() {
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    location: "",
    birthDate: "",
  });

  const updateProfile = (data: Partial<typeof profileData>) => {
    setProfileData((prev) => ({ ...prev, ...data }));
  };

  return (
    <main className="min-h-screen bg-white">
      {step === "welcome" && (
        <WelcomeStep onNext={() => setStep("profile-method")} />
      )}
      {step === "profile-method" && (
        <ProfileMethodStep
          onSelectMethod={(method) => {
            if (method === "build") {
              setStep("build-profile");
            }
            // Resume and LinkedIn would go to their respective flows
          }}
        />
      )}
      {step === "build-profile" && (
        <BuildProfileStep
          profileData={profileData}
          updateProfile={updateProfile}
          onComplete={() => setStep("assessment")}
          onBack={() => setStep("profile-method")}
        />
      )}
      {step === "assessment" && (
        <AssessmentStep
          onComplete={() => setStep("skills")}
          onBack={() => setStep("build-profile")}
        />
      )}
      {step === "skills" && (
        <SkillsStep onBack={() => setStep("assessment")} />
      )}
    </main>
  );
}
