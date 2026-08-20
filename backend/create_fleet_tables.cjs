const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const host = process.env.DB_HOST || '127.0.0.1';
const port = parseInt(process.env.DB_PORT || '3306', 10);
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASS || '';
const database = process.env.DB_NAME || 'transport_management';

async function run() {
  const conn = await mysql.createConnection({ host, port, user, password, database });

  const queries = [
    `
    CREATE TABLE IF NOT EXISTS vehicles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      vehicle_number VARCHAR(100) NOT NULL,
      vehicle_type VARCHAR(100) NOT NULL,
      brand VARCHAR(100),
      model VARCHAR(100),
      capacity VARCHAR(50),
      fuel_type VARCHAR(50),
      insurance_expiry DATE,
      fitness_expiry DATE,
      permit_expiry DATE,
      status VARCHAR(50) DEFAULT 'Available',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_vehicle_number (vehicle_number)
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS drivers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      mobile VARCHAR(50) NOT NULL,
      license_number VARCHAR(100) NOT NULL,
      license_expiry DATE,
      address TEXT,
      joining_date DATE,
      status VARCHAR(50) DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_license_number (license_number)
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS trips (
      id INT AUTO_INCREMENT PRIMARY KEY,
      trip_number VARCHAR(100) NOT NULL,
      vehicle_id INT NOT NULL,
      driver_id INT NOT NULL,
      origin VARCHAR(150) NOT NULL,
      destination VARCHAR(150) NOT NULL,
      start_date DATE,
      end_date DATE,
      status VARCHAR(50) DEFAULT 'Booked',
      shipment_id BIGINT(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
      FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
      UNIQUE KEY unique_trip_number (trip_number)
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS fuel_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      vehicle_id INT NOT NULL,
      date DATE NOT NULL,
      liters DECIMAL(10,2) NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      odometer INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS maintenance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      vehicle_id INT NOT NULL,
      service_date DATE NOT NULL,
      service_type VARCHAR(150) NOT NULL,
      cost DECIMAL(12,2) DEFAULT 0,
      next_service DATE,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    )
    `,
    `
    CREATE TABLE IF NOT EXISTS vehicle_documents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      vehicle_id INT NOT NULL,
      document_type VARCHAR(100) NOT NULL,
      document_number VARCHAR(150) NOT NULL,
      expiry_date DATE NOT NULL,
      status VARCHAR(50) DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    )
    `,
  ];

  for (const query of queries) {
    await conn.query(query);
  }

  console.log("Fleet tables created successfully.");
  await conn.end();
}

run().catch((error) => {
  console.error("Failed to create fleet tables:", error);
  process.exit(1);
});
