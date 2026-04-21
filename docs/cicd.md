# CI/CD

## Pipeline (automatic on every PR to develop)

```
bun astro check  ──►  bun build  ──►  lint / tests
   (typecheck)       (build check)    (code quality)
```

Merge only happens with **approval + CI green**.

## Deploy to production

```bash
# 1. Merge develop → main (release manager only)
git checkout main
git merge develop
git push origin main

# 2. Create version tag → triggers automatic deploy
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

## Rules

- CI must pass before merging
- Only the release manager can merge to `main`
- Production deploy is triggered **only** by a `vX.X.X` tag
- Keep `develop` stable for the rest of the team
