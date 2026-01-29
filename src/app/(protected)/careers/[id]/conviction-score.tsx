"use client";

interface ConvictionScoreProps {
  score: number;
}

export function ConvictionScore({ score }: ConvictionScoreProps) {
  const clampedScore = Math.min(100, Math.max(0, score));

  return (
    <div className="flex w-[320px] flex-col gap-6 rounded-[14px] border border-gray-200 bg-white pb-[1px] pl-[25px] pr-[25px] pt-[25px]">
      <h3 className="text-xl font-semibold leading-7 tracking-[-0.45px] text-gray-900">
        Conviction score
      </h3>

      <div className="relative">
        <svg viewBox="0 0 200 120" className="h-auto w-full">
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="35%" stopColor="#F97316" />
              <stop offset="70%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#FCD34D" />
            </linearGradient>
            <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
          </defs>

          <path
            d="M 15 100 A 85 85 0 0 1 185 100"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="22"
            strokeLinecap="round"
          />

          <path
            d="M 15 100 A 85 85 0 0 1 185 100"
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth="22"
            strokeLinecap="round"
            strokeDasharray={`${(clampedScore / 100) * 267} 267`}
          />

          <text
            x="100"
            y="90"
            textAnchor="middle"
            className="text-5xl font-bold"
            fill="url(#textGradient)"
            style={{ fontSize: "42px", fontWeight: 700 }}
          >
            {clampedScore}%
          </text>

          <text
            x="100"
            y="115"
            textAnchor="middle"
            fill="#6B7280"
            style={{ fontSize: "14px", fontWeight: 500 }}
          >
            Score
          </text>
        </svg>
      </div>
    </div>
  );
}
