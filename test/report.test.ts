import { describe, it, expect } from 'vitest';
import { generateMarkdownReport } from '../src/report.js';
import type { GitChange } from '../src/git.js';
import type { ValidationResult } from '../src/validation.js';

describe('report.ts', () => {
  const changes: GitChange[] = [
    { status: 'M', path: 'src/core.ts' },
    { status: 'A', path: 'src/new.ts' },
    { status: '?', path: 'untracked.txt' },
  ];

  it('should generate report with changes', () => {
    const markdown = generateMarkdownReport('/test/repo', changes, 'abc123def', undefined);
    expect(markdown).toContain('# Repository Inspection Report');
    expect(markdown).toContain('**Path:** `/test/repo`');
    expect(markdown).toContain('**Head Commit:** abc123def');
    expect(markdown).toContain('| Modified | `src/core.ts` |');
    expect(markdown).toContain('| Added | `src/new.ts` |');
    expect(markdown).toContain('| Untracked | `untracked.txt` |');
  });

  it('should handle no changes', () => {
    const markdown = generateMarkdownReport('/test/repo', [], null, undefined);
    expect(markdown).toContain('No changes detected.');
  });

  it('should include validation results', () => {
    const validation: ValidationResult = {
      success: true,
      stdout: 'All tests passed',
      stderr: '',
      exitCode: 0,
      timedOut: false,
      duration: 123,
      command: 'npm test',
    };
    const markdown = generateMarkdownReport('/test/repo', [], 'abc', validation);
    expect(markdown).toContain('## Validation');
    expect(markdown).toContain('**Command:** `npm test`');
    expect(markdown).toContain('**Success:** ✅');
    expect(markdown).toContain('**Duration:** 123ms');
    expect(markdown).toContain('All tests passed');
  });

  it('should show failure details', () => {
    const validation: ValidationResult = {
      success: false,
      stdout: '',
      stderr: 'Error: something went wrong',
      exitCode: 1,
      timedOut: false,
      duration: 45,
      command: 'bad-command',
    };
    const markdown = generateMarkdownReport('/test/repo', [], 'abc', validation);
    expect(markdown).toContain('**Success:** ❌');
    expect(markdown).toContain('Error: something went wrong');
    expect(markdown).toContain('**Exit Code:** 1');
  });

  it('should show timeout', () => {
    const validation: ValidationResult = {
      success: false,
      stdout: '',
      stderr: '',
      exitCode: null,
      timedOut: true,
      duration: 5000,
      command: 'sleep 10',
    };
    const markdown = generateMarkdownReport('/test/repo', [], 'abc', validation);
    expect(markdown).toContain('**Timed Out:** yes');
  });
});
