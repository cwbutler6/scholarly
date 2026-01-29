import Image from "next/image";
import Link from "next/link";
import { getRecommendedCareers } from "@/lib/careers";
import { CareerList } from "./career-list";

const realStories = [
  {
    id: "1",
    title: "A Day in the life of a Software Engineer",
    image: "/images/gradient-bg.png",
  },
  {
    id: "2",
    title: "How much do social media marketers make?",
    image: "/images/gradient-bg.png",
  },
  {
    id: "3",
    title: "Let's talk about remote life!",
    image: "/images/gradient-bg.png",
  },
];

export default async function ExplorePage() {
  const careers = await getRecommendedCareers(10);

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <header className="flex items-center justify-between border-b bg-white px-8 py-4">
        <Image
          src="/images/logo-scholarly-full.png"
          alt="Scholarly"
          width={140}
          height={32}
          className="h-8 w-auto"
        />
        <Link
          href="/chat"
          className="flex items-center gap-2 rounded-full bg-[#FF9500] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#E68600]"
        >
          <Image
            src="/images/icon-ai-chat.png"
            alt=""
            width={16}
            height={16}
            className="h-4 w-4"
          />
          AI Chat
        </Link>
      </header>

      <div className="p-8">
        <section className="mb-12">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Recommended Careers
          </h1>
          <p className="mb-6 text-gray-600">
            Discover career paths that match your interests and skills
          </p>

          <CareerList initialCareers={careers} />
        </section>

        <section>
          <h2 className="mb-2 text-3xl font-bold text-gray-900">Real stories</h2>
          <p className="mb-6 text-gray-600">
            Hear from real individuals in the industry
          </p>

          <div className="flex gap-6 overflow-x-auto pb-4">
            {realStories.map((story) => (
              <Link
                key={story.id}
                href={`/stories/${story.id}`}
                className="group relative h-64 w-56 shrink-0 overflow-hidden rounded-xl"
              >
                <Image
                  src={story.image}
                  alt={story.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <h3 className="absolute bottom-4 left-4 right-4 text-lg font-semibold text-white">
                  {story.title}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
