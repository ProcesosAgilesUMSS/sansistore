# Sansistore Docs

This folder is the team handbook for how we build, review, and release Sansistore.

## First day checklist

1. Run the app locally:

```bash
bun install
bun dev
```

2. Run Firebase emulators (optional, recommended for local development)

```bash
# starts Firestore and Auth emulators (configured in firebase.json)
bun run emu
```

Notes:

- The app will automatically connect to the local emulators when the environment variable `PUBLIC_APP_ENV` is not set to `production` (see `src/lib/firebase.ts`).
- Firestore emulator runs on localhost:8080 and Auth emulator on localhost:9099 by default (configured in `firebase.json`).
 - The Firebase Local Emulator requires Java 21 or newer to run. Verify with `java -version` and install/update Java if needed.

2. Make sure you understand the environments:

| Branch       | Purpose                    | Deploy URL                         |
| ------------ | -------------------------- | ---------------------------------- |
| `main`       | Staging / QA (pre-release) | https://sansistore-test.vercel.app |
| `production` | Production (live)          | https://sansistore-umss.vercel.app |

3. Create work branches from `main` and open PRs back into `main`.

## Where to look

- [Architecture](./architecture.md): folder structure and boundaries
- [Branches](./branches.md): naming and workflow (including releases)
- [Commits](./commits.md): commit message rules
- [Pull Requests](./pull-requests.md): PR expectations
- [CI/CD](./cicd.md): required checks and deployments
- [Daily Report](./daily-report.md): how we post daily updates

- [Seeding](./seed.md): using the seeder to populate the local emulator

Docs site: https://procesosagilesumss.github.io/sansistore/
