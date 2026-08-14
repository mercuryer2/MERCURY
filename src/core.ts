import { getGitChanges, getHeadCommit } from './git.js';
import { runValidation, ValidationResult } from './validation.js';
import { generateMarkdownReport } from './report.js';

export interface ReviewOptions {
  repoPath: string;
  validateCommand?: string;
  timeout?: number;
  dryRun?: boolean;
  format?: 'markdown' | 'json';
}

export interface ReviewResult {
  repoPath: string;
  headCommit: string | null;
  changes: { status: string; path: string; oldPath?: string }[];
  validation?: ValidationResult;
  dryRun?: boolean;
  markdown?: string;
}

export async function reviewRepository(options: ReviewOptions): Promise<ReviewResult> {
  const {
    repoPath,
    validateCommand,
    timeout = 30_000,
    dryRun = false,
    format = 'markdown',
  } = options;

  if (!repoPath.trim()) throw new Error('repoPath must not be empty');
  if (!Number.isInteger(timeout) || timeout <= 0) throw new Error('timeout must be a positive integer');
  if (format !== 'markdown' && format !== 'json') throw new Error('format must be markdown or json');
  if (dryRun && !validateCommand) throw new Error('dryRun requires validateCommand');

  const changes = await getGitChanges(repoPath);
  const headCommit = await getHeadCommit(repoPath);
  let validation: ValidationResult | undefined;

  if (validateCommand) {
    if (dryRun) {
      validation = {
        command: validateCommand,
        success: false,
        stdout: '(dry run)',
        stderr: '',
        exitCode: null,
        timedOut: false,
        duration: 0,
      };
    } else {
      validation = {
        ...(await runValidation(validateCommand, repoPath, timeout)),
        command: validateCommand,
      };
    }
  }

  const result: ReviewResult = {
    repoPath,
    headCommit,
    changes: changes.map(({ status, path, oldPath }) => ({
      status,
      path,
      ...(oldPath ? { oldPath } : {}),
    })),
    validation,
    dryRun: dryRun || undefined,
  };

  if (format === 'markdown') {
    result.markdown = generateMarkdownReport(repoPath, changes, headCommit, validation);
  }

  return result;
}
