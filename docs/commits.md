# Commits

## Format

```
<type>: <description in imperative mood, lowercase>
```

## Types

| Type       | When to use                            |
| ---------- | -------------------------------------- |
| `feat`     | New functionality                      |
| `fix`      | Bug fix                                |
| `refactor` | Code change with no new behavior       |
| `chore`    | Technical tasks, configs, dependencies |
| `docs`     | Documentation                          |
| `style`    | Formatting, spacing (no logic change)  |
| `test`     | Add or update tests                    |

## Examples

```bash
git commit -m "feat: add login form"
git commit -m "fix: correct email validation in registration"
git commit -m "refactor: extract useAuth hook from LoginPage"
git commit -m "chore: update tailwind dependencies"
git commit -m "docs: document Button component"
```

## Rules

- Use imperative mood: `add` not `added` or `adding`
- Always lowercase
- No trailing period
- Clear and concise description
- One commit per logical change — do not mix features
