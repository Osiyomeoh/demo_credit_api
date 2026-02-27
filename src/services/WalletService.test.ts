import { WalletService, InsufficientBalanceError } from './WalletService';

describe('WalletService', () => {
  describe('InsufficientBalanceError', () => {
    it('should be throwable with custom message', () => {
      const err = new InsufficientBalanceError('Custom message');
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe('Custom message');
      expect(err.name).toBe('InsufficientBalanceError');
    });
  });
});

// Integration tests requiring MySQL database - run with: npm test -- WalletService.integration
// Ensure DB_NAME=lendsqr_wallet_test and migrations have been run
