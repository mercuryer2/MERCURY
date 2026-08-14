import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface GitChange {
  status: 'M' | 'A' | 'D' | 'R' | 'C' | 'U' | '?';
  path: string;
  oldPath?: string;
}

function parseStatus(statusText: string): GitChange['status'] {
  const [indexStatus, worktreeStatus] = statusText;

  if (indexStatus === '?' && worktreeStatus === '?') return '?';
  if (indexStatus === 'U' || worktreeStatus === 'U') return 'U';

  const code = indexStatus !== ' ' ? indexStatus : worktreeStatus;
  return code === 'M' || code === 'A' || code === 'D' || code === 'R' || code === 'C'
    ? code
    : '?';
}

export function parsePorcelainZ(output: string): GitChange[] {
  const fields = output.split('\0');
  const changes: GitChange[] = [];

  for (let i = 0; i < fields.length; i += 1) {
    const field = fields[i];
    if (!field || field.length < 4) continue;

    const status = parseStatus(field.slice(0, 2));
    const path = field.slice(3);

    if ((status === 'R' || status === 'C') && fields[i + 1]) {
      changes.push({ status, path, oldPath: fields[i + 1] });
      i += 1;
    } else {
      changes.push({ status, path });
    }
  }

  return changes;
}

export async function getGitChanges(repoPath: string): Promise<GitChange[]> {
  try {
    const { stdout } = await execFileAsync('git', ['status', '--porcelain=v1', '-z'], {
      cwd: repoPath,
      encoding: 'utf8',
      maxBuffer: 4 * 1024 * 1024,
    });
    return parsePorcelainZ(stdout);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Git status failed: ${message}`);
  }
}

export async function getHeadCommit(repoPath: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], {
      cwd: repoPath,
      encoding: 'utf8',
    });
    return stdout.trim() || null;
  } catch (error: unknown) {
    const code = typeof error === 'object' && error !== null && 'code' in error
      ? (error as { code?: string | number }).code
      : undefined;

    if (code === 128) {
      throw new Error('Git HEAD lookup failed: repository has no valid HEAD');
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Git HEAD lookup failed: ${message}`);
  }
}
