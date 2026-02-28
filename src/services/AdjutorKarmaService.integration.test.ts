/**
 * Integration tests for the real Adjutor Karma API.
 * These run only when ADJUTOR_API_KEY is set (e.g. from .env); otherwise the suite is skipped.
 *
 * Run with real API:
 *   npm test -- --testPathPattern=AdjutorKarmaService.integration
 *
 * Or with env loaded (if Jest doesn't load .env):
 *   node -r dotenv/config node_modules/.bin/jest --testPathPattern=AdjutorKarmaService.integration --forceExit
 */

import { karmaService } from './AdjutorKarmaService';

const hasApiKey = Boolean(process.env.ADJUTOR_API_KEY?.trim());

describe('AdjutorKarmaService (integration – real API)', () => {
  it.each([
    ['0zspgifzbo.ga', true],
  ] as [string, boolean][])(
    'isBlacklisted("%s") returns %s when calling real API',
    async (identity, expectedBlacklisted) => {
      if (!hasApiKey) {
        console.warn('Skipped: ADJUTOR_API_KEY not set. Add to .env to run.');
        return;
      }
      const result = await karmaService.isBlacklisted(identity);
      expect(result).toBe(expectedBlacklisted);
    },
    15000
  );

  it('isBlacklisted returns false for a random non-blacklisted identity', async () => {
    if (!hasApiKey) {
      console.warn('Skipped: ADJUTOR_API_KEY not set. Add to .env to run.');
      return;
    }
    const randomIdentity = `test-${Date.now()}@example.com`;
    const result = await karmaService.isBlacklisted(randomIdentity);
    expect(result).toBe(false);
  }, 15000);
});
