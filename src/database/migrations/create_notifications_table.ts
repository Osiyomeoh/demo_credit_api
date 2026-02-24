import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('notifications', (table) =>{
    table.uuid('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('message').notNullable();
    table.boolean('read').notNullable().defaultTo(false);
    table.timestamps(true, true);
    table.index(['user_id']);

  })
}
export async function down(knex: Knex): Promise<void>{
    await knex.schema.dropTableIfExists('notifications');
}