/**
 * O*NET Web Services API Client (Version 2.0)
 *
 * Provides authenticated access to O*NET data with rate limiting and pagination.
 * API Documentation: https://services.onetcenter.org/reference
 *
 * Uses X-API-Key header authentication (v2.0 only).
 * Get an API key at: https://services.onetcenter.org/developer/
 */

const ONET_API_BASE_V2 = "https://api-v2.onetcenter.org";
const RATE_LIMIT_DELAY_MS = 100; // 10 requests per second max

interface OnetClientOptions {
  apiKey?: string;
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
  importance?: number;
  level?: number;
  occupational_interest?: number; // For interests endpoint
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
  private lastRequestTime: number = 0;

  constructor(options: OnetClientOptions = {}) {
    const apiKey = options.apiKey || process.env.ONET_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ONET_API_KEY is required. Get one at https://services.onetcenter.org/developer/"
      );
    }
    this.apiKey = apiKey;
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

  private async request<T>(endpoint: string): Promise<T> {
    await this.rateLimit();

    const url = `${ONET_API_BASE_V2}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        "X-API-Key": this.apiKey,
        "User-Agent": "scholarly/2.0",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`O*NET API error (${response.status}): ${error}`);
    }

    return response.json();
  }

  /**
   * Get all occupations with pagination (v2 API)
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
      }>(`/online/occupations/?start=${start}&end=${start + pageSize - 1}`);

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
   * Get skills for an occupation (with importance scores)
   */
  async getOccupationSkills(
    code: string
  ): Promise<{ element: OnetElement[] }> {
    return this.request(`/online/occupations/${code}/details/skills`);
  }

  /**
   * Get knowledge areas for an occupation (with importance scores)
   */
  async getOccupationKnowledge(
    code: string
  ): Promise<{ element: OnetElement[] }> {
    return this.request(`/online/occupations/${code}/details/knowledge`);
  }

  /**
   * Get abilities for an occupation (with importance scores)
   */
  async getOccupationAbilities(
    code: string
  ): Promise<{ element: OnetElement[] }> {
    return this.request(`/online/occupations/${code}/details/abilities`);
  }

  /**
   * Get work activities for an occupation (with importance scores)
   */
  async getOccupationWorkActivities(
    code: string
  ): Promise<{ element: OnetElement[] }> {
    return this.request(`/online/occupations/${code}/details/work_activities`);
  }

  /**
   * Get technology skills for an occupation
   */
  async getOccupationTechnology(
    code: string
  ): Promise<{
    category?: Array<{
      title: string;
      example?: Array<{ title: string; hot_technology?: boolean }>;
    }>;
  }> {
    return this.request(`/online/occupations/${code}/summary/technology_skills`);
  }

  /**
   * Get related occupations
   */
  async getRelatedOccupations(
    code: string
  ): Promise<{ occupation?: OnetRelatedOccupation[] }> {
    return this.request(`/online/occupations/${code}/summary/related_occupations`);
  }

  /**
   * Get RIASEC interests for an occupation (with occupational_interest scores)
   */
  async getOccupationInterests(
    code: string
  ): Promise<{ element: OnetElement[] }> {
    return this.request(`/online/occupations/${code}/details/interests`);
  }

  /**
   * Get Job Zone (education level) for an occupation
   */
  async getOccupationJobZone(code: string): Promise<{
    code: number;
    title: string;
    education: string;
    related_experience: string;
    job_training: string;
  }> {
    return this.request(`/online/occupations/${code}/summary/job_zone`);
  }

  /**
   * Get tasks for an occupation
   */
  async getOccupationTasks(
    code: string
  ): Promise<{ task?: Array<{ id: string; title: string; importance?: number }> }> {
    return this.request(`/online/occupations/${code}/summary/tasks`);
  }

  /**
   * Get education details for an occupation
   */
  async getOccupationEducation(code: string): Promise<{
    level?: Array<{ name: string; percent: number }>;
  }> {
    return this.request(`/online/occupations/${code}/summary/education`);
  }

  /**
   * Get hot technology data
   */
  async getHotTechnologies(): Promise<{
    technology: Array<{ name: string; example: string[] }>;
  }> {
    return this.request("/online/hot_technology/");
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
   * Get occupation details (overview)
   */
  async getOccupationDetails(code: string): Promise<{
    code: string;
    title: string;
    description?: string;
    tags?: { bright_outlook?: boolean };
    sample_of_reported_titles?: string[];
  }> {
    return this.request(`/online/occupations/${code}/`);
  }

  /**
   * Get My Next Move career report (includes salary, outlook, easy-read content)
   */
  async getMnmCareerReport(code: string): Promise<{
    code: string;
    title: string;
    what_they_do?: string;
    on_the_job?: { task: string[] };
    job_outlook?: OnetJobOutlook;
  }> {
    return this.request(`/mnm/careers/${code}/`);
  }

  /**
   * Get My Next Move job outlook for an occupation
   */
  async getMnmJobOutlook(code: string): Promise<OnetJobOutlook> {
    return this.request(`/mnm/careers/${code}/job_outlook`);
  }

  /**
   * Get all STEM occupations with pagination
   */
  async getStemOccupations(): Promise<{
    occupation: Array<{ code: string; title: string }>;
  }> {
    const allStemOccupations: Array<{ code: string; title: string }> = [];
    let start = 1;
    const pageSize = 100;

    while (true) {
      const response = await this.request<{
        occupation?: Array<{ code: string; title: string }>;
        start: number;
        end: number;
        total: number;
      }>(`/online/stem_occupations/all?start=${start}&end=${start + pageSize - 1}`);

      if (response.occupation) {
        allStemOccupations.push(...response.occupation);
      }

      if (response.end >= response.total) {
        break;
      }

      start = response.end + 1;
    }

    return { occupation: allStemOccupations };
  }

  /**
   * Get work context for an occupation (physical/social environment)
   */
  async getOccupationWorkContext(
    code: string
  ): Promise<{ element: OnetElement[] }> {
    return this.request(`/online/occupations/${code}/details/work_context`);
  }

  /**
   * Get work styles for an occupation (personal characteristics)
   */
  async getOccupationWorkStyles(
    code: string
  ): Promise<{ element: OnetElement[] }> {
    return this.request(`/online/occupations/${code}/details/work_styles`);
  }

  /**
   * Get 30-question Mini-IP Interest Profiler questions (with pagination)
   */
  async getInterestProfilerQuestions30(): Promise<{
    question: Array<{
      index: number;
      text: string;
      area: string;
    }>;
  }> {
    const allQuestions: Array<{ index: number; text: string; area: string }> =
      [];
    let start = 1;
    const pageSize = 30;

    while (true) {
      const response = await this.request<{
        question?: Array<{ index: number; text: string; area: string }>;
        start: number;
        end: number;
        total: number;
      }>(`/mnm/interestprofiler/questions_30?start=${start}&end=${start + pageSize - 1}`);

      if (response.question) {
        allQuestions.push(...response.question);
      }

      if (response.end >= response.total) {
        break;
      }

      start = response.end + 1;
    }

    return { question: allQuestions };
  }

  /**
   * Get RIASEC results from Interest Profiler answers
   * @param answers - Answer string (30 chars, each 1-5 for Strongly Dislike to Strongly Like)
   */
  async getInterestProfilerResults(answers: string): Promise<{
    careers: string;
    result: Array<{
      code: string;
      title: string;
      description: string;
      score: number;
    }>;
  }> {
    return this.request(`/mnm/interestprofiler/results?answers=${answers}`);
  }
}

export const createOnetClient = (options?: OnetClientOptions) =>
  new OnetClient(options);
