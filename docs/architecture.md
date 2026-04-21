# Arquitectura — Estructura de Carpetas

## Enfoque: Feature-based

```
src/
├── components/        # UI genérico compartido (botones, inputs, etc.)
├── layouts/           # Astro layouts
├── pages/             # Rutas Astro — solo importan su feature
│   ├── login.astro
│   ├── dashboard.astro
│   └── products/
│       └── index.astro
│
├── features/          # Un directorio por módulo
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types.ts
│   └── products/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── types.ts
│
├── lib/               # Firebase, helpers, cliente HTTP
└── styles/
```

## Reglas

- Cada página importa solo desde su feature correspondiente
- Los módulos no se importan entre sí — lo compartido va a `components/` o `lib/`
- Si un componente conoce Firebase o hace fetch, pertenece a un feature, no a `components/`
