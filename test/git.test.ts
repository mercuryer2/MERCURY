import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getGitChanges, getHeadCommit } from '../src/git.js';
import { createTempGitRepo, commitFile, createUntrackedFile } from './setup.js';

describe('git.ts', () => {
  let repoPath: string;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    const result = await createTempGitRepo();
    repoPath = result.repoPath;
    cleanup = result.cleanup;
  });

  afterEach(async () => {
    await cleanup();
  });

  it('should return empty array for clean repo', async () => {
    const changes = await getGitChanges(repoPath);
    expect(changes).toEqual([]);
  });

  it('should detect untracked files', async () => {
    await createUntrackedFile(repoPath, 'new.txt', 'hello');
    const changes = await getGitChanges(repoPath);
    expect(changes).toContainEqual({ status: '?', path: 'new.txt' });
  });

  it('should detect modified files', async () => {
    await commitFile(repoPath, 'file.txt', 'v1', 'initial');
    await createUntrackedFile(repoPath, 'file.txt', 'v2');
    const changes = await getGitChanges(repoPath);
    expect(changes).toContainEqual({ status: 'M', path: 'file.txt' });
  });

  it('should detect added (staged) files', async () => {
    await createUntrackedFile(repoPath, 'add.txt', 'content');
    const { execFile } = await import('child_process');
    const { promisify } = await import('util');
    const execFileAsync = promisify(execFile);
    await execFileAsync('git', ['add', 'add.txt'], { cwd: repoPath });
    const changes = await getGitChanges(repoPath);
    expect(changes).toContainEqual({ status: 'A', path: 'add.txt' });
  });

  it('should detect deleted files', async () => {
    await commitFile(repoPath, 'delete.txt', 'delete me', 'add delete');
    const { execFile } = await import('child_process');
    const { promisify } = await import('util');
    const execFileAsync = promisify(execFile);
    await execFileAsync('git', ['rm', 'delete.txt'], { cwd: repoPath });
    const changes = await getGitChanges(repoPath);
    expect(changes).toContainEqual({ status: 'D', path: 'delete.txt' });
  });

  it('should return head commit hash', async () => {
    await commitFile(repoPath, 'a.txt', 'a', 'commit a');
    const head = await getHeadCommit(repoPath);
    expect(head).toMatch(/^[a-f0-9]{40}$/);
  });

  it('should return null for empty repo', async () => {
    const head = await getHeadCommit(repoPath);
    expect(head).toBeNull();
  });
});
