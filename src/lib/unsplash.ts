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
 * Generate a consistent hash from a string (for deterministic image selection)
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Search Unsplash for photos matching a query
 * Returns multiple photos to allow for variety
 */
export async function searchPhotos(
  query: string,
  perPage = 10
): Promise<UnsplashPhoto[]> {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn("UNSPLASH_ACCESS_KEY not configured");
    return [];
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
        next: { revalidate: 86400 },
      }
    );

    if (!response.ok) {
      console.error("Unsplash API error:", response.status);
      return [];
    }

    const data: UnsplashSearchResponse = await response.json();
    return data.results;
  } catch (error) {
    console.error("Failed to fetch from Unsplash:", error);
    return [];
  }
}

/**
 * Select a photo deterministically based on career ID
 * This ensures the same career always gets the same image
 */
export function selectPhotoForCareer(
  photos: UnsplashPhoto[],
  careerId: string
): UnsplashPhoto | null {
  if (photos.length === 0) return null;
  const index = hashString(careerId) % photos.length;
  return photos[index];
}

/**
 * Get a career-appropriate search term from occupation title
 * Uses more specific terms to get diverse, relevant images
 */
export function getCareerSearchTerm(title: string): string {
  const lowerTitle = title.toLowerCase();

  const categoryTerms: Record<string, string> = {
    "software developer": "software developer coding laptop",
    "software engineer": "software engineer programming",
    "web developer": "web developer coding computer",
    "data scientist": "data scientist analytics",
    "data analyst": "data analyst charts computer",
    "machine learning": "machine learning AI technology",
    "cybersecurity": "cybersecurity analyst security",
    "network": "network engineer server room",
    "database": "database administrator server",
    "cloud": "cloud computing technology",
    "devops": "devops engineer infrastructure",
    "mobile": "mobile app developer",
    "frontend": "frontend developer design code",
    "backend": "backend developer server",
    "full stack": "full stack developer coding",
    "registered nurse": "registered nurse hospital patient",
    "nurse practitioner": "nurse practitioner healthcare",
    "physician": "physician doctor medical",
    "surgeon": "surgeon operating room",
    "dentist": "dentist dental clinic",
    "pharmacist": "pharmacist pharmacy medicine",
    "physical therapist": "physical therapist rehabilitation",
    "occupational therapist": "occupational therapist therapy",
    "radiologic": "radiologic technologist medical imaging",
    "medical lab": "medical laboratory scientist",
    "teacher": "teacher classroom students",
    "professor": "professor university lecture",
    "instructional": "instructional designer education",
    "mechanical engineer": "mechanical engineer machinery",
    "electrical engineer": "electrical engineer circuits",
    "civil engineer": "civil engineer construction site",
    "chemical engineer": "chemical engineer laboratory",
    "aerospace": "aerospace engineer aircraft",
    "biomedical engineer": "biomedical engineer medical devices",
    "environmental engineer": "environmental engineer sustainability",
    "industrial engineer": "industrial engineer manufacturing",
    "architect": "architect building design blueprints",
    "graphic designer": "graphic designer creative workspace",
    "ux designer": "ux designer interface design",
    "ui designer": "ui designer digital interface",
    "product designer": "product designer prototyping",
    "interior designer": "interior designer home decor",
    "fashion designer": "fashion designer clothing studio",
    "financial analyst": "financial analyst stock market",
    "accountant": "accountant finance spreadsheet",
    "auditor": "auditor financial documents",
    "actuary": "financial analyst statistics office",
    "actuaries": "financial analyst statistics office",
    "investment": "investment banker finance",
    "marketing manager": "marketing manager strategy",
    "sales": "sales representative business meeting",
    "project manager": "project manager team meeting",
    "operations manager": "operations manager warehouse",
    "human resources": "human resources HR office",
    "lawyer": "lawyer legal courtroom",
    "paralegal": "paralegal legal documents",
    "police officer": "police officer law enforcement",
    "firefighter": "firefighter emergency rescue",
    "chef": "chef cooking professional kitchen",
    "electrician": "electrician electrical work",
    "plumber": "plumber pipe repair",
    "carpenter": "carpenter woodworking construction",
    "welder": "welder metal fabrication",
    "hvac": "hvac technician climate systems",
    "automotive": "automotive technician car repair",
    "pilot": "pilot airplane cockpit",
    "biologist": "biologist laboratory research",
    "chemist": "chemist laboratory experiment",
    "physicist": "physicist physics research",
    "geologist": "geologist field research rocks",
    "environmental scientist": "environmental scientist nature",
    "research scientist": "research scientist laboratory",
    "veterinarian": "veterinarian animal care",
    "psychologist": "psychologist therapy session",
    "social worker": "social worker community help",
    "counselor": "counselor therapy office",
  };

  for (const [keyword, searchTerm] of Object.entries(categoryTerms)) {
    if (lowerTitle.includes(keyword)) {
      return searchTerm;
    }
  }

  const words = title.split(/[\s,]+/).slice(0, 3).join(" ");
  return `${words} professional working`;
}

/**
 * Get image URL for a career, with fallback
 * Uses career ID to deterministically select from multiple photos
 */
export async function getCareerImageUrl(
  title: string,
  careerId?: string
): Promise<string | null> {
  const searchTerm = getCareerSearchTerm(title);
  const photos = await searchPhotos(searchTerm, 15);

  if (photos.length === 0) {
    return null;
  }

  if (careerId) {
    const selected = selectPhotoForCareer(photos, careerId);
    return selected?.urls.regular || null;
  }

  return photos[0]?.urls.regular || null;
}
