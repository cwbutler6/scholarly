import Image from "next/image";

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="flex max-w-4xl flex-col items-center gap-8 md:flex-row md:gap-16">
        <div className="flex-shrink-0">
          <Image
            src="/images/students.png"
            alt="Students"
            width={280}
            height={400}
            className="h-auto w-[280px]"
            priority
          />
        </div>

        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          <div className="mb-4 flex items-center gap-2">
            <Image
              src="/images/logo-scholarly.svg"
              alt="Scholarly"
              width={32}
              height={32}
            />
            <span className="text-sm font-medium text-gray-600">
              Scholarly Logo
            </span>
          </div>

          <h1 className="mb-3 text-3xl font-bold text-gray-900">
            Your Next Chapter Starts Here
          </h1>

          <p className="mb-8 text-gray-500">
            Let&apos;s build your profile and start unlocking real opportunities.
          </p>

          <button
            onClick={onNext}
            className="rounded-lg bg-gray-900 px-8 py-3 font-medium text-white transition-colors hover:bg-gray-800"
          >
            Let&apos;s Begin
          </button>
        </div>
      </div>
    </div>
  );
}
