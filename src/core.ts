import { GitChange } from './git.js';
import { ValidationResult } from './validation.js';

function escapeMarkdown(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/`/g, '\\`')
    .replace(/\r?\n/g, ' ');
}

function fencedBlock(value: string): string {
  const longestFence = Math.max(2, ...Array.from(value.matchAll(/`+/g), (m) => m[0].length));
  const fence = '`'.repeat(longestFence + 1);
  return `${fence}\n${value}\n${fence}`;
}

export function generateMarkdownReport(
  repoPath: string,
  changes: GitChange[],
  headCommit: string | null,
  validation?: ValidationResult,
): string {
  const lines: string[] = [];
  lines.push('# Repository Inspection Report\n');
  lines.push(`**Path:** \`${escapeMarkdown(repoPath)}\``);
  lines.push(`**Head Commit:** ${headCommit ? `\`${escapeMarkdown(headCommit)}\`` : '(no commits)'}\n`);

  lines.push('## Changes');
  if (changes.length === 0) {
    lines.push('No changes detected.');
  } else {
    const table = ['| Status | Path |', '|--------|------|'];
    const statusMap: Record<string, string> = {
      M: 'Modified',
      A: 'Added',
      D: 'Deleted',
      R: 'Renamed',
      C: 'Copied',
      U: 'Updated but unmerged',
      '?': 'Untracked',
    };

    for (const change of changes) {
      const path = change.oldPath
        ? `${change.oldPath} -> ${change.path}`
        : change.path;
      table.push(`| ${statusMap[change.status] || change.status} | \`${escapeMarkdown(path)}\` |`);
    }
    lines.push(table.join('\n'));
  }

  if (validation) {
    lines.push('\n## Validation');
    lines.push(`**Command:** \`${escapeMarkdown(validation.command || 'unknown')}\``);
    lines.push(`**Success:** ${validation.success ? '✅' : '❌'}`);
    lines.push(`**Duration:** ${validation.duration}ms`);
    if (validation.timedOut) lines.push('**Timed Out:** yes');
    if (validation.outputTruncated) lines.push('**Output:** truncated at 1 MB');
    if (validation.stdout) lines.push(`\n### stdout\n${fencedBlock(validation.stdout)}`);
    if (validation.stderr) lines.push(`\n### stderr\n${fencedBlock(validation.stderr)}`);
    if (!validation.success && !validation.timedOut) {
      lines.push(`**Exit Code:** ${validation.exitCode ?? 'unknown'}`);
    }
  }

  lines.push(`\n---\n*Generated at ${new Date().toISOString()}*`);
  return lines.join('\n');
}
