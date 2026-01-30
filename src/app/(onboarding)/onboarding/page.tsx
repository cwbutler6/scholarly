"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
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

const STORAGE_KEY = "scholarly_onboarding";

interface OnboardingState {
  step: OnboardingStep;
  profileData: {
    name: string;
    email: string;
    location: string;
    birthDate: string;
  };
}

function loadState(): Partial<OnboardingState> | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function saveState(state: Partial<OnboardingState>) {
  if (typeof window === "undefined") return;
  try {
    const existing = loadState() || {};
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...state }));
  } catch {
    // localStorage unavailable
  }
}

export function clearOnboardingState() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

function getInitialState() {
  const saved = loadState();
  return {
    step: saved?.step || ("welcome" as OnboardingStep),
    profileData: {
      name: saved?.profileData?.name || "",
      email: saved?.profileData?.email || "",
      location: saved?.profileData?.location || "",
      birthDate: saved?.profileData?.birthDate || "",
    },
  };
}

export default function OnboardingPage() {
  const { user } = useUser();
  const [isClient, setIsClient] = useState(false);
  
  const initialState = useMemo(() => {
    if (!isClient) return null;
    return getInitialState();
  }, [isClient]);

  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    location: "",
    birthDate: "",
  });
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (initialState && !isHydrated) {
      setStep(initialState.step);
      setProfileData(initialState.profileData);
      setIsHydrated(true);
    }
  }, [initialState, isHydrated]);

  useEffect(() => {
    if (user && isHydrated && !profileData.name && !profileData.email) {
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
      const email = user.primaryEmailAddress?.emailAddress || "";
      if (fullName || email) {
        setProfileData((prev) => ({
          ...prev,
          name: prev.name || fullName,
          email: prev.email || email,
        }));
      }
    }
  }, [user, isHydrated, profileData.name, profileData.email]);

  useEffect(() => {
    if (isHydrated) {
      saveState({ step });
    }
  }, [step, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      saveState({ profileData });
    }
  }, [profileData, isHydrated]);

  const updateProfile = (data: Partial<typeof profileData>) => {
    setProfileData((prev) => ({ ...prev, ...data }));
  };

  if (!isHydrated) {
    return <main className="min-h-screen bg-white" />;
  }

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
          onComplete={() => {
            clearOnboardingState();
            setStep("skills");
          }}
          onBack={() => setStep("profile-method")}
        />
      )}
      {step === "skills" && (
        <SkillsStep onBack={() => setStep("assessment")} />
      )}
    </main>
  );
}
