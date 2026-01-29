const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const UNSPLASH_API_URL = "https://api.unsplash.com";

interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string | null;
  blur_hash: string | null;
}

interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

/**
 * Search Unsplash for photos matching a query
 */
export async function searchPhotos(
  query: string,
  perPage = 1
): Promise<UnsplashPhoto | null> {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn("UNSPLASH_ACCESS_KEY not configured");
    return null;
  }

  try {
    const params = new URLSearchParams({
      query,
      per_page: perPage.toString(),
      orientation: "landscape",
    });

    const response = await fetch(
      `${UNSPLASH_API_URL}/search/photos?${params}`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
        next: { revalidate: 86400 }, // Cache for 24 hours
      }
    );

    if (!response.ok) {
      console.error("Unsplash API error:", response.status);
      return null;
    }

    const data: UnsplashSearchResponse = await response.json();
    return data.results[0] || null;
  } catch (error) {
    console.error("Failed to fetch from Unsplash:", error);
    return null;
  }
}

/**
 * Get a career-appropriate search term from occupation title
 */
export function getCareerSearchTerm(title: string): string {
  const searchTerms: Record<string, string> = {
    "software": "software developer coding",
    "nurse": "nurse healthcare hospital",
    "teacher": "teacher classroom education",
    "engineer": "engineer professional",
    "doctor": "doctor medical healthcare",
    "designer": "designer creative workspace",
    "manager": "business manager office",
    "analyst": "data analyst computer",
    "accountant": "accountant finance office",
    "lawyer": "lawyer legal professional",
    "scientist": "scientist laboratory research",
    "chef": "chef cooking kitchen",
    "mechanic": "mechanic automotive repair",
    "electrician": "electrician working",
    "plumber": "plumber professional",
    "construction": "construction worker building",
    "sales": "sales professional business",
    "marketing": "marketing professional",
    "writer": "writer creative workspace",
    "artist": "artist creative studio",
  };

  const lowerTitle = title.toLowerCase();
  
  for (const [keyword, searchTerm] of Object.entries(searchTerms)) {
    if (lowerTitle.includes(keyword)) {
      return searchTerm;
    }
  }

  return `${title} professional career`;
}

/**
 * Get image URL for a career, with fallback
 */
export async function getCareerImageUrl(title: string): Promise<string | null> {
  const searchTerm = getCareerSearchTerm(title);
  const photo = await searchPhotos(searchTerm);
  
  if (photo) {
    return photo.urls.regular;
  }
  
  return null;
}
