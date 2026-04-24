# Sansistore Docs

This folder is the team handbook for how we build, review, and release Sansistore.

## First day checklist

1. Run the app locally:

```bash
bun install
bun dev
```

2. Make sure you understand the environments:

| Branch | Purpose | Deploy URL |
|---|---|---|
| `main` | Staging / QA (pre-release) | https://sansistore-test.vercel.app |
| `production` | Production (live) | https://sansistore-umss.vercel.app |

3. Create work branches from `main` and open PRs back into `main`.

## Where to look

- [Architecture](./architecture.md): folder structure and boundaries
- [Branches](./branches.md): naming and workflow (including releases)
- [Commits](./commits.md): commit message rules
- [Pull Requests](./pull-requests.md): PR expectations
- [CI/CD](./cicd.md): required checks and deployments
- [Daily Report](./daily-report.md): how we post daily updates

Legacy mdBook site: https://procesosagilesumss.github.io/sansistore/
