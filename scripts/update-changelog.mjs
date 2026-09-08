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
const recentActivity = entries.length ? entries.join('\n') : '- No recent updates yet.';

const newContent = [
  '# Changelog',
  '',
  '## Latest project summary',
  '',
  'This update continues to strengthen the lead qualification prototype for a home improvement and windows/doors sales funnel.',
  '',
  '### Delivered',
  '- Multi-step homeowner qualification flow with clear progress tracking.',
  '- Recommendation logic that routes prospects into a suitable product offering.',
  '- Lead capture form for name, email, phone, postcode, and project notes.',
  '- Business-facing summary so sales teams can review the opportunity quickly.',
  '- GitHub repository setup and automation for tracking project updates.',
  '',
  '### Recent activity',
  recentActivity,
  '',
  '### Next milestone',
  '- Connect the enquiry form to a real backend, CRM, or email workflow.',
  '- Review the flow with business stakeholders and refine messaging for conversion.',
  '- Prepare production deployment and lead routing for live traffic.',
  '',
  `### Last updated: ${isoDate}`,
  '',
].join('\n');

fs.writeFileSync(changelogPath, newContent, 'utf8');
console.log(`Updated CHANGELOG.md with ${entries.length} recent activity entries.`);
