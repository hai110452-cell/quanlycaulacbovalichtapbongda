const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_V0sxefCk4SKP@ep-lingering-paper-b7l71r95-pooler.c-13.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function main() {
  const pCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='players'");
  console.log('Players columns:', pCols.rows);
  const pRows = await pool.query("SELECT * FROM players LIMIT 2");
  console.log('Sample player:', pRows.rows[0]);
  await pool.end();
}

main().catch(console.error);
