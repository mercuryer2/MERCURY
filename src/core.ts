import { getGitChanges, getHeadCommit } from './git';
import { runValidation, ValidationResult } from './validation';
import { generateMarkdownReport } from './report';

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
  changes: { status: string; path: string }[];
  validation?: ValidationResult & { command?: string };
  dryRun?: boolean;
  markdown?: string;
}

export async function reviewRepository(options: ReviewOptions): Promise<ReviewResult> {
  const { repoPath, validateCommand, timeout = 30000, dryRun = false, format = 'markdown' } = options;

  const changes = await getGitChanges(repoPath);
  const headCommit = await getHeadCommit(repoPath);

  let validation: (ValidationResult & { command?: string }) | undefined;
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
      const result = await runValidation(validateCommand, repoPath, timeout);
      validation = { ...result, command: validateCommand };
    }
  }

  const result: ReviewResult = {
    repoPath,
    headCommit,
    changes: changes.map(c => ({ status: c.status, path: c.path })),
    validation,
    dryRun: dryRun || undefined,
  };

  if (format === 'markdown') {
    result.markdown = generateMarkdownReport(repoPath, changes, headCommit, validation);
  }

  return result;
}
