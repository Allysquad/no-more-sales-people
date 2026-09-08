import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const guidePath = path.join(root, 'docs', 'DEMO_GUIDE.md');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

const surfaces = [
  ['Visitor flow', 'src/app/page.tsx', 'Open http://localhost:3000'],
  ['Lead API', 'src/app/api/leads/route.ts', 'POST http://localhost:3000/api/leads'],
  ['Database schema', 'prisma/schema.prisma', 'npm run db:deploy'],
  ['Database migrations', 'prisma/migrations/', 'npx prisma migrate status'],
  ['Database diagram', 'docs/DATABASE_SCHEMA.md', 'Open the Markdown preview'],
  ['Demo runbook', 'docs/DEMO_GUIDE.md', 'Follow this document'],
  ['CI workflow', '.github/workflows/ci.yml', 'Review the Actions run'],
];

const scriptRows = Object.entries(packageJson.scripts)
  .map(([name, command]) => `| \`npm run ${name}\` | \`${command}\` |`)
  .join('\n');

const surfaceRows = surfaces
  .filter(([, relativePath]) => fs.existsSync(path.join(root, relativePath)) || relativePath.endsWith('/'))
  .map(([area, relativePath, check]) => `| ${area} | \`${relativePath}\` | ${check} |`)
  .join('\n');

const generatedBlock = [
  '<!-- BEGIN GENERATED PROJECT INVENTORY -->',
  '### Repository surfaces',
  '',
  '| Area | Entry point | Quick check |',
  '| --- | --- | --- |',
  surfaceRows,
  '',
  '### Package scripts',
  '',
  '| Script | Command |',
  '| --- | --- |',
  scriptRows,
  '<!-- END GENERATED PROJECT INVENTORY -->',
].join('\n');

const source = fs.readFileSync(guidePath, 'utf8');
const blockPattern = /<!-- BEGIN GENERATED PROJECT INVENTORY -->[\s\S]*?<!-- END GENERATED PROJECT INVENTORY -->/;

if (!blockPattern.test(source)) {
  throw new Error(`Generated inventory markers are missing from ${guidePath}`);
}

const updated = source.replace(blockPattern, generatedBlock);

if (process.argv.includes('--check')) {
  if (updated !== source) {
    console.error('Demo guide inventory is stale. Run: node scripts/update-demo-guide.mjs');
    process.exit(1);
  }

  console.log('Demo guide inventory is up to date.');
} else {
  fs.writeFileSync(guidePath, updated, 'utf8');
  console.log(`Updated ${path.relative(root, guidePath)}.`);
}
