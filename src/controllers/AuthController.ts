import { Request, Response } from 'express';
import { userService } from '../services/UserService';
import { authService } from '../services/AuthService';
import { walletService } from '../services/WalletService';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, phone, firstName, lastName, password } = req.body;

      const existingByEmail = await userService.findByEmail(email);
      if (existingByEmail) {
        res.status(409).json({
          status: 'error',
          message: 'User with this email already exists',
        });
        return;
      }

      const existingByPhone = await userService.findByPhone(phone);
      if (existingByPhone) {
        res.status(409).json({
          status: 'error',
          message: 'User with this phone number already exists',
        });
        return;
      }

      const user = await userService.createUser({
        email,
        phone,
        firstName,
        lastName,
        password,
      });

      await walletService.getOrCreateWallet(user.id);

      const token = await authService.createToken(user.id);
      res.status(201).json({
        status: 'success',
        message: 'Account created successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            firstName: user.first_name,
            lastName: user.last_name,
          },
          token,
          tokenType: 'Bearer',
        },
      });
    } catch (error) {
      const err = error as any;
      if ((err as Error).message?.startsWith?.('USER_BLACKLISTED:')) {
        res.status(403).json({
          status: 'error',
          message: (err as Error).message.replace('USER_BLACKLISTED: ', ''),
        });
        return;
      }

      // Handle unique constraint violations defensively
      if (err?.code === 'ER_DUP_ENTRY' || err?.errno === 1062) {
        const msg: string = err.sqlMessage || '';
        const isPhone = msg.includes('users_phone_unique');
        const isEmail = msg.includes('users_email_unique');

        res.status(409).json({
          status: 'error',
          message: isPhone
            ? 'User with this phone number already exists'
            : isEmail
              ? 'User with this email already exists'
              : 'User already exists',
        });
        return;
      }

      console.error('[AuthController.register] Unhandled error:', err);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    const user = await userService.findByEmail(email);
    if (!user || !userService.verifyPassword(password, user.password_hash)) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
      return;
    }

    const token = await authService.createToken(user.id);
    res.json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          firstName: user.first_name,
          lastName: user.last_name,
        },
        token,
        tokenType: 'Bearer',
      },
    });
  }
}

