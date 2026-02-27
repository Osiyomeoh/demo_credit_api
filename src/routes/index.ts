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

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: API is running
 */
// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Demo Credit Wallet API is running' });
});

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - phone
 *               - firstName
 *               - lastName
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *                 example: "+2347012345678"
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Account created successfully
 *       403:
 *         description: User is blacklisted in Karma
 *       409:
 *         description: User with this email already exists
 */
// Auth routes (public)
router.post('/auth/register', validate(registerValidation), (req, res) =>
  authController.register(req, res)
);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid email or password
 */
router.post('/auth/login', validate(loginValidation), (req, res) =>
  authController.login(req, res)
);

// Protected wallet routes
router.use('/wallets', authMiddleware);

/**
 * @openapi
 * /wallets/balance:
 *   get:
 *     summary: Get current wallet balance
 *     tags:
 *       - Wallets
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current wallet balance
 *       401:
 *         description: Unauthorized
 */
router.get('/wallets/balance', (req, res) => walletController.getBalance(req, res));

/**
 * @openapi
 * /wallets/fund:
 *   post:
 *     summary: Fund wallet
 *     tags:
 *       - Wallets
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Wallet funded successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/wallets/fund', validate(fundValidation), (req, res) =>
  walletController.fund(req, res)
);

/**
 * @openapi
 * /wallets/withdraw:
 *   post:
 *     summary: Withdraw funds from wallet
 *     tags:
 *       - Wallets
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Withdrawal successful
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       422:
 *         description: Insufficient balance
 */
router.post('/wallets/withdraw', validate(withdrawValidation), (req, res) =>
  walletController.withdraw(req, res)
);

/**
 * @openapi
 * /wallets/transfer:
 *   post:
 *     summary: Transfer funds to another user
 *     tags:
 *       - Wallets
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientUserId
 *               - amount
 *             properties:
 *               recipientUserId:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Transfer completed
 *       400:
 *         description: Validation error or cannot transfer to self
 *       401:
 *         description: Unauthorized
 *       422:
 *         description: Insufficient balance
 */
router.post('/wallets/transfer', validate(transferValidation), (req, res) =>
  walletController.transfer(req, res)
);

/**
 * @openapi
 * /wallets/transactions:
 *   get:
 *     summary: List wallet transactions
 *     tags:
 *       - Wallets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         required: false
 *         description: Maximum number of transactions to return
 *     responses:
 *       200:
 *         description: List of transactions
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/wallets/transactions',
  validate(transactionsQueryValidation),
  (req, res) => walletController.getTransactions(req, res)
);

export default router;
