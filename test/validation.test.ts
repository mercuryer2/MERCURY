import { describe, it, expect } from 'vitest';
import { runValidation } from '../src/validation.js';
import { createTempGitRepo } from './setup.js';

describe('validation.ts', () => {
  it('should run a simple command successfully', async () => {
    const { repoPath, cleanup } = await createTempGitRepo();
    try {
      const result = await runValidation('echo "hello"', repoPath, 1000);
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('hello');
      expect(result.stderr).toBe('');
      expect(result.timedOut).toBe(false);
      expect(result.exitCode).toBe(0);
    } finally {
      await cleanup();
    }
  });

  it('should fail for a non-existent command', async () => {
    const { repoPath, cleanup } = await createTempGitRepo();
    try {
      const result = await runValidation('nonexistent-command', repoPath, 1000);
      expect(result.success).toBe(false);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('not found');
    } finally {
      await cleanup();
    }
  });

  it('should timeout when command takes too long', async () => {
    const { repoPath, cleanup } = await createTempGitRepo();
    try {
      const result = await runValidation('sleep 5', repoPath, 500);
      expect(result.success).toBe(false);
      expect(result.timedOut).toBe(true);
    } finally {
      await cleanup();
    }
  });

  it('should handle quoted arguments correctly', async () => {
    const { repoPath, cleanup } = await createTempGitRepo();
    try {
      const script = `console.log(process.argv[2])`;
      await import('fs/promises').then(fs => fs.writeFile(`${repoPath}/script.js`, script, 'utf8'));
      const result = await runValidation(`node script.js "hello world"`, repoPath, 1000);
      expect(result.success).toBe(true);
      expect(result.stdout.trim()).toBe('hello world');
    } finally {
      await cleanup();
    }
  });
});
