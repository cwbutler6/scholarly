import Image from "next/image";

interface ProfileMethodStepProps {
  onSelectMethod: (method: "resume" | "linkedin" | "build") => void;
}

const methods = [
  {
    id: "resume" as const,
    icon: "/images/icon-resume.png",
    title: "Upload your resume",
    description: "Brief description of resume upload",
  },
  {
    id: "linkedin" as const,
    icon: "/images/icon-linkedin.png",
    title: "Connect my LinkedIn",
    description: "Brief description of connecting LinkedIn",
  },
  {
    id: "build" as const,
    icon: "/images/icon-build-profile.png",
    title: "Build your profile",
    description: "Brief description on building your profile",
  },
];

export function ProfileMethodStep({ onSelectMethod }: ProfileMethodStepProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-3xl text-center">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Let&apos;s build out your profile
        </h1>
        <p className="mb-12 text-gray-500">
          Upload a resume, LinkedIn profile or add details yourself
        </p>

        <div className="grid gap-6 md:grid-cols-3">
          {methods.map((method) => (
            <button
              key={method.id}
              onClick={() => onSelectMethod(method.id)}
              className="group flex flex-col items-center rounded-xl border-2 border-gray-200 p-6 transition-all hover:border-blue-400 hover:bg-blue-50"
            >
              <div className="mb-4 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 p-4">
                <Image
                  src={method.icon}
                  alt={method.title}
                  width={80}
                  height={80}
                  className="h-20 w-20"
                />
              </div>
              <h3 className="mb-1 font-semibold text-gray-900">
                {method.title}
              </h3>
              <p className="text-sm text-gray-500">{method.description}</p>
            </button>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <button
            onClick={() => onSelectMethod("build")}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-white transition-colors hover:bg-gray-700"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
