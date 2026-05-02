#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import admin from 'firebase-admin';

// Safety: default to emulator host so we don't accidentally hit prod
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';

// Initialize Admin SDK for emulator-only usage
admin.initializeApp({ projectId: process.env.PUBLIC_FIREBASE_PROJECT_ID || 'sansistore' });
const db = admin.firestore();

async function runSeeder(file) {
  const full = path.join(process.cwd(), 'seed', file);
  const url = pathToFileURL(full).href;
  const mod = await import(url);
  if (typeof mod.run !== 'function') {
    console.warn(`${file} does not export run()`);
    return;
  }
  console.log(`Running seeder ${file}...`);
  await mod.run({ adminApp: admin, db });
}

async function main() {
  const arg = process.argv[2];
  const files = fs.readdirSync(path.join(process.cwd(), 'seed'))
    .filter((f) => f.endsWith('.mjs') && f !== 'index.mjs');

  if (arg) {
    const target = arg.endsWith('.mjs') ? arg : `${arg}.mjs`;
    if (!files.includes(target)) {
      console.error('Seeder not found:', target);
      process.exit(1);
    }
    await runSeeder(target);
  } else {
    for (const f of files) {
      await runSeeder(f);
    }
  }

  console.log('All requested seeders finished');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seeder dispatcher failed', err);
  process.exit(1);
});
