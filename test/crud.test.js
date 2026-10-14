import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../create-app.js';

const projects = new Map();
let nextId = 1;

const testDb = {
  async list() {
    return [...projects.values()].sort((a, b) => b.id - a.id);
  },

  async create({ name, status }) {
    const project = { id: nextId++, name, status };
    projects.set(project.id, project);
    return project;
  },

  async update(id, { name, status }) {
    if (!projects.has(id)) return null;

    const project = { id, name, status };
    projects.set(id, project);
    return project;
  },

  async remove(id) {
    return projects.delete(id);
  }
};

const app = createApp(testDb);

let server;
let baseUrl;

test('CRUD, validation, API errors and static frontend', async () => {
  projects.clear();
  nextId = 1;

  server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });

  baseUrl = `http://localhost:${server.address().port}`;
  const url = `${baseUrl}/api/projects`;

  const options = (method, body) => ({
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  try {
    assert.deepEqual(await (await fetch(url)).json(), []);

    assert.equal(
      (await fetch(url, options('POST', {
        name: ' ',
        status: 'Planned'
      }))).status,
      400
    );

    assert.equal(
      (await fetch(url, options('POST', {
        name: 'IoT',
        status: 'Unknown'
      }))).status,
      400
    );

    assert.equal(
      (await fetch(url, options('POST', {
        name: 'x'.repeat(81),
        status: 'Planned'
      }))).status,
      400
    );

    const response = await fetch(url, options('POST', {
      name: "  IoT Monitor's test  ",
      status: 'Planned'
    }));

    assert.equal(response.status, 201);

    const row = await response.json();

    assert.equal(row.name, "IoT Monitor's test");

    const updated = await fetch(
      `${url}/${row.id}`,
      options('PUT', {
        name: 'Smart Home',
        status: 'Completed'
      })
    );

    assert.equal((await updated.json()).status, 'Completed');

    assert.equal(
      (await fetch(`${url}/0`, { method: 'DELETE' })).status,
      400
    );

    assert.equal(
      (await fetch(
        `${url}/999999`,
        options('PUT', {
          name: 'Missing',
          status: 'Planned'
        })
      )).status,
      404
    );

    assert.equal(
      (await fetch(`${url}/${row.id}`, {
        method: 'DELETE'
      })).status,
      200
    );

    assert.equal(
      (await fetch(`${url}/${row.id}`, {
        method: 'DELETE'
      })).status,
      404
    );

    assert.equal(
      (await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{'
      })).status,
      400
    );

    assert.equal(
      (await fetch(`${baseUrl}/api/unknown`)).status,
      404
    );

    assert.match(
      await (await fetch(`${baseUrl}/`)).text(),
      /Student Project Tracker/
    );

    assert.deepEqual(await (await fetch(url)).json(), []);
  } finally {
    await new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
  }
});