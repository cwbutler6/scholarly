/**
 * O*NET Web Services API Client
 *
 * Provides authenticated access to O*NET data with rate limiting and pagination.
 * API Documentation: https://services.onetcenter.org/reference
 *
 * Supports both v1.9 (Basic auth) and v2.0 (X-API-Key).
 * v2.0 keys typically look like alphanumeric strings.
 * v1.9 keys typically look like email:password or username format.
 */

const ONET_API_BASE = "https://services.onetcenter.org/ws";
const RATE_LIMIT_DELAY_MS = 100; // 10 requests per second max

interface OnetClientOptions {
  apiKey?: string;
  authVersion?: "1.9" | "2.0" | "auto";
}

interface PaginatedResponse<T> {
  start: number;
  end: number;
  total: number;
  link?: Array<{ rel: string; href: string }>;
  data: T[];
}

interface OnetOccupation {
  code: string;
  title: string;
  description?: string;
  tags?: {
    bright_outlook?: boolean;
    green?: boolean;
    apprenticeship?: boolean;
  };
}

interface OnetInterests {
  element: Array<{
    id: string;
    name: string;
    score: { value: number };
  }>;
}

interface OnetElement {
  id: string;
  name: string;
  score?: {
    value: number;
    scale?: { id: string; name: string };
  };
}

interface OnetTechnology {
  title: { name: string };
  category?: { name: string };
  hot_technology?: boolean;
}

interface OnetRelatedOccupation {
  code: string;
  title: string;
}

interface OnetJobOutlook {
  bright_outlook?: {
    category: string[];
  };
  salary?: {
    annual_median?: number;
    annual_10th_percentile?: number;
    annual_90th_percentile?: number;
  };
  outlook?: {
    category?: string;
    description?: string;
  };
  education?: {
    education_usually_needed?: {
      category?: string;
    };
  };
}

export class OnetClient {
  private apiKey: string;
  private authVersion: "1.9" | "2.0";
  private lastRequestTime: number = 0;

  constructor(options: OnetClientOptions = {}) {
    const apiKey = options.apiKey || process.env.ONET_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ONET_API_KEY is required. Get one at https://services.onetcenter.org/"
      );
    }
    this.apiKey = apiKey;

    const envAuthVersion = process.env.ONET_AUTH_VERSION as
      | "1.9"
      | "2.0"
      | undefined;
    if (options.authVersion && options.authVersion !== "auto") {
      this.authVersion = options.authVersion;
    } else if (envAuthVersion) {
      this.authVersion = envAuthVersion;
    } else {
      this.authVersion = this.detectAuthVersion(apiKey);
    }
  }

  private detectAuthVersion(apiKey: string): "1.9" | "2.0" {
    if (apiKey.includes("@") || apiKey.includes(":")) {
      return "1.9";
    }
    return "2.0";
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < RATE_LIMIT_DELAY_MS) {
      await new Promise((resolve) =>
        setTimeout(resolve, RATE_LIMIT_DELAY_MS - elapsed)
      );
    }
    this.lastRequestTime = Date.now();
  }

  private getAuthHeaders(): HeadersInit {
    if (this.authVersion === "1.9") {
      const credentials = this.apiKey.includes(":")
        ? this.apiKey
        : `${this.apiKey}:`;
      return {
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(credentials).toString("base64")}`,
      };
    }
    return {
      Accept: "application/json",
      "X-API-Key": this.apiKey,
    };
  }

  private async request<T>(endpoint: string): Promise<T> {
    await this.rateLimit();

    const url = `${ONET_API_BASE}${endpoint}`;
    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`O*NET API error (${response.status}): ${error}`);
    }

    return response.json();
  }

  /**
   * Get all occupations with pagination
   */
  async getAllOccupations(): Promise<OnetOccupation[]> {
    const allOccupations: OnetOccupation[] = [];
    let start = 1;
    const pageSize = 100;

    while (true) {
      const response = await this.request<{
        occupation: OnetOccupation[];
        start: number;
        end: number;
        total: number;
      }>(`/online/occupations?start=${start}&end=${start + pageSize - 1}`);

      if (response.occupation) {
        allOccupations.push(...response.occupation);
      }

      if (response.end >= response.total) {
        break;
      }

      start = response.end + 1;
    }

    return allOccupations;
  }

  /**
   * Get detailed report for an occupation (My Next Move format)
   */
  async getOccupationReport(code: string): Promise<{
    code: string;
    title: string;
    description?: string;
    what_they_do?: string;
    on_the_job?: { task: string[] };
    interests?: OnetInterests;
    job_outlook?: OnetJobOutlook;
  }> {
    return this.request(`/mnm/careers/${code}/report`);
  }

  /**
   * Get skills for an occupation
   */
  async getOccupationSkills(
    code: string
  ): Promise<{ element: OnetElement[] }> {
    return this.request(`/online/occupations/${code}/summary/skills`);
  }

  /**
   * Get knowledge areas for an occupation
   */
  async getOccupationKnowledge(
    code: string
  ): Promise<{ element: OnetElement[] }> {
    return this.request(`/online/occupations/${code}/summary/knowledge`);
  }

  /**
   * Get abilities for an occupation
   */
  async getOccupationAbilities(
    code: string
  ): Promise<{ element: OnetElement[] }> {
    return this.request(`/online/occupations/${code}/summary/abilities`);
  }

  /**
   * Get work activities for an occupation
   */
  async getOccupationWorkActivities(
    code: string
  ): Promise<{ element: OnetElement[] }> {
    return this.request(`/online/occupations/${code}/summary/work_activities`);
  }

  /**
   * Get technology skills for an occupation
   */
  async getOccupationTechnology(
    code: string
  ): Promise<{ category?: Array<{ title: OnetTechnology[] }> }> {
    return this.request(`/online/occupations/${code}/summary/technology_skills`);
  }

  /**
   * Get related occupations
   */
  async getRelatedOccupations(
    code: string
  ): Promise<{ occupation?: OnetRelatedOccupation[] }> {
    return this.request(`/online/occupations/${code}/related`);
  }

  /**
   * Get RIASEC interests for an occupation
   */
  async getOccupationInterests(
    code: string
  ): Promise<{ element: OnetElement[] }> {
    return this.request(`/online/occupations/${code}/summary/interests`);
  }

  /**
   * Get hot technology data
   */
  async getHotTechnologies(): Promise<{
    technology: Array<{ name: string; example: string[] }>;
  }> {
    return this.request("/online/hot_technology");
  }

  /**
   * Search occupations by keyword
   */
  async searchOccupations(
    keyword: string
  ): Promise<{ occupation?: OnetOccupation[] }> {
    return this.request(
      `/online/search?keyword=${encodeURIComponent(keyword)}`
    );
  }

  /**
   * Get occupation details from the database endpoint
   */
  async getOccupationDetails(code: string): Promise<{
    code: string;
    title: string;
    description?: string;
  }> {
    return this.request(`/online/occupations/${code}`);
  }
}

export const createOnetClient = (options?: OnetClientOptions) =>
  new OnetClient(options);
