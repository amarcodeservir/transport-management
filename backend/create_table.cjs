const mysql = require('mysql2/promise');
async function run() {
  const conn = await mysql.createConnection({ host: '127.0.0.1', port: 3307, user: 'root', password: '', database: 'transport_management' });
  
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS shipment_packages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      shipment_id BIGINT(20) NOT NULL,
      package_type VARCHAR(100),
      quantity INT DEFAULT 0,
      weight DECIMAL(10,2) DEFAULT 0,
      length DECIMAL(10,2) DEFAULT 0,
      width DECIMAL(10,2) DEFAULT 0,
      height DECIMAL(10,2) DEFAULT 0,
      volumetric_weight DECIMAL(10,2) DEFAULT 0,
      description VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
    )
  `;
  
  await conn.query(createTableQuery);
  console.log('Table shipment_packages created successfully.');
  conn.end();
}
run();
