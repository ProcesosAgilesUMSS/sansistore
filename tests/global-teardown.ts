import { execSync } from 'child_process';

export default async function globalTeardown() {
  console.log('Starting Playwright global teardown...');

  const emulatorPid = process.env.EMULATOR_PID;
  if (emulatorPid) {
    console.log(`Stopping Firestore emulator (PID: ${emulatorPid})...`);
    try {
      // Try killing the process gracefully first
      process.kill(parseInt(emulatorPid), 'SIGTERM');
      // Give it a moment to shut down
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log('✓ Emulator stopped');
    } catch (err) {
      console.error('Error stopping emulator:', err.message);
    }
  }

  // Also try to kill any lingering firebase processes
  try {
    execSync('pkill -f "firebase emulators:start" || true', { stdio: 'ignore' });
  } catch (err) {
    // Silently ignore if no processes found
  }
}
