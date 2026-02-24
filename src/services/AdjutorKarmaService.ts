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

      const { status, data } = response.data as {
        status: string;
        data?: { karma_identity?: string };
      };

      if (status === 'success' && data && data.karma_identity) {
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

