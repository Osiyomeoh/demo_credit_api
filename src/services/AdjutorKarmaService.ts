import axios, { type AxiosInstance } from 'axios';

export class AdjutorKarmaService {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl?: string) {
    this.baseUrl =
      baseUrl ||
      process.env.ADJUTOR_KARMA_BASE_URL ||
      'https://adjutor.lendsqr.com/v2/verification/karma';

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${apiKey || process.env.ADJUTOR_API_KEY || ''}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  async isBlacklisted(identity: string): Promise<boolean> {
    const normalizedIdentity = this.normalizeIdentity(identity);
    if (!normalizedIdentity) {
      return false;
    }

    try {
      const response = await this.client.get(
        `/${encodeURIComponent(normalizedIdentity)}`
      );

      const body = response.data as {
        status: string;
        'mock-response'?: string;
        data?: {
          karma_identity?: string;
          default_date?: string;
          amount_in_contention?: string;
          reason?: string | null;
        };
      };

      // In test mode the API returns mock data for every request; do not block registration.
      if (body['mock-response']) {
        return false;
      }

      const { status, data } = body;

      // Only treat as blacklisted when the API returns a full blacklist record (live data).
      const hasBlacklistRecord =
        status === 'success' &&
        data &&
        data.karma_identity &&
        (data.default_date != null ||
          data.amount_in_contention != null ||
          (data.reason != null && data.reason !== ''));

      if (hasBlacklistRecord) {
        return true;
      }

      return false;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          return false;
        }

        console.error('[AdjutorKarmaService] API error:', error.message);
        return false;
      }

      throw error;
    }
  }

  private normalizeIdentity(identity: string): string {
    return identity.trim();
  }
}

export const karmaService = new AdjutorKarmaService();

