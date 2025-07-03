# Simple Transit

Simple Transit is a progressive web application that shows nearby Berlin transit
stations and upcoming departures on an interactive map. It is built with Vue 3
and TypeScript using Vite and Tailwind CSS. Unit tests are written with Vitest.

## Development Server

Install dependencies and start the Vite development server:

```bash
npm install
npm run dev
```

The app will be available at <http://localhost:5173> by default.

## Docker

To run the production build using Docker:

```bash
docker build -t simple-transit .
docker run -p 8080:80 simple-transit
```

Open <http://localhost:8080> in your browser to view the app.

## Running Tests

Install dependencies and run the test suite:

```bash
npm install
npx vitest run
```

For CI environments, prefer `npm ci` to install dependencies
according to the lock file.

## Creating Releases

1. Update the version in `package.json` using npm:

```bash
npm version patch # or minor/major
```

2. Push the commit and tag to GitHub:

```bash
git push origin main --follow-tags
```

Pushing a version tag like `v1.2.3` triggers the container build workflow, which publishes a Docker image tagged with that version and with `latest`. Only tagged releases invoke this workflow.
