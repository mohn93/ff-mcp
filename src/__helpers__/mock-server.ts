/**
 * Mock McpServer that captures tool handlers for direct invocation in tests.
 *
 * Usage:
 *   const { server, getHandler } = createMockServer();
 *   registerSomeTool(server as any, client);
 *   const handler = getHandler("tool_name");
 *   const result = await handler({ someParam: "value" });
 */
import { vi } from "vitest";

export interface ToolHandler {
  (args: Record<string, unknown>): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }>;
}

interface MockServer {
  tool: ReturnType<typeof vi.fn>;
}

/**
 * Create a mock MCP server that captures tool registrations.
 */
export function createMockServer() {
  const handlers = new Map<string, ToolHandler>();

  const server: MockServer = {
    tool: vi.fn((...args: unknown[]) => {
      // server.tool() can be called as:
      //   server.tool(name, description, schema, handler)
      //   server.tool(name, schema, handler)
      const name = args[0] as string;

      // Find the handler — it's always the last argument
      const handler = args[args.length - 1] as (
        params: { [key: string]: unknown },
        extra: unknown
      ) => Promise<unknown>;

      handlers.set(name, async (toolArgs: Record<string, unknown>) => {
        const result = await handler(toolArgs, {});
        return result as {
          content: Array<{ type: string; text: string }>;
          isError?: boolean;
        };
      });
    }),
  };

  return {
    server,
    getHandler(name: string): ToolHandler {
      const handler = handlers.get(name);
      if (!handler) {
        throw new Error(
          `No handler registered for tool "${name}". Registered: ${[...handlers.keys()].join(", ")}`
        );
      }
      return handler;
    },
    getRegisteredTools(): string[] {
      return [...handlers.keys()];
    },
  };
}
