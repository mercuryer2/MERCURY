# Repository Inspector

A lightweight TypeScript tool for inspecting Git repository changes, running optional validation commands, and generating reports in Markdown or JSON. Designed for both developers and AI agents via CLI and MCP.

---

## Table of Contents

* [About](#about)
* [Key Features](#key-features)
* [Installation](#installation)
* [CLI Usage](#cli-usage)

  * [Options](#options)
  * [Examples](#examples)
* [MCP Server](#mcp-server)
* [Security Considerations](#security-considerations)
* [Development](#development)

  * [Type Checking](#type-checking)
  * [Build](#build)
  * [Test](#test)
* [File Structure](#file-structure)
* [License](#license)

---

## About

This tool was built to provide a simple yet robust way to inspect the state of a Git repository. It reads the working directory changes, optionally runs a validation command (e.g., test suite, linter), and outputs a structured report. The report includes a list of changed files, the validation result, and execution metadata.

The tool supports two primary interfaces:

* **CLI** – for direct use by developers in their terminal or CI pipelines.
* **MCP (Model Context Protocol)** – for AI coding agents that need to inspect repositories programmatically.

Both interfaces share the same core logic, ensuring consistent behavior and output.

---

## Key Features

* Scan Git working directory for changes (modified, added, deleted, untracked, renamed, copied, etc.)
* Execute custom validation commands with configurable timeout
* Generate human-readable Markdown reports or machine-readable JSON output
* Dry-run mode to preview validation commands without execution
* Configurable output file path
* Available both as a CLI tool and as an MCP server
* Written in TypeScript with strict type safety

---

## Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd repository-inspector
npm install
```

---

## CLI Usage

Run a review with default settings:

```bash
npm run inspector -- review --repo ./path/to/repo
```

This generates `review-report.md` in the current directory.

### Options

| Option                      | Description                                         | Default                        |
| --------------------------- | --------------------------------------------------- | ------------------------------ |
| `--repo <path>`             | Path to the Git repository (required)               | –                              |
| `--validate <command>`      | Command to run for validation (e.g., `"npm test"`)  | none                           |
| `--timeout <ms>`            | Timeout in milliseconds for the validation command  | `30000`                        |
| `--dry-run`                 | Preview the validation command without executing it | `false`                        |
| `--format <markdown\|json>` | Output format                                       | `markdown`                     |
| `--output <file>`           | Custom output file path                             | auto-generated based on format |

### Examples

Generate a Markdown report without validation:

```bash
npm run inspector -- review --repo . --format markdown
```

Run a validation command and produce JSON:

```bash
npm run inspector -- review --repo . --validate "npm run typecheck" --format json --output report.json
```

Dry-run a validation command:

```bash
npm run inspector -- review --repo . --validate "npm test" --dry-run
```

Specify a custom timeout (10 seconds):

```bash
npm run inspector -- review --repo . --validate "npm test" --timeout 10000
```

---

## MCP Server

Start the MCP stdio server:

```bash
npm run mcp-server
```

The server exposes a single tool named `review_repository` with the following input schema:

```json
{
  "repoPath": "string (required)",
  "validateCommand": "string (optional)",
  "timeout": "number (optional, default 30000)",
  "dryRun": "boolean (optional, default false)"
}
```

The tool returns a JSON object with the same structure as the CLI's JSON output, making it suitable for AI agents.

Example client request (pseudo-code):

```json
{
  "tool": "review_repository",
  "arguments": {
    "repoPath": "/path/to/repo",
    "validateCommand": "npm test",
    "timeout": 15000
  }
}
```

---

## Security Considerations

* Validation commands are executed **directly** in the repository context with the same privileges as the user running the tool.
* **Avoid** using untrusted or user-supplied commands unless they have been properly sanitized.
* Always use `--dry-run` to preview the command before real execution, especially when testing unfamiliar commands.
* The tool never modifies the repository; it only reads Git status and runs the specified command. However, the validation command itself may modify files or have side effects, so exercise caution.
* For production use, consider restricting the allowed validation commands via a whitelist (not implemented in this version).

---

## Development

### Type Checking

```bash
npm run typecheck
```

### Build

```bash
npm run build
```

This compiles TypeScript source to the `dist/` directory.

### Test

```bash
npm test
```

Tests are written using Vitest. Add your own tests under `test/` to cover new functionality or edge cases.

---

## File Structure

```text
src/
  cli.ts          – CLI adapter (Commander)
  core.ts         – shared orchestration logic
  git.ts          – Git inspection (status, HEAD commit)
  mcp-server.ts   – MCP server adapter
  report.ts       – Markdown report generation
  validation.ts   – validation command execution with timeout
  types.ts        – unified type exports (optional)

test/             – unit and integration tests (to be added)

.gitignore
README.md
SECURITY.md
SUBMISSION.md
package-lock.json
package.json
tsconfig.json
```

---

## License

This project is provided as a template for assessment purposes. Use at your own risk. No warranty is implied.
