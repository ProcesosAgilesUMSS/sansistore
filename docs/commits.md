# Commits

## Formato

```
<tipo>: <descripción en imperativo, minúsculas>
```

## Tipos

| Tipo | Cuándo usar |
|------|-------------|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `refactor` | Cambio de código sin nuevo comportamiento |
| `chore` | Tareas técnicas, configs, dependencias |
| `docs` | Documentación |
| `style` | Formato, espaciado (sin cambio de lógica) |
| `test` | Agregar o modificar tests |

## Ejemplos

```bash
git commit -m "feat: agregar formulario de login"
git commit -m "fix: corregir validación de email en registro"
git commit -m "refactor: extraer hook useAuth de LoginPage"
git commit -m "chore: actualizar dependencias de tailwind"
git commit -m "docs: documentar componente Button"
```

## Reglas

- Usar imperativo: `agregar` no `agregué` ni `agregando`
- Minúsculas siempre
- Sin punto final
- Descripción clara y concisa
- Un commit por cambio lógico — no mezclar funcionalidades
