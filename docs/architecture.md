# Architecture — Folder Structure
## Approach: Feature-based
```
src/
├── components/        # Shared generic UI (buttons, inputs, etc.)
├── layouts/           # Astro layouts
├── pages/             # Astro routes — only import from their feature
│   ├── login.astro
│   ├── dashboard.astro
│   └── products/
│       └── index.astro
│
├── features/          # One directory per module
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
├── lib/               # Firebase, helpers, HTTP client
└── styles/
```
## Rules
- Each page imports only from its corresponding feature
- Modules do not import from each other — shared code goes in `components/` or `lib/`
- If a component knows about Firebase or makes fetch calls, it belongs in a feature, not in `components/`
