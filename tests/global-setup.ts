import { execSync, spawn } from 'child_process';

let emulatorProcess = null;

const FIRESTORE_TEST_HOST = '127.0.0.1:8180';
const AUTH_TEST_HOST = '127.0.0.1:9199';

process.env.FIRESTORE_EMULATOR_HOST = FIRESTORE_TEST_HOST;
process.env.FIREBASE_AUTH_EMULATOR_HOST = AUTH_TEST_HOST;

function stopProcessesOnPorts(ports: number[]) {
  if (process.platform === 'win32') {
    for (const port of ports) {
      try {
        const output = execSync(
          `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique"`,
          { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
        );
        const pids = output
          .split(/\r?\n/)
          .map((line) => Number(line.trim()))
          .filter((pid) => Number.isInteger(pid) && pid > 0);

        for (const pid of pids) {
          execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
        }
      } catch {
        // No process found on this port.
      }
    }
    return;
  }

  for (const port of ports) {
    try {
      execSync(`lsof -ti tcp:${port} | xargs -r kill -9`, {
        stdio: 'ignore',
      });
    } catch {
      // No process found on this port.
    }
  }
}

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
    } catch {
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
        FIRESTORE_EMULATOR_HOST: FIRESTORE_TEST_HOST,
        FIREBASE_AUTH_EMULATOR_HOST: AUTH_TEST_HOST,
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
  stopProcessesOnPorts([8180, 9199, 4100, 4502, 4600, 9151]);

  console.log(
    'Starting Firestore and Auth emulators on ports 8180 and 9199...'
  );
  emulatorProcess = spawn(
    'firebase',
    [
      'emulators:start',
      '--only',
      'firestore,auth',
      '--project',
      'sansistore',
      '--config',
      'firebase.testing.json',
    ],
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

  await waitForEmulator(FIRESTORE_TEST_HOST, 'Firestore');
  await waitForEmulator(AUTH_TEST_HOST, 'Auth');
  await new Promise((resolve) => setTimeout(resolve, 1500));

  await runSeed();
  console.log('✓ Shared test data seeded');

  if (!emulatorProcess.pid) {
    throw new Error('Failed to capture emulator PID');
  }

  process.env.EMULATOR_PID = emulatorProcess.pid.toString();
}
