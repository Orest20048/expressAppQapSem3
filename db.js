import pkg from 'pg';
const { Pool } = pkg;

// Create a pool for database connections
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

/**
 * Function to initialize the database by creating the tasks table if it doesn't exist.
 */
export const initializeDatabase = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      description TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(createTableQuery);
    console.log('Database initialized successfully.');
  } catch (error) {
    console.error('Error initializing database:', error.message);
  }
};

/**
 * Middleware to check database connection health.
 */
export const checkDatabaseConnection = async (req, res, next) => {
  try {
    await pool.query('SELECT 1'); // Simple query to check connection
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database connection error.' });
  }
};

export default pool;
