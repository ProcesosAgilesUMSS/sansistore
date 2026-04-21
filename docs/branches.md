# Branches

## Ramas principales

| Rama | Propósito | Acceso |
|------|-----------|--------|
| `main` | Producción | Solo release manager |
| `develop` | Staging / integración | Todo el equipo (via PR) |

## Ramas de trabajo

| Prefijo | Cuándo usar | Ejemplo |
|---------|-------------|---------|
| `feature/` | Nueva funcionalidad | `feature/login-page` |
| `fix/` | Corrección de bug | `fix/email-validation` |
| `hotfix/` | Fix urgente directo a main | `hotfix/payment-crash` |
| `chore/` | Tareas técnicas | `chore/update-deps` |

## Flujo

```
develop ──► feature/tu-tarea  ──► PR ──► develop ──► main
main    ──► hotfix/fix-urgente ──► PR ──► main + merge a develop
```

## Comandos

```bash
# Crear rama desde develop
git checkout develop
git pull origin develop
git checkout -b feature/nombre-tarea

# Push primera vez
git push -u origin feature/nombre-tarea

# Actualizar rama con cambios de develop
git checkout develop && git pull
git checkout feature/nombre-tarea
git merge develop
```

## Reglas

- Partir **siempre** desde `develop`, nunca desde `main`
- **NUNCA** push directo a `main` o `develop`
- **NUNCA** `git push -f` a `main` o `develop`
- Nombrar en kebab-case: `feature/mi-tarea` no `feature/miTarea`
- Una rama por issue/tarea
