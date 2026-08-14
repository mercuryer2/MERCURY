import { GitChange } from './git';
import { ValidationResult } from './validation';

export function generateMarkdownReport(
  repoPath: string,
  changes: GitChange[],
  headCommit: string | null,
  validation?: ValidationResult
): string {
  const lines: string[] = [];
  lines.push('# Repository Inspection Report\n');
  lines.push(`**Path:** \`${repoPath}\``);
  lines.push(`**Head Commit:** ${headCommit || '(no commits)'}\n`);

  lines.push('## Changes');
  if (changes.length === 0) {
    lines.push('No changes detected.');
  } else {
    const table = ['| Status | Path |', '|--------|------|'];
    for (const ch of changes) {
      const statusMap = {
        M: 'Modified',
        A: 'Added',
        D: 'Deleted',
        R: 'Renamed',
        C: 'Copied',
        U: 'Updated but unmerged',
        '?': 'Untracked',
      };
      table.push(`| ${statusMap[ch.status] || ch.status} | \`${ch.path}\` |`);
    }
    lines.push(table.join('\n'));
  }

  if (validation) {
    lines.push('\n## Validation');
    lines.push(`**Command:** \`${validation.command}\``);
    lines.push(`**Success:** ${validation.success ? '✅' : '❌'}`);
    lines.push(`**Duration:** ${validation.duration}ms`);
    if (validation.timedOut) lines.push('**Timed Out:** yes');
    if (validation.stdout) lines.push(`\n### stdout\n\`\`\`\n${validation.stdout}\n\`\`\``);
    if (validation.stderr) lines.push(`\n### stderr\n\`\`\`\n${validation.stderr}\n\`\`\``);
    if (!validation.success && !validation.timedOut) {
      lines.push(`**Exit Code:** ${validation.exitCode}`);
    }
  }

  lines.push(`\n---\n*Generated at ${new Date().toISOString()}*`);
  return lines.join('\n');
}
