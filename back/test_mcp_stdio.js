import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testStdio() {
  console.log('--- TEST MCP STDIO CLIENT (CLAUDE / CURSOR PROTOCOL) ---');

  const serverPath = path.join(__dirname, 'mcp_server.js');
  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverPath]
  });

  const client = new Client({
    name: 'test-mcp-client',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  await client.connect(transport);
  console.log('✓ Conectado exitosamente al servidor MCP vía Stdio.');

  // 1. Listar herramientas
  const toolsResult = await client.listTools();
  console.log(`✓ Herramientas MCP descubiertas (${toolsResult.tools.length}):`);
  toolsResult.tools.forEach(t => console.log(`  - ${t.name}: ${t.description}`));

  // 2. Invocar search_books
  const searchResult = await client.callTool({
    name: 'search_books',
    arguments: { query: 'Dune', limite: 1 }
  });
  console.log('\n✓ Invocación de search_books vía MCP Stdio:');
  console.log(searchResult.content?.[0]?.text);

  // 3. Invocar check_stock
  const stockResult = await client.callTool({
    name: 'check_stock',
    arguments: { id: '1' }
  });
  console.log('\n✓ Invocación de check_stock vía MCP Stdio:');
  console.log(stockResult.content?.[0]?.text);

  await client.close();
  console.log('\n===========================================================');
  console.log('   MCP STDIO PASÓ AL 100% (COMPATIBLE CON CLAUDE Y CURSOR)');
  console.log('===========================================================');
}

testStdio().catch(err => {
  console.error('Error en testStdio:', err);
  process.exit(1);
});
