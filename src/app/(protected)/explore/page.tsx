import Image from "next/image";
import Link from "next/link";
import { getRecommendedCareers } from "@/lib/careers";
import { CareerList } from "@/components/career-list";

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
    <div className="bg-white">
      <div className="px-4 py-4 md:px-6">
        <section className="mb-8 md:mb-12">
          <h1 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">
            Recommended Careers
          </h1>
          <p className="mb-4 text-sm text-gray-600 md:mb-6 md:text-base">
            Discover career paths that match your interests and skills
          </p>

          <CareerList initialCareers={careers} from="explore" />
        </section>

        <section>
          <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">Real stories</h2>
          <p className="mb-4 text-sm text-gray-600 md:mb-6 md:text-base">
            Hear from real individuals in the industry
          </p>

          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 md:-mx-6 md:gap-6 md:px-6">
            {realStories.map((story) => (
              <Link
                key={story.id}
                href={`/stories/${story.id}`}
                className="group relative h-52 w-44 shrink-0 overflow-hidden rounded-xl md:h-64 md:w-56"
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
