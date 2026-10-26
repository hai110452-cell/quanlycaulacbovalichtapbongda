const { neon } = require('@neondatabase/serverless');

const databaseUrl = 'postgresql://neondb_owner:npg_3blXDnJKd8uU@ep-fancy-resonance-b4hzp3ac-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = neon(databaseUrl);

async function main() {
  await sql.query("UPDATE users SET username = 'giabao123' WHERE email = 'bao@gmail.com';");
  console.log('✅ Đã gán username: giabao123 cho tài khoản bao@gmail.com!');
}

main().catch(console.error);
