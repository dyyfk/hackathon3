# Hackathon3 Website Variants

This repo is a unified Next.js app for comparing two website variants under the
same access pattern.

## Routes

- `/versionA` renders the Staybnb booking prototype from `TEST_WEBSITE_A`.
- `/versionB` renders the Airbnb archive/version browser as a dynamic React page.
- `/` redirects to `/versionA`.

The intended local URLs are:

- `http://localhost:3000/versionA`
- `http://localhost:3000/versionB`

If another process is using port 3000, run the app on another port and use the
same route paths, for example `http://localhost:3100/versionB`.

## Development

Install dependencies:

```bash
npm ci
```

Run the development server on the default port:

```bash
npm run dev
```

Run on a specific port:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3100
```

## Verification

Run lint:

```bash
npm run lint
```

Run a production build:

```bash
npm run build
```

Run Playwright tests:

```bash
npx playwright test
```

If port 3000 is occupied, use:

```bash
PORT=3100 npx playwright test
```
