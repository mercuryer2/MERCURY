import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execFileAsync = promisify(execFile);

export async function createTempGitRepo(): Promise<{
  repoPath: string;
  cleanup: () => Promise<void>;
}> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'repo-inspector-test-'));
  const repoPath = path.join(tmpDir, 'repo');
  await fs.mkdir(repoPath, { recursive: true });

  await execFileAsync('git', ['init'], { cwd: repoPath });
  await execFileAsync('git', ['config', 'user.name', 'Test User'], { cwd: repoPath });
  await execFileAsync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoPath });

  const cleanup = async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  };

  return { repoPath, cleanup };
}

export async function commitFile(repoPath: string, filePath: string, content: string, message: string): Promise<void> {
  const fullPath = path.join(repoPath, filePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, content, 'utf8');
  await execFileAsync('git', ['add', filePath], { cwd: repoPath });
  await execFileAsync('git', ['commit', '-m', message], { cwd: repoPath });
}

export async function createUntrackedFile(repoPath: string, filePath: string, content: string): Promise<void> {
  const fullPath = path.join(repoPath, filePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, content, 'utf8');
}
