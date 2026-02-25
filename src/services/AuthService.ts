import { db } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

const TOKEN_EXPIRY_DAYS = 7;

export class AuthService {
  async createToken(userId: string): Promise<string> {
    const id = uuidv4();
    const token = uuidv4();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

    await db('auth_tokens').insert({
      id,
      user_id: userId,
      token,
      expires_at: expiresAt,
    });

    return token;
  }

  async validateToken(token: string): Promise<string | null> {
    const record = await db('auth_tokens')
      .where({ token })
      .where('expires_at', '>', db.fn.now())
      .first<{ user_id: string }>();

    return record ? record.user_id : null;
  }

  async revokeToken(token: string): Promise<void> {
    await db('auth_tokens').where({ token }).del();
  }
}

export const authService = new AuthService();

