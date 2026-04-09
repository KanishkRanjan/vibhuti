import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Running database migrations...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR PRIMARY KEY,
        sess JSONB NOT NULL,
        expire TIMESTAMP NOT NULL
      );
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire);

      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR UNIQUE,
        first_name VARCHAR,
        last_name VARCHAR,
        profile_image_url VARCHAR,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS municipal_corps (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        ward TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS profiles (
        user_id VARCHAR PRIMARY KEY REFERENCES users(id),
        aadhaar_number TEXT NOT NULL,
        points INTEGER NOT NULL DEFAULT 0,
        badge TEXT NOT NULL DEFAULT 'citizen'
      );

      CREATE TABLE IF NOT EXISTS issues (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        location TEXT NOT NULL,
        ward_area TEXT,
        maintenance_type TEXT NOT NULL,
        image_url TEXT,
        author_id VARCHAR NOT NULL REFERENCES users(id),
        status TEXT NOT NULL DEFAULT 'pending',
        assigned_municipal_id INTEGER REFERENCES municipal_corps(id),
        claimed_at TIMESTAMP,
        resolved_at TIMESTAMP,
        resolution_note TEXT,
        is_escalated BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS upvotes (
        user_id VARCHAR NOT NULL REFERENCES users(id),
        issue_id INTEGER NOT NULL REFERENCES issues(id),
        PRIMARY KEY (user_id, issue_id)
      );

      CREATE TABLE IF NOT EXISTS issue_logs (
        id SERIAL PRIMARY KEY,
        issue_id INTEGER NOT NULL REFERENCES issues(id),
        status TEXT NOT NULL,
        note TEXT,
        changed_by TEXT NOT NULL,
        changed_by_type TEXT NOT NULL DEFAULT 'system',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS point_logs (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR NOT NULL REFERENCES users(id),
        points_change INTEGER NOT NULL,
        reason TEXT NOT NULL,
        issue_id INTEGER REFERENCES issues(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    console.log("Migrations complete.");
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
