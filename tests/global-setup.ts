import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let emulatorProcess = null;

process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

async function waitForEmulator(
  host: string,
  label: string,
  maxAttempts = 60,
  delayMs = 500
) {
  let attempts = 0;
  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`http://${host}/`, {
        signal: AbortSignal.timeout(2000),
      });
      if (response.ok || response.status === 404) {
        console.log(`✓ ${label} emulator is ready`);
        return true;
      }
    } catch (err) {
      // Connection failed, retry
    }
    attempts++;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  throw new Error(`${label} emulator did not start within timeout`);
}

async function runSeed() {
  await new Promise<void>((resolve, reject) => {
    const seedProcess = spawn('bun', ['run', 'seed'], {
      stdio: 'inherit',
      detached: false,
      env: {
        ...process.env,
        FIRESTORE_EMULATOR_HOST: 'localhost:8080',
        FIREBASE_AUTH_EMULATOR_HOST: 'localhost:9099',
        PUBLIC_FIREBASE_PROJECT_ID:
          process.env.PUBLIC_FIREBASE_PROJECT_ID || 'sansistore',
      },
    });

    seedProcess.on('error', reject);
    seedProcess.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(`Seed command failed with exit code ${code ?? 'unknown'}`)
      );
    });
  });
}

export default async function globalSetup() {
  console.log('Starting Playwright global setup...');

  console.log(
    'Starting Firestore and Auth emulators on ports 8080 and 9099...'
  );
  emulatorProcess = spawn(
    'firebase',
    ['emulators:start', '--only', 'firestore,auth', '--project', 'sansistore'],
    {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    }
  );

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

  await waitForEmulator('localhost:8080', 'Firestore');
  await waitForEmulator('localhost:9099', 'Auth');

  await runSeed();
  console.log('✓ Shared test data seeded');

  if (!emulatorProcess.pid) {
    throw new Error('Failed to capture emulator PID');
  }

  process.env.EMULATOR_PID = emulatorProcess.pid.toString();
}
