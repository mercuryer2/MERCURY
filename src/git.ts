import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface GitChange {
  status: 'M' | 'A' | 'D' | 'R' | 'C' | 'U' | '?';
  path: string;
}

export async function getGitChanges(repoPath: string): Promise<GitChange[]> {
  try {
    const { stdout } = await execFileAsync('git', ['status', '--porcelain'], {
      cwd: repoPath,
    });
    if (!stdout) return [];
    return stdout
      .trim()
      .split('\n')
      .map((line) => {
        const status = line.slice(0, 2).trim() as GitChange['status'];
        const path = line.slice(3).trim();
        return { status, path };
      });
  } catch (error: any) {
    throw new Error(`Git status failed: ${error.message}`);
  }
}

export async function getHeadCommit(repoPath: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], {
      cwd: repoPath,
    });
    return stdout.trim() || null;
  } catch {
    return null;
  }
}
