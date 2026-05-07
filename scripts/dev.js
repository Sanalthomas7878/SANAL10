const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const services = [
  {
    name: 'backend',
    color: '\x1b[36m',
    args: ['run', 'dev', '--prefix', 'backend'],
  },
  {
    name: 'frontend',
    color: '\x1b[35m',
    args: ['run', 'dev', '--prefix', 'frontend'],
  },
];

const reset = '\x1b[0m';
const children = [];
let shuttingDown = false;

const printLine = (service, line) => {
  if (!line) {
    return;
  }

  const prefix = `${service.color}[${service.name}]${reset}`;
  process.stdout.write(`${prefix} ${line}\n`);
};

const warnMissingEnv = (relativePath, example) => {
  const fullPath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`Missing ${relativePath}`);
    console.log(`Add this before starting the app:\n${example}\n`);
  }
};

const terminateAll = (signal = 'SIGTERM') => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
};

warnMissingEnv(
  'backend/.env',
  'PORT=5050\nMONGO_URI=mongodb://127.0.0.1:27017/ecoscrap\nJWT_SECRET=your_super_secret_jwt_key_here',
);
warnMissingEnv(
  'frontend/.env',
  'VITE_API_URL=http://127.0.0.1:5050/api\nVITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key',
);

console.log('Starting EcoScrap Pro development servers...');
console.log('Frontend: http://127.0.0.1:4173');
console.log('Backend:  http://127.0.0.1:5050');
console.log('Press Ctrl+C to stop both.\n');

for (const service of services) {
  const child = spawn(npmCommand, service.args, {
    cwd: projectRoot,
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  children.push(child);

  child.stdout.on('data', (chunk) => {
    const lines = chunk.toString().split(/\r?\n/);
    for (const line of lines) {
      printLine(service, line);
    }
  });

  child.stderr.on('data', (chunk) => {
    const lines = chunk.toString().split(/\r?\n/);
    for (const line of lines) {
      printLine(service, line);
    }
  });

  child.on('exit', (code, signal) => {
    if (shuttingDown) {
      return;
    }

    if (signal) {
      console.log(`${service.name} stopped with signal ${signal}`);
    } else if (code !== 0) {
      console.error(`${service.name} exited with code ${code}`);
    } else {
      console.log(`${service.name} stopped`);
    }

    terminateAll();
    process.exit(code || 0);
  });
}

process.on('SIGINT', () => {
  terminateAll('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  terminateAll('SIGTERM');
  process.exit(0);
});
