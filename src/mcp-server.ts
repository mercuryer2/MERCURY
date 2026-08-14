import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { reviewRepository } from './core.js';

const server = new Server(
  { name: 'repository-inspector', version: '2.1.0' },
  { capabilities: { tools: {} } },
);

const inputSchema = z.object({
  repoPath: z.string().min(1),
  validateCommand: z.string().min(1).optional(),
  timeout: z.number().int().positive().max(600_000).default(30_000),
  dryRun: z.boolean().default(false),
  allowValidation: z.boolean().default(false),
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: 'review_repository',
    description:
      'Inspect a Git repository. Validation command execution is disabled by default because it can execute a local process with the MCP server user privileges; set allowValidation=true only in a trusted environment.',
    inputSchema: {
      type: 'object',
      properties: {
        repoPath: { type: 'string', description: 'Path to the Git repository' },
        validateCommand: { type: 'string', description: 'Validation command; requires allowValidation=true' },
        timeout: { type: 'number', minimum: 1, maximum: 600_000, default: 30_000 },
        dryRun: { type: 'boolean', default: false },
        allowValidation: { type: 'boolean', default: false },
      },
      required: ['repoPath'],
    },
  }],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== 'review_repository') {
    return { content: [{ type: 'text', text: `Unknown tool: ${request.params.name}` }], isError: true };
  }

  const parsed = inputSchema.safeParse(request.params.arguments ?? {});
  if (!parsed.success) {
    return {
      content: [{ type: 'text', text: `Invalid arguments: ${parsed.error.message}` }],
      isError: true,
    };
  }

  const { repoPath, validateCommand, timeout, dryRun, allowValidation } = parsed.data;
  if (validateCommand && !allowValidation) {
    return {
      content: [{ type: 'text', text: 'Validation execution is disabled by default. Set allowValidation=true only for a trusted local MCP client.' }],
      isError: true,
    };
  }

  try {
    const result = await reviewRepository({
      repoPath,
      validateCommand,
      timeout,
      dryRun,
      format: 'json',
    });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP server running on stdio');
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`MCP server failed: ${message}`);
  process.exitCode = 1;
});
