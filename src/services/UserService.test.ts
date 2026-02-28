import { userService } from './UserService';

jest.mock('../config/database', () => {
  const insert = jest.fn().mockResolvedValue(undefined);
  const where = jest.fn().mockReturnThis();
  const first = jest.fn().mockResolvedValue({
    id: 'user-id',
    email: 'user@example.com',
    phone: '+2347012345678',
    first_name: 'Test',
    last_name: 'User',
    password_hash: 'hashed',
    created_at: new Date(),
    updated_at: new Date(),
  });

  const db = jest.fn(() => ({
    insert,
    where,
    first,
  }));

  return { db };
});

jest.mock('./AdjutorKarmaService', () => ({
  karmaService: {
    isBlacklisted: jest.fn(),
  },
}));

const { karmaService } = jest.requireMock('./AdjutorKarmaService') as {
  karmaService: { isBlacklisted: jest.Mock };
};

describe('UserService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('throws when email is blacklisted', async () => {
    karmaService.isBlacklisted
      .mockResolvedValueOnce(true) // email
      .mockResolvedValueOnce(false); // phone

    await expect(
      userService.createUser({
        email: 'bad@example.com',
        phone: '+2347012345678',
        firstName: 'Bad',
        lastName: 'Actor',
        password: 'Password123',
      })
    ).rejects.toThrow(/USER_BLACKLISTED: Email/);
  });

  it('throws when phone is blacklisted', async () => {
    karmaService.isBlacklisted
      .mockResolvedValueOnce(false) // email
      .mockResolvedValueOnce(true); // phone

    await expect(
      userService.createUser({
        email: 'good@example.com',
        phone: '+2347012345678',
        firstName: 'Bad',
        lastName: 'Actor',
        password: 'Password123',
      })
    ).rejects.toThrow(/USER_BLACKLISTED: Phone/);
  });
});

