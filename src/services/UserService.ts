import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database';
import { karmaService } from './AdjutorKarmaService';

export interface CreateUserInput {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export class UserService {
  /**
   * Create a new user after verifying they are not on the Karma blacklist.
   * Checks both email and phone against Adjutor Karma.
   */
  async createUser(input: CreateUserInput): Promise<User> {
    const [emailBlacklisted, phoneBlacklisted] = await Promise.all([
      karmaService.isBlacklisted(input.email),
      karmaService.isBlacklisted(input.phone),
    ]);

    if (emailBlacklisted) {
      throw new Error('USER_BLACKLISTED: Email is on the Karma blacklist. Account cannot be created.');
    }

    if (phoneBlacklisted) {
      throw new Error('USER_BLACKLISTED: Phone number is on the Karma blacklist. Account cannot be created.');
    }

    const passwordHash = this.hashPassword(input.password);
    const id = uuidv4();
    await db('users').insert({
      id,
      email: input.email.toLowerCase(),
      phone: input.phone,
      first_name: input.firstName,
      last_name: input.lastName,
      password_hash: passwordHash,
    });

    const user = await db('users').where({ id }).first();
    if (!user) throw new Error('Failed to create user');
    return user;
  }

  async findById(id: string): Promise<User | undefined> {
    return db('users').where({ id }).first();
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return db('users').where({ email: email.toLowerCase() }).first();
  }

  async findByPhone(phone: string): Promise<User | undefined> {
    return db('users').where({ phone }).first();
  }

  private hashPassword(password: string): string {
   
    return Buffer.from(password).toString('base64');
  }

  verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }
}

export const userService = new UserService();
