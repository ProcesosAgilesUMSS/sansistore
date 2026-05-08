import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let emulatorProcess = null;
let adminApp = null;

// Safety: set emulator host for admin SDK
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

async function waitForEmulator(maxAttempts = 60, delayMs = 500) {
  let attempts = 0;
  while (attempts < maxAttempts) {
    try {
      const response = await fetch('http://localhost:8080/', { timeout: 2000 });
      if (response.ok || response.status === 404) {
        console.log('✓ Firestore emulator is ready');
        return true;
      }
    } catch (err) {
      // Connection failed, retry
    }
    attempts++;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  throw new Error('Firestore emulator did not start within timeout');
}

async function seedTestData() {
  console.log('Seeding test data...');
  const seedPath = path.resolve(__dirname, '..', 'seed', 'test-data.mjs');
  const seedModule = await import(`file://${seedPath}`);

  const db = adminApp.firestore();
  await seedModule.run({ adminApp, db });
  console.log('✓ Test data seeded');
}

export default async function globalSetup() {
  console.log('Starting Playwright global setup...');

  // Initialize Firebase Admin SDK
  adminApp = admin.initializeApp({
    projectId: process.env.PUBLIC_FIREBASE_PROJECT_ID || 'sansistore',
  });

  // Start Firestore emulator
  console.log('Starting Firestore emulator on port 8080...');
  emulatorProcess = spawn('firebase', ['emulators:start', '--only', 'firestore', '--project', 'sansistore'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  });

  // Log emulator output for debugging
  if (emulatorProcess.stdout) {
    emulatorProcess.stdout.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg) console.log(`[Emulator] ${msg}`);
    });
  }
  if (emulatorProcess.stderr) {
    emulatorProcess.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg) console.log(`[Emulator Error] ${msg}`);
    });
  }

  await waitForEmulator();

  // Seed test data
  await seedTestData();

  // Store the process ID so teardown can kill it
  process.env.EMULATOR_PID = emulatorProcess.pid.toString();
}
