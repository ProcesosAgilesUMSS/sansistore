++# Seeding Local Emulator
++
This project includes a small seeder utility (Node ESM) under `seed/` to populate Firestore with sample data for local development.

How it works

- The dispatcher is `seed/index.mjs`. It discovers and runs all `*.mjs` files inside the `seed` folder (except `index.mjs`).
- Each seeder exports an async `run({ adminApp, db })` function that receives the initialized Admin SDK and Firestore DB instance.
- The seeder sets `FIRESTORE_EMULATOR_HOST` by default so it targets the local Firestore emulator (localhost:8080). This avoids accidental writes to a production project.

Available seeders

- `seed/seed-products.mjs`: creates example categories, products and inventory documents.

Running the seeder

1. Start the Firestore emulator (recommended):

```bash
# starts Firestore and Auth emulators
bun run emu
```

2. Run all seeders:

```bash
bun run seed
# or
node ./seed/index.mjs
```

3. Run a single seeder by filename (no extension required):

```bash
node ./seed/index.mjs seed-products
```

Notes

- The `package.json` contains a `seed` script that runs `node ./seed/index.mjs`.
- The seeder defaults to `FIRESTORE_EMULATOR_HOST=localhost:8080` if the env var is not set, so it's safe to run against your local emulator without additional env configuration.
- If you want to target a different project or emulator host, set the appropriate env vars before running the seeder.
