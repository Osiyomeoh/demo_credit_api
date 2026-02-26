import { Request, Response } from 'express';
import { userService } from '../services/UserService';
import { authService } from '../services/AuthService';
import { walletService } from '../services/WalletService';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, phone, firstName, lastName, password } = req.body;

      const existingUser = await userService.findByEmail(email);
      if (existingUser) {
        res.status(409).json({
          status: 'error',
          message: 'User with this email already exists',
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
      const err = error as Error;
      if (err.message.startsWith('USER_BLACKLISTED:')) {
        res.status(403).json({
          status: 'error',
          message: err.message.replace('USER_BLACKLISTED: ', ''),
        });
        return;
      }
      throw error;
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

