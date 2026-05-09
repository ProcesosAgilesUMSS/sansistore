# Branches

## Main branches

| Branch       | Purpose                    | Access              |
| ------------ | -------------------------- | ------------------- |
| `main`       | Staging / QA (pre-release) | Whole team (via PR) |
| `production` | Production (live)          | Limited (via PR)    |

Deploy mapping (Vercel):

| Branch       | Deploy URL                         |
| ------------ | ---------------------------------- |
| `main`       | https://sansistore-test.vercel.app |
| `production` | https://sansistore-umss.vercel.app |

## Working branches

| Prefix     | When to use               | Example                |
| ---------- | ------------------------- | ---------------------- |
| `feature/` | New functionality         | `feature/login-page`   |
| `fix/`     | Bug fix                   | `fix/email-validation` |
| `hotfix/`  | Urgent fix for production | `hotfix/payment-crash` |
| `chore/`   | Technical tasks           | `chore/update-deps`    |

## Flow

```
main        ──► feature/your-task  ──► PR ──► main
main        ──► fix/your-bug       ──► PR ──► main
main        ──► (end of sprint)    ──► PR ──► production
production  ──► hotfix/urgent-fix  ──► PR ──► production ──► back-merge ──► main
```

## Commands

```bash
# Create branch from main
git checkout main
git pull origin main
git checkout -b feature/task-name

# Push for the first time
git push -u origin feature/task-name

# Update your branch with changes from main
git checkout main && git pull
git checkout feature/task-name
git merge main
```

## Rules

- Branch off from `main` for normal work.
- Hotfixes branch off from `production`.
- Never push directly to `main` or `production`.
- Never force-push to `main` or `production`.
- Name in kebab-case: `feature/my-task` not `feature/myTask`.
- One branch per issue/task.
