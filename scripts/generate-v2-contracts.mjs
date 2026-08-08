import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, rm, writeFile } from 'node:fs/promises';

const exec = promisify(execFile);
const spec = 'contracts/auvra-v2.openapi.json';
const checksum = 'contracts/auvra-v2.openapi.sha256';
const target = 'src/core/api/v2.generated.ts';
const temporary = `${target}.tmp`;
const actual = createHash('sha256').update(await readFile(spec)).digest('hex');
const expected = (await readFile(checksum, 'utf8')).trim().split(/\s+/)[0];
if (actual !== expected) throw new Error('OpenAPI snapshot checksum mismatch. Restore the checked-in contract.');

await exec('./node_modules/.bin/openapi-typescript', [spec, '--output', temporary]);
const output = await readFile(temporary, 'utf8');
await rm(temporary);
if (process.argv.includes('--check')) {
  const current = await readFile(target, 'utf8').catch(() => '');
  if (current !== output) throw new Error(`${target} is stale; run npm run contract:generate.`);
  console.log('v2 OpenAPI snapshot and generated TypeScript are current.');
} else {
  await writeFile(target, output);
  console.log(`Generated ${target}.`);
}
