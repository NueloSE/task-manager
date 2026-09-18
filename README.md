# Task Manager

A simple task manager for the PowerLabs internship assessment. You can sign up, log in, and create, view, edit and delete your own tasks.

Built with React + TypeScript (Vite) for the frontend and Express + TypeScript + SQLite for the backend.

## Running it

You need Node.js 22.22 or newer (there's an `.nvmrc`, so `nvm use` works).

```bash
npm install
npm run dev
```

Then open http://localhost:5173 and log in with the demo account:

- username: `demo`
- password: `demo1234`

Or click "log in as demo" on the login page. You can also sign up with your own account. Each account only sees its own tasks.

The database is a SQLite file at `data/tasks.db`. It's created on the first run, together with the demo account. Delete the `data` folder to start fresh.

Run the tests with:

```bash
npm test
```

## Configuration

Nothing needs to be configured to run it locally.

The only setting is `JWT_SECRET`, which is used to sign login tokens. It falls back to a development value. Set a real secret if you deploy it anywhere.

## Project structure

```
server/
  index.ts    starts the server on port 3001
  app.ts      express setup and error handling
  db.ts       sqlite tables and the demo account
  auth.ts     sign up, log in, log out, and the requireAuth middleware
  tasks.ts    the task endpoints and validation
src/
  App.tsx     checks if you're logged in and sets up the pages
  api.ts      fetch calls and shared types
  pages/      Login, TaskList, TaskDetail, TaskForm (used for both new and edit)
tests/
  api.test.ts
```

In development, Vite serves the React app on port 5173 and forwards `/api` requests to Express on port 3001.

## API

| Method | URL                  | Description         |
| ------ | -------------------- | ------------------- |
| POST   | `/api/auth/register` | Create an account   |
| POST   | `/api/auth/login`    | Log in              |
| POST   | `/api/auth/logout`   | Log out             |
| GET    | `/api/auth/me`       | Current user        |
| GET    | `/api/tasks`         | List my tasks       |
| POST   | `/api/tasks`         | Create a task       |
| GET    | `/api/tasks/:id`     | Get one task        |
| PUT    | `/api/tasks/:id`     | Update a task       |
| DELETE | `/api/tasks/:id`     | Delete a task       |

Errors come back as `{ "error": "message" }` with a status code: 400 for invalid input or broken JSON, 401 when not logged in, 404 when a task doesn't exist, 409 when a username is taken, and 500 for anything unexpected.

## Decisions

- **SQLite.** It's a real SQL database with nothing to install, just a file, so it's easy for anyone to run.
- **Plain SQL instead of an ORM.** There are only two tables, so plain queries are easy to read. Values always go through `?` placeholders, which prevents SQL injection.
- **Login.** The brief describes a single user, but a task list should be private, so I added accounts. Passwords are hashed with bcrypt. After logging in, the server puts a JWT in an httpOnly cookie, so JavaScript on the page can't read it.
- **Each user only sees their own tasks.** Every task query includes the user's id. Asking for someone else's task returns a 404.
- **Validation on both sides.** The form uses HTML validation (`required`, `maxLength`) for quick feedback. The server checks everything again because it can't trust the client.
- **One form for create and edit.** `TaskForm` checks the URL for an id to decide which one it's doing.

## Assumptions

- Title and due date are required. The description is optional.
- The due date can be in the past. The task is then marked as overdue.
- Status is one of: To do, In progress, Done.
- The created date is set by the server.

## Not done

- No limit on login attempts.
- No password reset.
- Only the API has automated tests. The frontend was tested by hand.
- No pagination or search. That's fine for a personal task list.
