import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('transactions', (table) => {
    table.uuid('id').primary();
    table
      .uuid('wallet_id')
      .notNullable()
      .references('id')
      .inTable('wallets')
      .onDelete('CASCADE');
    table
      .enu('type', ['credit', 'debit', 'transfer_in', 'transfer_out'], {
        useNative: false,
        enumName: 'transaction_type',
      })
      .notNullable();
    table.decimal('amount', 14, 2).notNullable();
    table.string('currency', 10).notNullable().defaultTo('NGN');
    table.string('description', 500).nullable();
    table.uuid('reference_id').nullable();
    table.uuid('counterparty_user_id').nullable();
    table.timestamps(true, true);

    table.index(['wallet_id', 'created_at']);
    table.index(['reference_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('transactions');
}

