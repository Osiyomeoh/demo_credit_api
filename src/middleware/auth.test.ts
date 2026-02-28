import { Request, Response } from 'express';
import { authMiddleware } from './auth';

const mockValidateToken = jest.fn();
jest.mock('../services/AuthService', () => ({
  authService: {
    validateToken: (...args: unknown[]) => mockValidateToken(...args),
  },
}));

function createMockReq(overrides: Partial<Request> = {}): Partial<Request> {
  return {
    headers: {},
    ...overrides,
  };
}

function createMockRes(): Partial<Response> & { statusCode: number; body: unknown } {
  const res: Partial<Response> & { statusCode: number; body: unknown } = {
    statusCode: 0,
    body: undefined,
  };
  res.status = jest.fn().mockImplementation((code: number) => {
    res.statusCode = code;
    return res as Response;
  });
  res.json = jest.fn().mockImplementation((payload: unknown) => {
    res.body = payload;
    return res as Response;
  });
  return res;
}

function createNext(): jest.Mock {
  return jest.fn();
}

describe('authMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when Authorization header is missing', async () => {
    const req = createMockReq({ headers: {} }) as Request;
    const res = createMockRes() as Response;
    const next = createNext();

    await authMiddleware(req, res, next);

    expect(res.statusCode).toBe(401);
    expect((res as any).body).toMatchObject({
      status: 'error',
      message: expect.stringContaining('Authorization header'),
    });
    expect(mockValidateToken).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when header does not start with Bearer ', async () => {
    const req = createMockReq({
      headers: { authorization: 'Basic xyz' },
    }) as Request;
    const res = createMockRes() as Response;
    const next = createNext();

    await authMiddleware(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(mockValidateToken).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is empty after Bearer', async () => {
    const req = createMockReq({
      headers: { authorization: 'Bearer   ' },
    }) as Request;
    const res = createMockRes() as Response;
    const next = createNext();

    await authMiddleware(req, res, next);

    expect(res.statusCode).toBe(401);
    expect((res as any).body).toMatchObject({ message: 'Token is required' });
    expect(mockValidateToken).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when validateToken returns null (invalid/expired)', async () => {
    mockValidateToken.mockResolvedValueOnce(null);
    const req = createMockReq({
      headers: { authorization: 'Bearer some-token' },
    }) as Request;
    const res = createMockRes() as Response;
    const next = createNext();

    await authMiddleware(req, res, next);

    expect(res.statusCode).toBe(401);
    expect((res as any).body).toMatchObject({
      message: 'Invalid or expired token',
    });
    expect(mockValidateToken).toHaveBeenCalledWith('some-token');
    expect(next).not.toHaveBeenCalled();
  });

  it('sets req.userId and calls next when token is valid', async () => {
    mockValidateToken.mockResolvedValueOnce('user-123');
    const req = createMockReq({
      headers: { authorization: 'Bearer valid-token' },
    }) as Request;
    const res = createMockRes() as Response;
    const next = createNext();

    await authMiddleware(req, res, next);

    expect(req.userId).toBe('user-123');
    expect(next).toHaveBeenCalledTimes(1);
    expect(mockValidateToken).toHaveBeenCalledWith('valid-token');
    expect(res.statusCode).toBe(0);
  });
});
