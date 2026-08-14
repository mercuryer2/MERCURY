import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { reviewRepository } from './core';

const server = new Server(
  {
    name: 'repository-inspector',
    version: '1.0.0',
  },
  {
    capabilities: { tools: {} },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'review_repository',
      description: 'Inspect a Git repository for changes and optionally run a validation command.',
      inputSchema: {
        type: 'object',
        properties: {
          repoPath: { type: 'string', description: 'Path to the Git repository' },
          validateCommand: { type: 'string', description: 'Command to run for validation' },
          timeout: { type: 'number', default: 30000 },
          dryRun: { type: 'boolean', default: false },
        },
        required: ['repoPath'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== 'review_repository') {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }
  const args = request.params.arguments || {};
  const parsed = z.object({
    repoPath: z.string(),
    validateCommand: z.string().optional(),
    timeout: z.number().default(30000),
    dryRun: z.boolean().default(false),
  }).safeParse(args);
  if (!parsed.success) {
    return { content: [{ type: 'text', text: `Invalid arguments: ${parsed.error}` }], isError: true };
  }
  try {
    const result = await reviewRepository({
      repoPath: parsed.data.repoPath,
      validateCommand: parsed.data.validateCommand,
      timeout: parsed.data.timeout,
      dryRun: parsed.data.dryRun,
      format: 'json',
    });
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP server running on stdio');
}
main().catch(console.error);
