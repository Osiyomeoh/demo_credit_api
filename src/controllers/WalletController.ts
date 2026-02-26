import { Request, Response } from 'express';
import { walletService, InsufficientBalanceError } from '../services/WalletService';

export class WalletController {
  async getBalance(req: Request, res: Response): Promise<void> {
    const userId = req.userId!;

    const wallet = await walletService.getOrCreateWallet(userId);

    res.json({
      status: 'success',
      data: {
        walletId: wallet.id,
        balance: parseFloat(wallet.balance),
        currency: wallet.currency,
      },
    });
  }

  async fund(req: Request, res: Response): Promise<void> {
    const userId = req.userId!;
    const { amount, description } = req.body;

    if (amount <= 0) {
      res.status(400).json({
        status: 'error',
        message: 'Amount must be greater than zero',
      });
      return;
    }

    const transaction = await walletService.fundWallet(userId, amount, description);

    res.status(201).json({
      status: 'success',
      message: 'Wallet funded successfully',
      data: {
        transactionId: transaction.id,
        amount: parseFloat(transaction.amount),
        type: transaction.type,
        description: transaction.description,
      },
    });
  }

  async withdraw(req: Request, res: Response): Promise<void> {
    const userId = req.userId!;
    const { amount, description } = req.body;

    if (amount <= 0) {
      res.status(400).json({
        status: 'error',
        message: 'Amount must be greater than zero',
      });
      return;
    }

    try {
      const transaction = await walletService.withdrawFunds(userId, amount, description);

      res.status(200).json({
        status: 'success',
        message: 'Withdrawal successful',
        data: {
          transactionId: transaction.id,
          amount: parseFloat(transaction.amount),
          type: transaction.type,
          description: transaction.description,
        },
      });
    } catch (error) {
      if (error instanceof InsufficientBalanceError) {
        res.status(400).json({
          status: 'error',
          message: error.message,
        });
        return;
      }
      throw error;
    }
  }

  async transfer(req: Request, res: Response): Promise<void> {
    const senderUserId = req.userId!;
    const { recipientUserId, amount, description } = req.body;

    if (amount <= 0) {
      res.status(400).json({
        status: 'error',
        message: 'Amount must be greater than zero',
      });
      return;
    }

    if (!recipientUserId) {
      res.status(400).json({
        status: 'error',
        message: 'Recipient user ID is required',
      });
      return;
    }

    try {
      const { debitTx, creditTx } = await walletService.transferFunds(
        senderUserId,
        recipientUserId,
        amount,
        description
      );

      res.status(201).json({
        status: 'success',
        message: 'Transfer successful',
        data: {
          debitTransactionId: debitTx.id,
          creditTransactionId: creditTx.id,
          amount: parseFloat(debitTx.amount),
          recipientUserId,
          referenceId: debitTx.reference_id,
        },
      });
    } catch (error) {
      const err = error as Error;
      if (err instanceof InsufficientBalanceError) {
        res.status(400).json({
          status: 'error',
          message: err.message,
        });
        return;
      }
      if (err.message.includes('Recipient wallet not found')) {
        res.status(404).json({
          status: 'error',
          message: 'Recipient user not found',
        });
        return;
      }
      if (err.message.includes('yourself')) {
        res.status(400).json({
          status: 'error',
          message: err.message,
        });
        return;
      }
      throw error;
    }
  }

  async getTransactions(req: Request, res: Response): Promise<void> {
    const userId = req.userId!;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const transactions = await walletService.getTransactions(userId, limit);

    res.json({
      status: 'success',
      data: {
        transactions: transactions.map((tx) => ({
          id: tx.id,
          type: tx.type,
          amount: parseFloat(tx.amount),
          currency: tx.currency,
          description: tx.description,
          referenceId: tx.reference_id,
          counterpartyUserId: tx.counterparty_user_id,
          createdAt: tx.created_at,
        })),
      },
    });
  }
}
