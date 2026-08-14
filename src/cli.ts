#!/usr/bin/env node
import { Command } from 'commander';
import { reviewRepository } from './core';
import fs from 'fs';

const program = new Command();
program
  .name('inspector')
  .description('Review a Git repository and generate a report')
  .command('review')
  .requiredOption('--repo <path>', 'Path to the Git repository')
  .option('--validate <command>', 'Validation command to run')
  .option('--timeout <ms>', 'Timeout for validation in ms', '30000')
  .option('--dry-run', 'Preview validation command without executing')
  .option('--format <type>', 'Output format (markdown or json)', 'markdown')
  .option('--output <file>', 'Write report to file (default: review-report.md)')
  .action(async (cmd) => {
    try {
      const result = await reviewRepository({
        repoPath: cmd.repo,
        validateCommand: cmd.validate,
        timeout: parseInt(cmd.timeout, 10),
        dryRun: cmd.dryRun || false,
        format: cmd.format,
      });

      let output: string;
      if (cmd.format === 'json') {
        output = JSON.stringify(result, null, 2);
      } else {
        output = result.markdown || '';
      }

      const outFile = cmd.output || (cmd.format === 'json' ? 'review-report.json' : 'review-report.md');
      fs.writeFileSync(outFile, output, 'utf8');
      console.log(`Report written to ${outFile}`);
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program.parse();
