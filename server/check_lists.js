import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('D:/Planka/server/.env') });

const { Client } = pg;

(async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  const resList = await client.query('SELECT id, name, "board_id" FROM "list" WHERE name = \'10\'');
  console.log('--- List "10" ---');
  console.log(resList.rows);

  const resBoard = await client.query('SELECT id, name FROM "board"');
  console.log('--- Boards ---');
  console.log(resBoard.rows);

  await client.end();
})();
