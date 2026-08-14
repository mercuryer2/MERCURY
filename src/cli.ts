#!/usr/bin/env node
import { Command } from 'commander';
import { reviewRepository } from './core.js';
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
  .option('--output <file>', 'Write report to file')
  .action(async (cmd) => {
    try {
      const timeout = parseInt(cmd.timeout, 10);
      if (isNaN(timeout) || timeout <= 0) {
        console.error('Error: --timeout must be a positive integer');
        process.exit(1);
      }

      const result = await reviewRepository({
        repoPath: cmd.repo,
        validateCommand: cmd.validate,
        timeout,
        dryRun: !!cmd.dryRun,
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
    } catch (error: any) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program.parse();
