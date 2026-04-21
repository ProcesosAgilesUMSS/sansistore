# Sansistore - CI/CD Workflow

## Docs

| Doc | Description |
|-----|-------------|
| [Architecture](docs/architecture.md) | Stack, folder structure and environments |
| [Branches](docs/branches.md) | Branch naming, prefixes and workflow |
| [Commits](docs/commits.md) | Format, types and examples |
| [CI/CD](docs/cicd.md) | Pipeline and deploy to production |
| [Pull Requests](docs/pull-requests.md) | Template, checklist and issue types |

---

## Daily flow

```mermaid
flowchart LR
    A[developer<br/>creates branch] --> B[feature/task<br/>work]
    B --> C[PR to develop<br/>review]
    C --> D[CI/CD<br/>action]
    D --> E[develop<br/>merge]
    
    style A fill:#e1f5fe
    style E fill:#c8e6c9
    style D fill:#fff3e0
```

1. Create branch from `develop` → see [Branches](docs/branches.md)
2. Work and commit → see [Commits](docs/commits.md)
3. Open PR to `develop` and wait for approval + CI to pass → see [Pull Requests](docs/pull-requests.md)
4. Merge to `develop`

---

## Release flow

```mermaid
flowchart LR
    A[develop<br/>ready] --> B[merge to main<br/>release manager]
    B --> C[create tag<br/>vX.X.X]
    C --> D[deploy<br/>production]
    
    style A fill:#e1f5fe
    style D fill:#c8e6c9
```

```bash
git checkout main && git merge develop && git push origin main
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

→ see [CI/CD](docs/cicd.md)

---

## General workflow

```mermaid
flowchart TB
    subgraph MAIN["MAIN (production)"]
        M1[automatic deploy]
        M1 <-.- tag[vX.X.X]
    end
    
    subgraph DEVELOP["DEVELOP (staging)"]
        D1[automatic CI/CD]
    end
    
    subgraph FEATURES["FEATURE BRANCHES"]
        F1[feature/*]
        F2[fix/*]
        F3[hotfix/*]
        F4[chore/*]
    end
    
    F1 --> D1
    F2 --> D1
    F3 --> D1
    F4 --> D1
    D1 -->|APPROVAL + CI OK| DEVELOP
    DEVELOP -.->|merge| MAIN
    
    style MAIN fill:#c8e6c9
    style DEVELOP fill:#fff3e0
    style FEATURES fill:#e1f5fe
```

---

## Useful commands

| Command | Description |
|---------|-------------|
| `git checkout -b feature/your-task` | Create branch for task |
| `git checkout develop && git pull` | Update develop |
| `git push -u origin feature/your-task` | Push branch first time |
| `git push origin main` | Push to main (release only) |
| `git tag -a v1.0.0 -m "message"` | Create version tag |
| `git push origin v1.0.0` | Push tag to deploy |

---

## Frontend

**Stack:** Astro + React + Tailwind CSS + Firebase

```bash
bun install          # Install dependencies
bun dev              # Start dev server (localhost:4321)
bun build            # Production build
bun preview          # Preview build
bun astro check      # Typecheck
```

---

## Global rules

- **NEVER** `git push -f` to `develop` or `main`
- **NEVER** push directly to `main` or `develop`
- Always create an issue before starting work
- Always use PR template with clear description
- Wait for approval before merging
- CI must pass before merging
- Keep `develop` stable for the team
