
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing. Check your .env file.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function formatProject(row) {
  if (!row) return null;

  return {
    id: Number(row.id),
    name: row.name,
    status: row.status
  };
}

export const db = {
  async list() {
    const result = await pool.query(
      'SELECT id, name, status FROM public.projects ORDER BY id DESC'
    );

    return result.rows.map(formatProject);
  },

  async create({ name, status }) {
    const result = await pool.query(
      `INSERT INTO public.projects (name, status)
       VALUES ($1, $2)
       RETURNING id, name, status`,
      [name, status]
    );

    return formatProject(result.rows[0]);
  },

  async update(id, { name, status }) {
    const result = await pool.query(
      `UPDATE public.projects
       SET name = $1, status = $2
       WHERE id = $3
       RETURNING id, name, status`,
      [name, status, id]
    );

    return formatProject(result.rows[0]);
  },

  async remove(id) {
    const result = await pool.query(
      'DELETE FROM public.projects WHERE id = $1',
      [id]
    );

    return result.rowCount > 0;
  }
};

