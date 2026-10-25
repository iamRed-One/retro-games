/**
 * Publishes dist/ to the gh-pages branch, which GitHub Pages serves at
 * https://iamred-one.github.io/retro-games/. Run with `npm run deploy` (it builds first).
 */
import { execSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'inherit' });
const remote = execSync('git remote get-url origin').toString().trim();
const commit = execSync('git rev-parse --short HEAD').toString().trim();

const dir = mkdtempSync(join(tmpdir(), 'rar-deploy-'));
try {
  cpSync('dist', dir, { recursive: true });
  // Without this, Pages runs Jekyll and drops files that start with an underscore.
  writeFileSync(join(dir, '.nojekyll'), '');
  run('git init -q -b gh-pages', dir);
  run('git add -A', dir);
  run(`git commit -q -m "Deploy ${commit}"`, dir);
  run(`git push -f ${remote} gh-pages`, dir);
  console.log('\nDeployed. Live in about a minute at https://iamred-one.github.io/retro-games/');
} finally {
  rmSync(dir, { recursive: true, force: true });
}
