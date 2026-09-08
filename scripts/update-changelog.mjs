import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
const output = execSync(
  "git log --pretty=format:%ad%x09%s%x09%an --date=short -n 20",
  { encoding: 'utf8' }
).trim();

const entries = [];
const seen = new Set();

for (const line of output.split(/\n/)) {
  if (!line.trim()) continue;

  const [date, subject, author] = line.split(/\t/);

  if (!date || !subject) continue;
  if (subject.toLowerCase().includes('update changelog')) continue;

  const cleanSubject = subject.replace(/^[a-z]+:\s*/i, '').trim();
  if (!cleanSubject || seen.has(cleanSubject)) continue;

  seen.add(cleanSubject);
  entries.push(`- ${date}: ${cleanSubject} (${author || 'unknown'})`);
}

const isoDate = new Date().toISOString().slice(0, 10);
const newContent = [
  '# Changelog',
  '',
  'Auto-generated from recent Git commits.',
  '',
  `## ${isoDate}`,
  '',
  entries.length ? entries.join('\n') : '- No new changes yet.',
  '',
].join('\n');

fs.writeFileSync(changelogPath, newContent, 'utf8');
console.log(`Updated CHANGELOG.md with ${entries.length} entries.`);
