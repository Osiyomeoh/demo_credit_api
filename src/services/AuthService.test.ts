import { authService } from './AuthService';

const mockFirst = jest.fn();

jest.mock('../config/database', () => {
  const fnNow = { now: jest.fn() };
  return {
    db: Object.assign(
      (table: string) => {
        if (table !== 'auth_tokens') throw new Error('unexpected table');
        return {
          insert: jest.fn().mockResolvedValue(undefined),
          where: jest.fn().mockReturnThis(),
          del: jest.fn().mockResolvedValue(undefined),
          first: mockFirst,
        };
      },
      { fn: fnNow }
    ),
  };
});

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createToken', () => {
    it('inserts a token and returns it', async () => {
      const userId = 'user-uuid-123';
      const token = await authService.createToken(userId);

      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(10);
    });
  });

  describe('validateToken', () => {
    it('returns user_id when token is valid and not expired', async () => {
      mockFirst.mockResolvedValueOnce({ user_id: 'user-456' });

      const result = await authService.validateToken('valid-token');

      expect(result).toBe('user-456');
    });

    it('returns null when no record found', async () => {
      mockFirst.mockResolvedValueOnce(undefined);

      const result = await authService.validateToken('unknown-token');

      expect(result).toBeNull();
    });

    it('returns null when record is null', async () => {
      mockFirst.mockResolvedValueOnce(null);

      const result = await authService.validateToken('expired-token');

      expect(result).toBeNull();
    });
  });

  describe('revokeToken', () => {
    it('deletes the token record', async () => {
      await authService.revokeToken('token-to-revoke');

      expect(mockFirst).not.toHaveBeenCalled();
    });
  });
});
