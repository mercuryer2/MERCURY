import { spawn } from 'child_process';

// 简单的引号感知命令分割
function splitCommand(cmd: string): string[] {
  const parts: string[] = [];
  let current = '';
  let inQuote = false;
  for (const char of cmd) {
    if (char === '"') {
      inQuote = !inQuote;
      continue;
    }
    if (char === ' ' && !inQuote) {
      if (current) {
        parts.push(current);
        current = '';
      }
      continue;
    }
    current += char;
  }
  if (current) parts.push(current);
  return parts;
}

export interface ValidationResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
  duration: number; // ms
  command?: string; // 方便报告显示
}

export function runValidation(
  command: string,
  repoPath: string,
  timeoutMs: number = 30000
): Promise<ValidationResult> {
  return new Promise((resolve) => {
    const [cmd, ...args] = splitCommand(command);
    const startTime = Date.now();
    let timedOut = false;
    let stdout = '';
    let stderr = '';

    const proc = spawn(cmd, args, {
      cwd: repoPath,
      shell: false, // 防止注入
    });

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill('SIGTERM');
    }, timeoutMs);

    proc.on('close', (code) => {
      clearTimeout(timer);
      const duration = Date.now() - startTime;
      resolve({
        success: code === 0 && !timedOut,
        stdout,
        stderr,
        exitCode: code,
        timedOut,
        duration,
      });
    });
  });
}
