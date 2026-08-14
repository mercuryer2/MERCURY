import { spawn } from 'child_process';

export interface ValidationResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
  duration: number; // ms
}

export function runValidation(
  command: string,
  repoPath: string,
  timeoutMs: number = 30000
): Promise<ValidationResult> {
  return new Promise((resolve) => {
    const [cmd, ...args] = command.split(/\s+/);
    const startTime = Date.now();
    let timedOut = false;
    let stdout = '';
    let stderr = '';

    const proc = spawn(cmd, args, {
      cwd: repoPath,
      shell: false, // 避免命令注入
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
