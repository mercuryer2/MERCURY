# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the latest version of the Repository Inspector.  
Older versions are not actively supported.

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | ✅                 |
| < 2.0   | ❌                 |

---

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability within this project, **please do not disclose it publicly**.

Instead, report it privately via **GitHub Security Advisories**:

1. Go to the repository's **Security** tab.
2. Click **"Report a vulnerability"**.
3. Fill out the advisory form with as much detail as possible (steps to reproduce, impact, potential fixes, etc.).

You can also use the following direct link (replace with your actual repository URL):

👉 **[Report a vulnerability](https://github.com/mercuryer2/MERCURY/security/advisories/new)**

We will acknowledge your report within **48 hours** and work with you to understand and resolve the issue. Once fixed, we will publicly credit you (if you wish) in the release notes.

---

## Security Best Practices for Users

- **Validation commands** are executed with the same permissions as the user running the tool. Only run commands you trust.
- Use the `--dry-run` flag to preview commands before actual execution.
- Avoid using untrusted or user‑supplied command strings unless properly sanitized.
- Consider restricting validation commands to a predefined whitelist (e.g., only `npm test`, `npm run typecheck`) in production environments.
- The tool **does not** modify your repository – it only reads Git status and runs the specified command. However, the validation command itself may have side effects.

---

## Safe Usage Example

Always review the command before running it:

```bash
npm run inspector -- review --repo . --validate "npm test" --dry-run
