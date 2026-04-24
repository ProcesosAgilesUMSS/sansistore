# CI/CD

## Pipeline (automatic on PRs)

```
bun astro check  ──►  bun build  ──►  lint / tests
   (typecheck)       (build check)    (code quality)
```

Merge only happens with **approval + CI green**.

## Deployments (Vercel)

We deploy from branches:

| Branch | Deploy URL |
|---|---|
| `main` | https://sansistore-test.vercel.app |
| `production` | https://sansistore-umss.vercel.app |

Release flow:

1. During the sprint, PRs merge into `main` (QA / pre-release).
2. At sprint end, open a pull request `main` → `production`.
3. Merge after QA sign-off.

## Rules

- CI must pass before merging
- Never push directly to `main` or `production`
- Never force-push to `main` or `production`
