import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createPool } from 'mysql2/promise';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, 'backend', '.env') });

const pool = createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3307', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'transport_management',
});

try {
  const conn = await pool.getConnection();
  await conn.query("SET SESSION sql_mode = ''");
  
  const tables = ['shipment_parties', 'shipments', 'shipment_items', 'shipment_charges', 'shipment_tracking', 'shipment_packages'];
  for (const table of tables) {
    try {
      await conn.query(`UPDATE ${table} SET created_at = NOW() WHERE created_at = '0000-00-00 00:00:00'`);
      await conn.query(`UPDATE ${table} SET updated_at = NOW() WHERE updated_at = '0000-00-00 00:00:00'`);
      console.log(`Fixed: ${table}`);
    } catch (e) { console.log(`Skip ${table}: ${e.message}`); }
  }
  
  conn.release();
  console.log('\nAll bad datetime values fixed successfully!');
  process.exit(0);
} catch (e) {
  console.error('Error:', e.message);
  process.exit(1);
}
