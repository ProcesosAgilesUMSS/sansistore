import { execSync } from 'child_process';

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
    }
  }
}

export default async function globalTeardown() {
  console.log('Starting Playwright global teardown...');

  const emulatorPid = process.env.EMULATOR_PID;
  if (emulatorPid) {
    console.log(`Stopping Firestore emulator (PID: ${emulatorPid})...`);
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /PID ${emulatorPid} /T /F`, { stdio: 'ignore' });
      } else {
        process.kill(parseInt(emulatorPid), 'SIGTERM');
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log('✓ Emulator stopped');
    } catch (err) {
      console.error('Error stopping emulator:', err instanceof Error ? err.message : String(err));
    }
  }

  try {
    execSync('pkill -f "firebase emulators:start" || true', { stdio: 'ignore' });
  } catch {
  }

  stopProcessesOnPorts([8180, 9199, 4100, 4502, 4600, 9151]);
}
