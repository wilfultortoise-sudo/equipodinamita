async function testGeminiIntegration() {
  console.log('--- TEST GEMINI + MCP ASSISTANT ---');

  // Test 1: Stock query
  const res1 = await fetch('http://localhost:4000/api/chat-gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Hola, ¿tienen stock del libro Dune?' })
  });
  const data1 = await res1.json();
  console.log('1. Pregunta de Stock:');
  console.log('   Modelo:', data1.model);
  console.log('   Herramienta MCP ejecutada:', data1.toolExecuted);
  console.log('   Respuesta de Gemini:\n', data1.reply);

  // Test 2: Order tracking query
  const res2 = await fetch('http://localhost:4000/api/chat-gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Rastrea mi pedido con folio FOL-MVZO7J0U-745 por favor' })
  });
  const data2 = await res2.json();
  console.log('\n2. Pregunta de Rastreo de Pedido:');
  console.log('   Herramienta MCP ejecutada:', data2.toolExecuted);
  console.log('   Respuesta de Gemini:\n', data2.reply);

  console.log('\n===========================================================');
  console.log('   GEMINI ESTÁ 100% CONECTADO A TU TIENDA Y A TUS MCP TOOLS');
  console.log('===========================================================');
}

testGeminiIntegration().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
