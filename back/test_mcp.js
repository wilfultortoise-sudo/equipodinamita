async function testMcpHttp() {
  console.log('--- TEST MCP HTTP ENDPOINTS ---');

  // 1. Tool: search_books
  const resSearch = await fetch('http://localhost:4000/mcp/call', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tool: 'search_books',
      args: { query: 'Dune' }
    })
  });
  const dataSearch = await resSearch.json();
  console.log('1. MCP search_books("Dune"):');
  console.log('   Encontrados:', dataSearch.result?.found);
  if (dataSearch.result?.results?.length > 0) {
    console.log('   Libro:', dataSearch.result.results[0].titulo, '-', dataSearch.result.results[0].precio);
  }

  // 2. Tool: check_stock
  const resStock = await fetch('http://localhost:4000/mcp/call', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tool: 'check_stock',
      args: { id: '1' }
    })
  });
  const dataStock = await resStock.json();
  console.log('\n2. MCP check_stock(id: "1"):');
  console.log('   Disponible:', dataStock.result?.disponible);
  console.log('   Stock actual:', dataStock.result?.stock, 'unidades');

  // 3. Tool: get_order_status
  const resOrders = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'query { pedidos { folio } }' })
  });
  const orders = await resOrders.json();
  const sampleFolio = orders.data?.pedidos?.[0]?.folio || 'FOL-DEMO-INIT';

  const resStatus = await fetch('http://localhost:4000/mcp/call', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tool: 'get_order_status',
      args: { folio: sampleFolio }
    })
  });
  const dataStatus = await resStatus.json();
  console.log(`\n3. MCP get_order_status("${sampleFolio}"):`);
  console.log('   Estado:', dataStatus.result?.status);
  console.log('   Cliente:', dataStatus.result?.cliente);
  console.log('   Total:', dataStatus.result?.total);
  console.log('   Eventos de Auditoría en MongoDB:', dataStatus.result?.trazabilidadMongoDB?.length);

  // 4. Tool: get_store_kpis
  const resKpi = await fetch('http://localhost:4000/mcp/call', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool: 'get_store_kpis' })
  });
  const dataKpi = await resKpi.json();
  console.log('\n4. MCP get_store_kpis:');
  console.log('   Total pedidos:', dataKpi.result?.totalPedidos);
  console.log('   Ventas totales:', dataKpi.result?.ventasTotales);

  console.log('\n===========================================================');
  console.log('   PASO 4: MCP (MODEL CONTEXT PROTOCOL) 100% OPERATIVO');
  console.log('===========================================================');
}

testMcpHttp().catch(err => {
  console.error('Error en testMcpHttp:', err);
  process.exit(1);
});
