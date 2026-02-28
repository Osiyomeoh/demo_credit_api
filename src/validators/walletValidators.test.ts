import { Request } from 'express';
import { validationResult } from 'express-validator';
import {
  fundValidation,
  withdrawValidation,
  transferValidation,
  transactionsQueryValidation,
} from './walletValidators';

async function runBodyValidations(
  validations: typeof fundValidation,
  body: Record<string, unknown>
) {
  const req = { body } as Request;
  await Promise.all(validations.map((v) => v.run(req)));
  return validationResult(req);
}

async function runQueryValidations(query: Record<string, unknown>) {
  const req = { query } as Request;
  await Promise.all(transactionsQueryValidation.map((v) => v.run(req)));
  return validationResult(req);
}

describe('walletValidators', () => {
  describe('fundValidation', () => {
    it('passes for valid amount', async () => {
      const result = await runBodyValidations(fundValidation, {
        amount: 100.5,
      });
      expect(result.isEmpty()).toBe(true);
    });

    it('passes with optional description', async () => {
      const result = await runBodyValidations(fundValidation, {
        amount: 50,
        description: 'Top up',
      });
      expect(result.isEmpty()).toBe(true);
    });

    it('fails when amount is zero', async () => {
      const result = await runBodyValidations(fundValidation, { amount: 0 });
      expect(result.isEmpty()).toBe(false);
    });

    it('fails when amount is negative', async () => {
      const result = await runBodyValidations(fundValidation, { amount: -10 });
      expect(result.isEmpty()).toBe(false);
    });

    it('fails when amount is missing', async () => {
      const result = await runBodyValidations(fundValidation, {});
      expect(result.isEmpty()).toBe(false);
    });
  });

  describe('withdrawValidation', () => {
    it('passes for valid amount', async () => {
      const result = await runBodyValidations(withdrawValidation, {
        amount: 25.99,
      });
      expect(result.isEmpty()).toBe(true);
    });

    it('fails when amount is less than 0.01', async () => {
      const result = await runBodyValidations(withdrawValidation, {
        amount: 0.001,
      });
      expect(result.isEmpty()).toBe(false);
    });
  });

  describe('transferValidation', () => {
    it('passes for valid recipientUserId and amount', async () => {
      const result = await runBodyValidations(transferValidation, {
        recipientUserId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        amount: 10,
      });
      expect(result.isEmpty()).toBe(true);
    });

    it('fails when recipientUserId is not a UUID', async () => {
      const result = await runBodyValidations(transferValidation, {
        recipientUserId: 'not-a-uuid',
        amount: 10,
      });
      expect(result.isEmpty()).toBe(false);
      expect(result.array().some((e) => /recipient|UUID/i.test(String(e.msg)))).toBe(true);
    });

    it('fails when amount is invalid', async () => {
      const result = await runBodyValidations(transferValidation, {
        recipientUserId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        amount: -5,
      });
      expect(result.isEmpty()).toBe(false);
    });
  });

  describe('transactionsQueryValidation', () => {
    it('passes when limit is within range', async () => {
      const result = await runQueryValidations({ limit: '50' });
      expect(result.isEmpty()).toBe(true);
    });

    it('passes when limit is omitted', async () => {
      const result = await runQueryValidations({});
      expect(result.isEmpty()).toBe(true);
    });

    it('fails when limit is less than 1', async () => {
      const result = await runQueryValidations({ limit: '0' });
      expect(result.isEmpty()).toBe(false);
    });

    it('fails when limit is greater than 100', async () => {
      const result = await runQueryValidations({ limit: '101' });
      expect(result.isEmpty()).toBe(false);
    });
  });
});
