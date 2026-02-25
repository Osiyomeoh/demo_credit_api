import { db } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export type TransactionType = 'credit' | 'debit' | 'transfer_in' | 'transfer_out';

export interface Wallet {
  id: string;
  user_id: string;
  balance: string;
  currency: string;
  created_at: Date;
  updated_at: Date;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  type: TransactionType;
  amount: string;
  currency: string;
  description: string | null;
  reference_id: string | null;
  counterparty_user_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export class InsufficientBalanceError extends Error {
  constructor(message: string = 'Insufficient wallet balance') {
    super(message);
    this.name = 'InsufficientBalanceError';
  }
}

export class WalletService {
  async getOrCreateWallet(userId: string): Promise<Wallet> {
    let wallet = await db<Wallet>('wallets').where({ user_id: userId }).first();

    if (!wallet) {
      const id = uuidv4();
      await db<Wallet>('wallets').insert({ id, user_id: userId });
      wallet = await db<Wallet>('wallets').where({ id }).first();
      if (!wallet) throw new Error('Failed to create wallet');
    }

    return wallet;
  }

  async getWalletByUserId(userId: string): Promise<Wallet | undefined> {
    return db<Wallet>('wallets').where({ user_id: userId }).first();
  }

  async fundWallet(userId: string, amount: number, description?: string): Promise<Transaction> {
    return db.transaction(async (trx) => {
      const wallet = await trx<Wallet>('wallets').where({ user_id: userId }).first().forUpdate();

      if (!wallet) {
        const walletId = uuidv4();
        await trx<Wallet>('wallets').insert({ id: walletId, user_id: userId });
        await trx('wallets').where({ id: walletId }).update({
          balance: trx.raw('?? + ?', ['balance', amount]),
        });

        const txId = uuidv4();
        await trx('transactions').insert({
          id: txId,
          wallet_id: walletId,
          type: 'credit',
          amount,
          description: description || 'Wallet funding',
        });

        const tx = await trx<Transaction>('transactions').where({ id: txId }).first();
        if (!tx) throw new Error('Failed to create transaction');
        return tx;
      }

      await trx('wallets').where({ id: wallet.id }).update({
        balance: trx.raw('?? + ?', ['balance', amount]),
      });

      const txId = uuidv4();
      await trx('transactions').insert({
        id: txId,
        wallet_id: wallet.id,
        type: 'credit',
        amount,
        description: description || 'Wallet funding',
      });

      const tx = await trx<Transaction>('transactions').where({ id: txId }).first();
      if (!tx) throw new Error('Failed to create transaction');
      return tx;
    });
  }

  async withdrawFunds(userId: string, amount: number, description?: string): Promise<Transaction> {
    return db.transaction(async (trx) => {
      const wallet = await trx<Wallet>('wallets').where({ user_id: userId }).first().forUpdate();

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const currentBalance = parseFloat(wallet.balance);
      if (currentBalance < amount) {
        throw new InsufficientBalanceError(`Insufficient balance. Available: ${currentBalance}, Requested: ${amount}`);
      }

      await trx('wallets').where({ id: wallet.id }).update({
        balance: trx.raw('?? - ?', ['balance', amount]),
      });

      const txId = uuidv4();
      await trx('transactions').insert({
        id: txId,
        wallet_id: wallet.id,
        type: 'debit',
        amount,
        description: description || 'Withdrawal',
      });

      const tx = await trx<Transaction>('transactions').where({ id: txId }).first();
      if (!tx) throw new Error('Failed to create transaction');
      return tx;
    });
  }

  async transferFunds(
    senderUserId: string,
    recipientUserId: string,
    amount: number,
    description?: string
  ): Promise<{ debitTx: Transaction; creditTx: Transaction }> {
    if (senderUserId === recipientUserId) {
      throw new Error('Cannot transfer to yourself');
    }

    return db.transaction(async (trx) => {
      const [senderWallet, recipientWallet] = await Promise.all([
        trx<Wallet>('wallets').where({ user_id: senderUserId }).first().forUpdate(),
        trx<Wallet>('wallets').where({ user_id: recipientUserId }).first().forUpdate(),
      ]);

      if (!senderWallet) {
        throw new Error('Sender wallet not found');
      }

      if (!recipientWallet) {
        throw new Error('Recipient wallet not found');
      }

      const senderBalance = parseFloat(senderWallet.balance);
      if (senderBalance < amount) {
        throw new InsufficientBalanceError(`Insufficient balance. Available: ${senderBalance}, Requested: ${amount}`);
      }

      const referenceId = uuidv4();

      await trx('wallets').where({ id: senderWallet.id }).update({
        balance: trx.raw('?? - ?', ['balance', amount]),
      });
      await trx('wallets').where({ id: recipientWallet.id }).update({
        balance: trx.raw('?? + ?', ['balance', amount]),
      });

      const debitTxId = uuidv4();
      const creditTxId = uuidv4();

      await trx('transactions').insert({
        id: debitTxId,
        wallet_id: senderWallet.id,
        type: 'transfer_out',
        amount,
        description: description || `Transfer to user ${recipientUserId}`,
        reference_id: referenceId,
        counterparty_user_id: recipientUserId,
      });

      await trx('transactions').insert({
        id: creditTxId,
        wallet_id: recipientWallet.id,
        type: 'transfer_in',
        amount,
        description: description || `Transfer from user ${senderUserId}`,
        reference_id: referenceId,
        counterparty_user_id: senderUserId,
      });

      const debitTx = await trx<Transaction>('transactions').where({ id: debitTxId }).first();
      const creditTx = await trx<Transaction>('transactions').where({ id: creditTxId }).first();
      if (!debitTx || !creditTx) throw new Error('Failed to create transfer transactions');

      return { debitTx, creditTx };
    });
  }

  async getTransactions(userId: string, limit: number = 50): Promise<Transaction[]> {
    const wallet = await db<Wallet>('wallets').where({ user_id: userId }).first();
    if (!wallet) return [];

    return db<Transaction>('transactions')
      .where({ wallet_id: wallet.id })
      .orderBy('created_at', 'desc')
      .limit(limit);
  }
}

export const walletService = new WalletService();
