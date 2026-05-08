import { spawn } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const processes = [
  spawn(npmCommand, ['run', 'dev:server'], { stdio: 'inherit' }),
  spawn(npmCommand, ['run', 'dev:web'], { stdio: 'inherit' })
];

let isShuttingDown = false;

const shutdown = (exitCode = 0) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  for (const child of processes) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }
  process.exit(exitCode);
};

for (const child of processes) {
  child.on('exit', (code) => {
    if (!isShuttingDown && code !== 0) {
      shutdown(code ?? 1);
    }
  });
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
