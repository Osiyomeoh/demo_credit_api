import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { WalletController } from '../controllers/WalletController';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../validators/authValidators';
import {
  registerValidation,
  loginValidation,
} from '../validators/authValidators';
import {
  fundValidation,
  withdrawValidation,
  transferValidation,
  transactionsQueryValidation,
} from '../validators/walletValidators';

const router = Router();
const authController = new AuthController();
const walletController = new WalletController();

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Demo Credit Wallet API is running' });
});

// Auth routes (public)
router.post('/auth/register', validate(registerValidation), (req, res) =>
  authController.register(req, res)
);
router.post('/auth/login', validate(loginValidation), (req, res) =>
  authController.login(req, res)
);

// Protected wallet routes
router.use('/wallets', authMiddleware);

router.get('/wallets/balance', (req, res) => walletController.getBalance(req, res));
router.post('/wallets/fund', validate(fundValidation), (req, res) =>
  walletController.fund(req, res)
);
router.post('/wallets/withdraw', validate(withdrawValidation), (req, res) =>
  walletController.withdraw(req, res)
);
router.post('/wallets/transfer', validate(transferValidation), (req, res) =>
  walletController.transfer(req, res)
);
router.get(
  '/wallets/transactions',
  validate(transactionsQueryValidation),
  (req, res) => walletController.getTransactions(req, res)
);

export default router;
