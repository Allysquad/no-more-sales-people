import net from 'node:net';
import { spawnSync } from 'node:child_process';

const databaseUrl = process.env.DATABASE_URL ?? 'postgresql://app:app_password@localhost:5432/no_more_sales_people?schema=public';
const parsedUrl = new URL(databaseUrl);
const host = parsedUrl.hostname;
const port = Number(parsedUrl.port || 5432);

const isDatabaseReachable = await new Promise((resolve) => {
  const socket = net.createConnection({ host, port });
  const finish = (reachable) => {
    socket.destroy();
    resolve(reachable);
  };

  socket.setTimeout(1500);
  socket.once('connect', () => finish(true));
  socket.once('error', () => finish(false));
  socket.once('timeout', () => finish(false));
});

if (isDatabaseReachable) {
  console.log(`Test database is reachable at ${host}:${port}.`);
  process.exit(0);
}

const dockerCheck = spawnSync('docker', ['info'], { stdio: 'ignore', windowsHide: true });

if (dockerCheck.error || dockerCheck.status !== 0) {
  console.error('Test preflight failed: Docker is not running, so PostgreSQL is unavailable. Start Docker Desktop and run the tests again.');
} else {
  console.error(`Test preflight failed: PostgreSQL is unavailable at ${host}:${port}. Check the postgres container with "docker compose ps".`);
}

process.exit(1);