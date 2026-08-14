import { spawn } from 'child_process';

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_OUTPUT_BYTES = 1_000_000;
const KILL_GRACE_MS = 500;

export function splitCommand(command: string): string[] {
  const parts: string[] = [];
  let current = '';
  let quote: '"' | "'" | null = null;
  let escaping = false;

  for (const char of command.trim()) {
    if (escaping) {
      current += char;
      escaping = false;
      continue;
    }

    if (char === '\\' && quote !== "'") {
      escaping = true;
      continue;
    }

    if (quote) {
      if (char === quote) quote = null;
      else current += char;
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (/\s/.test(char)) {
      if (current) {
        parts.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (escaping) current += '\\';
  if (quote) throw new Error('Validation command contains an unmatched quote.');
  if (current) parts.push(current);
  if (parts.length === 0) throw new Error('Validation command must not be empty.');

  return parts;
}

export interface ValidationResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
  duration: number;
  outputTruncated?: boolean;
  command?: string;
}

function appendOutput(current: string, chunk: string): { value: string; truncated: boolean } {
  const remaining = MAX_OUTPUT_BYTES - Buffer.byteLength(current, 'utf8');
  if (remaining <= 0) return { value: current, truncated: true };

  const bytes = Buffer.from(chunk, 'utf8');
  if (bytes.length <= remaining) return { value: current + chunk, truncated: false };

  return {
    value: current + bytes.subarray(0, remaining).toString('utf8'),
    truncated: true,
  };
}

export function runValidation(
  command: string,
  repoPath: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<ValidationResult> {
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
    return Promise.reject(new Error('Validation timeout must be a positive integer.'));
  }

  const [cmd, ...args] = splitCommand(command);

  return new Promise((resolve) => {
    const startTime = Date.now();
    let timedOut = false;
    let settled = false;
    let stdout = '';
    let stderr = '';
    let outputTruncated = false;

    const proc = spawn(cmd, args, {
      cwd: repoPath,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let timer: NodeJS.Timeout;
    let killTimer: NodeJS.Timeout | undefined;

    const finish = (exitCode: number | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (killTimer) clearTimeout(killTimer);

      resolve({
        success: exitCode === 0 && !timedOut,
        stdout,
        stderr,
        exitCode,
        timedOut,
        duration: Date.now() - startTime,
        outputTruncated: outputTruncated || undefined,
      });
    };

    proc.stdout.on('data', (data: Buffer | string) => {
      const result = appendOutput(stdout, data.toString());
      stdout = result.value;
      outputTruncated ||= result.truncated;
    });

    proc.stderr.on('data', (data: Buffer | string) => {
      const result = appendOutput(stderr, data.toString());
      stderr = result.value;
      outputTruncated ||= result.truncated;
    });

    proc.once('error', (error: Error) => {
      stderr = `${stderr}${error.message}`;
      finish(null);
    });

    proc.once('close', (code) => finish(code));

    timer = setTimeout(() => {
      timedOut = true;
      proc.kill('SIGTERM');
      killTimer = setTimeout(() => {
        if (!settled) proc.kill('SIGKILL');
      }, KILL_GRACE_MS);
    }, timeoutMs);
  });
}
