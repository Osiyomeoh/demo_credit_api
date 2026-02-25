import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/AuthService';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Faux token-based authentication middleware.
 * Extracts Bearer token from Authorization header and validates it.
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      status: 'error',
      message: 'Authorization header missing or invalid. Use: Authorization: Bearer <token>',
    });
    return;
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    res.status(401).json({
      status: 'error',
      message: 'Token is required',
    });
    return;
  }

  const userId = await authService.validateToken(token);

  if (!userId) {
    res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token',
    });
    return;
  }

  req.userId = userId;
  next();
}
