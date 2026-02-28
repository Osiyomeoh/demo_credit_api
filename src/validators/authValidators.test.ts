import { Request } from 'express';
import { validationResult } from 'express-validator';
import {
  registerValidation,
  loginValidation,
  validate,
} from './authValidators';

async function runValidations(validations: typeof registerValidation, body: Record<string, unknown>) {
  const req = { body } as Request;
  await Promise.all(validations.map((v) => v.run(req)));
  return validationResult(req);
}

describe('authValidators', () => {
  describe('registerValidation', () => {
    it('passes for valid input', async () => {
      const result = await runValidations(registerValidation, {
        email: 'user@example.com',
        phone: '+2347012345678',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
      });
      expect(result.isEmpty()).toBe(true);
    });

    it('fails when email is invalid', async () => {
      const result = await runValidations(registerValidation, {
        email: 'not-an-email',
        phone: '+2347012345678',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
      });
      expect(result.isEmpty()).toBe(false);
      expect(result.array().some((e) => /email/i.test(String(e.msg)))).toBe(true);
    });

    it('fails when phone is missing', async () => {
      const result = await runValidations(registerValidation, {
        email: 'user@example.com',
        phone: '',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
      });
      expect(result.isEmpty()).toBe(false);
      expect(result.array().some((e) => /phone/i.test(String(e.msg)))).toBe(true);
    });

    it('fails when phone format is invalid', async () => {
      const result = await runValidations(registerValidation, {
        email: 'user@example.com',
        phone: 'abc',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
      });
      expect(result.isEmpty()).toBe(false);
    });

    it('fails when password is shorter than 6 characters', async () => {
      const result = await runValidations(registerValidation, {
        email: 'user@example.com',
        phone: '+2347012345678',
        firstName: 'John',
        lastName: 'Doe',
        password: '12345',
      });
      expect(result.isEmpty()).toBe(false);
      expect(result.array().some((e) => /password|6/i.test(String(e.msg)))).toBe(true);
    });

    it('fails when firstName is empty', async () => {
      const result = await runValidations(registerValidation, {
        email: 'user@example.com',
        phone: '+2347012345678',
        firstName: '',
        lastName: 'Doe',
        password: 'password123',
      });
      expect(result.isEmpty()).toBe(false);
    });
  });

  describe('loginValidation', () => {
    it('passes for valid email and password', async () => {
      const result = await runValidations(loginValidation, {
        email: 'user@example.com',
        password: 'secret',
      });
      expect(result.isEmpty()).toBe(true);
    });

    it('fails when email is invalid', async () => {
      const result = await runValidations(loginValidation, {
        email: 'bad',
        password: 'secret',
      });
      expect(result.isEmpty()).toBe(false);
    });

    it('fails when password is empty', async () => {
      const result = await runValidations(loginValidation, {
        email: 'user@example.com',
        password: '',
      });
      expect(result.isEmpty()).toBe(false);
    });
  });

  describe('validate() middleware', () => {
    it('calls next() when validation passes', async () => {
      const req = {
        body: { email: 'u@x.com', password: 'pwd' },
      } as Request;
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await validate(loginValidation)(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 400 with errors when validation fails', async () => {
      const req = { body: { email: 'bad', password: 'pwd' } } as Request;
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await validate(loginValidation)(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          message: 'Validation failed',
          errors: expect.any(Array),
        })
      );
    });
  });
});
