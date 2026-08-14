# Submission

## What did you investigate first, and why?

I started by reading the existing codebase and running the type checker. The initial commit had a working happy path (a clean repo with no validation), but I wanted to understand the broader contract and edge cases. I focused on:

- The **CLI and MCP interfaces** to see if they shared the same core logic.
- The **type definitions** to spot inconsistencies (`ValidationResult` had no `command` field, but `core.ts` was assigning it).
- The **security model** – how validation commands were executed and whether injection was possible.

My priority was correctness and safety, because these are the most critical aspects for a tool that runs user‑provided commands.

---

## What did you choose to implement or fix?

I fixed the most pressing issues that would cause failures in real use:

- **Git status parsing** – `git status --porcelain` returns two‑character status codes; the original code could not handle `??` (untracked) and mis‑parsed ` M` (modified in index). I made the parser take the first non‑space character.
- **Command argument splitting** – the original `split(/\s+/)` broke quoted arguments like `"test:unit"`. I wrote a quote‑aware splitter.
- **Timeout validation** – added a check so `--timeout` must be a positive integer; otherwise, the tool exits early with a clear error.
- **Type consistency** – ensured `ValidationResult` includes the optional `command` field everywhere, so `core.ts` no longer uses a mismatched type.
- **Added `--dry-run`** to allow users to preview commands without executing them.
- **Updated all documentation** (`README.md`, `SECURITY.md`, this `SUBMISSION.md`) to reflect the actual usage and security practices.

---

## What did you intentionally not do?

I intentionally did not:

- **Add caching** – this would improve performance on large repos but introduces complexity around invalidation. I considered it out of scope for a 90‑minute session.
- **Implement a command whitelist** – while it would improve security, it reduces flexibility and requires a user‑defined configuration. I chose to warn users via documentation instead.
- **Write extensive integration tests** – I added a few manual test scenarios, but full test coverage (mocking Git, spawning subprocesses) would take more time.
- **Add HTML output** – Markdown and JSON are sufficient for the intended use cases; HTML would add little value for now.

These are all reasonable follow‑ups but not essential for a working, safe tool.

---

## Interface decision

- **Decision:** Hybrid (CLI-first, MCP-enabled)
- **Primary user and execution environment:** Developers running the tool locally or in CI pipelines; AI agents (e.g., coding assistants) that need to programmatically inspect repositories.
- **Trust boundary and allowed capabilities:** The tool runs with the same privileges as the user. It reads Git status and executes user‑supplied validation commands. We trust the user to supply safe commands; the tool does not attempt to sandbox them.
- **Reliability, discoverability, latency/context, and output tradeoffs:**  
  - Reliability is improved by timeouts, error handling, and dry‑run mode.  
  - Discoverability is enhanced by `--help` and a clear MCP tool schema.  
  - Latency is controlled by `--timeout`; large outputs can be written to files.  
  - JSON output reduces context size for AI agents.
- **How supported interfaces remain consistent:** Both CLI and MCP call the same `reviewRepository` function in `core.ts`, ensuring identical behavior. Parameter names are aligned, and JSON output from the MCP tool matches the CLI’s JSON format.
- **Evidence that would change this decision:** If user analytics show that AI agents make 10× more calls than humans, I would prioritise MCP optimisations (faster startup, smaller response payload). If security incidents occur, I would add a mandatory whitelist and make the CLI secondary.

---

## How did you use an AI coding agent?

I used an AI coding assistant to:

- Generate initial code snippets for the quote‑aware command splitter.
- Refactor the Git status parser to handle edge cases.
- Produce documentation drafts for `README.md` and `SECURITY.md`.
- Review the type errors and suggest corrections.

The AI accelerated the exploration of alternative implementations and helped me format documentation consistently.

---

## Where did you check, correct, or reject an AI suggestion? (required)

One AI suggestion I **rejected**:

- **Suggestion:** Use `child_process.exec` with `shell: true` to simplify command execution.
  - **Why rejected:** `exec` invokes a shell, opening the door to command injection. The tool accepts user‑provided commands, so I kept `spawn` with `shell: false` and passed arguments as an array. The small added complexity is worth the security benefit.

One AI suggestion I **corrected**:

- **Suggestion:** Use `line[0]` as the status character for Git changes.
  - **Correction:** `git status --porcelain` can have a space in the first position (e.g., ` M` for modified but not staged). I changed the logic to take the first non‑space character, ensuring the correct status is captured for all cases.

---

## Commands used to verify the result, with outcomes

All commands were run in a real Git repository with staged, unstaged, and untracked changes.

| Command | Outcome |
|---------|---------|
| `npm run typecheck` | ✅ No TypeScript errors |
| `npm run build` | ✅ Compiled without warnings |
| `npm run inspector -- review --repo . --format markdown` | ✅ Generated `review-report.md` with correct file list |
| `npm run inspector -- review --repo . --validate "npm run typecheck"` | ✅ Ran validation, included output in report |
| `npm run inspector -- review --repo . --validate "invalid-command"` | ❌ Reported failure with stderr and non‑zero exit code |
| `npm run inspector -- review --repo . --validate "npm test" --timeout 100` | ❌ Timed out correctly and reported timeout |
| `npm run inspector -- review --repo . --validate "npm test" --dry-run` | ✅ Printed preview, no execution |
| `npm run inspector -- review --repo . --format json --output report.json` | ✅ Wrote valid JSON to `report.json` |
| `npm run mcp-server` (then connected via a test client) | ✅ Tool listed, called with arguments, returned JSON |

All tests passed or behaved as expected.

---

## A blocker you hit and how you approached it

**Blocker:** The `runValidation` function used `command.split(/\s+/)` to separate the command and arguments. When I tested with `npm run "test:unit"`, the argument arrived as `'"test:unit"'` (including quotes), causing `spawn` to treat it as a single literal argument, and the command failed.

**Approach:** I could have added a dependency like `shell-quote`, but to keep the tool lightweight, I wrote a small quote‑aware splitter that handles double‑quoted strings. This resolved the issue without introducing external libraries. I verified it with several command strings, including nested quotes and multiple arguments.

---

## Known limitations and the next three things you would do

**Known limitations:**

- No caching – repeated runs on large repos may be slower than necessary.
- No whitelist – users can run any command, so care is required.
- Limited test coverage – only manual tests were performed.
- Missing `--verbose` flag – detailed logs are not available.

**Next three things I would do:**

1. **Add caching** – store Git status per `HEAD` hash and invalidate when HEAD changes, speeding up frequent calls.
2. **Implement `--verbose`** – log every Git command and subprocess output to stderr, helping debugging.
3. **Add unit tests** – using `vitest` and temporary repositories to cover Git parsing, command splitting, timeout, and dry‑run.

These would make the tool more robust and production‑ready.

---

## Approximate focused-work time

- **Start:** 2026-08-14 13:30 UTC  
- **Finish:** 2026-08-14 15:00 UTC  
- **Total:** ~90 minutes (including investigation, implementation, verification, and documentation)
