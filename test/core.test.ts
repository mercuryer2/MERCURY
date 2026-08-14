import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { reviewRepository } from '../src/core.js';
import { createTempGitRepo, commitFile, createUntrackedFile } from './setup.js';

describe('core.ts (integration)', () => {
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

  it('should review a clean repo', async () => {
    const result = await reviewRepository({ repoPath, format: 'markdown' });
    expect(result.changes).toEqual([]);
    expect(result.headCommit).toBeNull();
    expect(result.markdown).toContain('No changes detected.');
  });

  it('should detect untracked files', async () => {
    await createUntrackedFile(repoPath, 'new.txt', 'hello');
    const result = await reviewRepository({ repoPath });
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0]).toMatchObject({ status: '?', path: 'new.txt' });
  });

  it('should run validation command successfully', async () => {
    await commitFile(repoPath, 'file.txt', 'content', 'initial');
    const result = await reviewRepository({
      repoPath,
      validateCommand: 'echo "ok"',
      format: 'markdown',
    });
    expect(result.validation).toBeDefined();
    expect(result.validation!.success).toBe(true);
    expect(result.validation!.stdout).toContain('ok');
    expect(result.markdown).toContain('**Success:** ✅');
  });

  it('should handle validation failure', async () => {
    const result = await reviewRepository({
      repoPath,
      validateCommand: 'false',
    });
    expect(result.validation!.success).toBe(false);
  });

  it('should respect dry-run and not execute', async () => {
    const result = await reviewRepository({
      repoPath,
      validateCommand: 'echo "should not run"',
      dryRun: true,
    });
    expect(result.validation).toBeDefined();
    expect(result.validation!.stdout).toContain('(dry run)');
    expect(result.validation!.success).toBe(false);
  });

  it('should timeout if validation takes too long', async () => {
    const result = await reviewRepository({
      repoPath,
      validateCommand: 'sleep 5',
      timeout: 500,
    });
    expect(result.validation!.timedOut).toBe(true);
    expect(result.validation!.success).toBe(false);
  });

  it('should generate JSON output', async () => {
    const result = await reviewRepository({
      repoPath,
      validateCommand: 'echo "json"',
      format: 'json',
    });
    expect(result.markdown).toBeUndefined();
    expect(result).toHaveProperty('repoPath');
    expect(result).toHaveProperty('validation');
  });
});
