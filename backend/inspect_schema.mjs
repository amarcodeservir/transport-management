import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASS || "",
      database: process.env.DB_NAME || ""
    });

    const [tables] = await conn.query("SHOW TABLES");
    console.log("Tables:", tables.map(r => Object.values(r)[0]));

    for (const row of tables) {
      const table = Object.values(row)[0];
      console.log("\n####", table);
      const [indexes] = await conn.query(`SHOW INDEX FROM \`${table}\``);
      indexes.forEach(idx => {
        console.log(idx.Key_name, idx.Non_unique, idx.Seq_in_index, idx.Column_name, idx.Sub_part, idx.Index_type);
      });
      const [create] = await conn.query(`SHOW CREATE TABLE \`${table}\``);
      console.log(create[0]['Create Table']);
    }

    await conn.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
