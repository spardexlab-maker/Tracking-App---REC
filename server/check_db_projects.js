import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

(async () => {
  console.log('Connecting to database:', process.env.DATABASE_URL);
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected.');

  // Get admin user ID
  const userRes = await client.query("SELECT id FROM \"user_account\" WHERE email = 'admin@example.com'");
  const adminId = userRes.rows[0].id;
  console.log('Admin ID:', adminId);

  // Get all projects
  const projRes = await client.query('SELECT id, name FROM "project"');
  const projects = projRes.rows;
  console.log('Projects:', projects);

  // Add admin as project manager to all projects
  for (const proj of projects) {
    // Check if record already exists
    const checkRes = await client.query(
      'SELECT id FROM "project_manager" WHERE "project_id" = $1 AND "user_id" = $2',
      [proj.id, adminId]
    );

    if (checkRes.rows.length === 0) {
      console.log(`Adding admin as manager to project: ${proj.name}`);
      const id = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
      await client.query(
        'INSERT INTO "project_manager" (id, "project_id", "user_id", "created_at", "updated_at") VALUES ($1, $2, $3, NOW(), NOW())',
        [id, proj.id, adminId]
      );
    } else {
      console.log(`Admin is already manager of project: ${proj.name}`);
    }
  }

  console.log('Done.');
  await client.end();
})();
