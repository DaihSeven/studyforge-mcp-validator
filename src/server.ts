/**
 * MCP Server for StudyForge Validator
 * 
 * This module provides the MCP (Model Context Protocol) server interface
 * for the StudyForge validator tools.
 * 
 * Tools exposed:
 * - validate-architecture: Validates libs respect CLAUDE.md rules
 * - validate-spec: Validates DDD spec compliance
 * - validate-adr: Validates ADR template
 * - detect-conflicts: Detects conflicts in specs
 * 
 * Usage:
 *   node dist/server.js (via stdio transport)
 */

import { validateArchitectureTool } from './tools/validate-architecture';
import { validateSpecTool } from './tools/validate-spec';
import { validateADRTool } from './tools/validate-adr';
import { detectConflictsTool } from './tools/detect-conflicts';

export interface MCPTool {
  name: string;
  description: string;
  execute: (args: any) => Promise<any>;
}

export const MCP_TOOLS: MCPTool[] = [
  {
    name: 'validate-architecture',
    description:
      'Validates if a lib respects StudyForge architecture rules (CLAUDE.md). Checks domain purity, scope boundaries, imports.',
    execute: async (args: any) => validateArchitectureTool(args.libPath),
  },
  {
    name: 'validate-spec',
    description:
      'Validates if a spec respects DDD principles (ubiquitous language, bounded context). Checks EARS criteria and BDD scenarios.',
    execute: async (args: any) => validateSpecTool(args.specContent, args.boundedContext),
  },
  {
    name: 'validate-adr',
    description:
      'Validates if an ADR follows the template (7 required sections: Title, Status, Context, Decision, Consequences, Alternatives, Related ADRs).',
    execute: async (args: any) => validateADRTool(args.adrContent),
  },
  {
    name: 'detect-conflicts',
    description: 'Detects conflicts in definitions across multiple specs (same term, different definition).',
    execute: async (args: any) => detectConflictsTool(args.specs),
  },
];

async function handleToolCall(toolName: string, args: any): Promise<string> {
  const tool = MCP_TOOLS.find(t => t.name === toolName);
  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  try {
    const result = await tool.execute(args);
    return JSON.stringify(result, null, 2);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return JSON.stringify({ error: message }, null, 2);
  }
}

// Main server entry point
async function main() {
  console.error('StudyForge MCP Validator started');
  console.error('Available tools: ' + MCP_TOOLS.map(t => t.name).join(', '));
}

if (require.main === module) {
  main().catch(console.error);
}

export { handleToolCall };
