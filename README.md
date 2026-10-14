# Student Project Tracker

A hands-on web application development project for managing engineering projects. Users can add, view, edit, and delete projects, with project data stored in a local SQLite database.

## Features

* Add projects with a name and status.
* Display the saved project list.
* Edit existing projects.
* Delete projects with confirmation.
* Validate project input.
* Store project data persistently using SQLite.
* Communicate between the frontend and backend through a REST API.
* Display feedback for application operations and errors.

## Requirements

* Node.js 22.18 or later, but below version 23, as specified by the workshop.
* npm, included with Node.js.
* Git.
* Visual Studio Code or another code editor.

## Run Locally

1. Open the project folder in VS Code.

2. Open a PowerShell terminal in the project directory.

3. Install the dependencies:

   ```powershell
   npm.cmd ci
   ```

4. Start the server:

   ```powershell
   npm.cmd start
   ```

5. Open the application in your browser:

   `http://localhost:3000`

To stop the server, press `Ctrl + C` in the terminal where it is running.

## How It Works

The application follows this request cycle:

**Browser → Frontend JavaScript → HTTP Request → Express API → SQLite Database → JSON Response → Updated Browser Page**

When a user submits a project, the frontend sends a request to the backend. Express validates the request and uses the database module to perform the required operation. The server returns a response, and the frontend updates the displayed project list.

## Project Structure

* `public/index.html` — Defines the page structure and project form.
* `public/style.css` — Contains the page styling and responsive layout.
* `public/script.js` — Handles form input, API requests, project rendering, and user feedback.
* `server.js` — Starts the local application server.
* `app.js` — Defines API routes, validation, and HTTP responses.
* `database.js` — Manages SQLite database operations.
* `data/projects.db` — Local SQLite database file created by the application.
* `test/crud.test.js` — Automated API test supplied with the workshop.

## API Endpoints

| Method | Endpoint            | Purpose                    |
| ------ | ------------------- | -------------------------- |
| GET    | `/api/health`       | Check API health           |
| GET    | `/api/projects`     | Retrieve all projects      |
| POST   | `/api/projects`     | Create a project           |
| PUT    | `/api/projects/:id` | Update an existing project |
| DELETE | `/api/projects/:id` | Delete a project           |

## Verification

### Automated Testing

The supplied workshop API test was executed using:

```powershell
npm.cmd test
```

**Observed result:** Passed.

* Tests: 1
* Passed: 1
* Failed: 0

The automated test reported coverage of CRUD operations, validation, persistence, API errors, and static frontend serving.

This automated test does not establish that every browser interaction or responsive layout works correctly.

### Manual Browser Testing

Complete these checks and record the actual results:

* [ ] Create two distinct projects.
* [ ] Edit a project and verify its ID remains unchanged.
* [ ] Cancel a deletion and verify the project remains.
* [ ] Confirm a deletion and verify the project is removed.
* [ ] Refresh the page and verify saved data remains.
* [ ] Restart the server and verify saved data persists.
* [ ] Reject empty and whitespace-only project names.
* [ ] Stop the server, observe the save failure, restart it, and retry successfully.
* [ ] Verify keyboard navigation and visible focus.
* [ ] Verify the application at a viewport width of 390 pixels.

Only mark a check as complete after performing it.

## Workshop Limitations

This is a local educational application, not a production-ready service.

* It does not provide user accounts or per-user access permissions.
* Users accessing the same server share its project collection.
* The SQLite database file is stored locally and is not uploaded to GitHub.
* Dependencies in `node_modules` are installed locally and are not uploaded to GitHub.
* Cloud deployment requires appropriate server and database configuration.
* Production use would require additional security, reliability, and deployment considerations.

## Learning Objectives

This project provides practical experience with:

* HTML, CSS, and browser JavaScript.
* HTTP requests and REST API design.
* Express server development.
* Input validation and error handling.
* SQLite database operations and persistence.
* Git, GitHub, and automated API testing.

