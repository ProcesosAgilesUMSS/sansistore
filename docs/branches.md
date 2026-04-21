# Branches
## Main branches
| Branch | Purpose | Access |
|--------|---------|--------|
| `main` | Production | Release manager only |
| `develop` | Staging / integration | Whole team (via PR) |
## Working branches
| Prefix | When to use | Example |
|--------|-------------|---------|
| `feature/` | New functionality | `feature/login-page` |
| `fix/` | Bug fix | `fix/email-validation` |
| `hotfix/` | Urgent fix directly to main | `hotfix/payment-crash` |
| `chore/` | Technical tasks | `chore/update-deps` |
## Flow
```
develop ──► feature/your-task  ──► PR ──► develop ──► main
main    ──► hotfix/urgent-fix  ──► PR ──► main + merge into develop
```
## Commands
```bash
# Create branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/task-name
# Push for the first time
git push -u origin feature/task-name
# Update branch with changes from develop
git checkout develop && git pull
git checkout feature/task-name
git merge develop
```
## Rules
- Always branch off from `develop`, never from `main`
- **NEVER** push directly to `main` or `develop`
- **NEVER** `git push -f` to `main` or `develop`
- Name in kebab-case: `feature/my-task` not `feature/myTask`
- One branch per issue/task
