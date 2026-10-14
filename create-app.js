
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp(db) {
  const app = express();

  app.use(express.json({ limit: '10kb' }));

  // Serve frontend files from the public folder
  app.use(express.static(path.join(__dirname, 'public')));

  // Homepage route
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ ok: true });
  });

  // Get all projects
  app.get('/api/projects', async (req, res) => {
    res.json(await db.list());
  });

  // Validate project ID
  function readId(req, res) {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      res.status(400).json({ error: 'Invalid project id.' });
      return null;
    }

    return id;
  }

  // Validate project details
  function readProject(req, res) {
    const name =
      typeof req.body?.name === 'string'
        ? req.body.name.trim()
        : '';

    const status = req.body?.status;

    if (
      name.length < 1 ||
      name.length > 80 ||
      !['Planned', 'In Progress', 'Completed'].includes(status)
    ) {
      res.status(400).json({
        error: 'Use a name of 1-80 characters and a valid status.'
      });
      return null;
    }

    return { name, status };
  }

  // Create a project
  app.post('/api/projects', async (req, res) => {
    const project = readProject(req, res);

    if (project) {
      res.status(201).json(await db.create(project));
    }
  });

  // Update a project
  app.put('/api/projects/:id', async (req, res) => {
    const id = readId(req, res);
    if (id === null) return;

    const project = readProject(req, res);
    if (!project) return;

    const row = await db.update(id, project);

    if (!row) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    res.json(row);
  });

  // Delete a project
  app.delete('/api/projects/:id', async (req, res) => {
    const id = readId(req, res);
    if (id === null) return;

    if (!(await db.remove(id))) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    res.json({ deleted: true });
  });

  // Handle unknown API routes
  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API route not found.' });
  });

  // Error handling
  app.use((error, req, res, next) => {
    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Invalid JSON.' });
    }

    if (error.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Request too large.' });
    }

    console.error('Request failed:', error.code || error.name);

    res.status(500).json({
      error: 'Server error. Check the server logs.'
    });
  });

  return app;
}

