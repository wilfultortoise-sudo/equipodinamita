import { createClient } from 'graphql-ws';
import WebSocket from 'ws';

const HTTP_URL = 'http://localhost:4000/graphql';
const WS_URL = 'ws://localhost:4000/graphql';

async function runTest() {
  console.log('--- INICIANDO PRUEBAS DE SUSCRIPCIONES Y SERVIDOR HÍBRIDO ---');

  // 1. Prueba HTTP Básica
  console.log('1. Probando Query HTTP...');
  const queryRes = await fetch(HTTP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'query { productos(limite: 2) { id titulo stock } }'
    })
  });
  const queryData = await queryRes.json();
  if (!queryData.data?.productos?.length) {
    throw new Error('Fallo la consulta HTTP: ' + JSON.stringify(queryData));
  }
  console.log('   ✓ Query HTTP exitosa. Libros encontrados:', queryData.data.productos.length);
  const sampleProduct = queryData.data.productos[0];

  // 2. Conexión WebSocket y Suscripción con graphql-ws
  console.log('2. Conectando cliente WebSocket a:', WS_URL);
  const wsClient = createClient({
    url: WS_URL,
    webSocketImpl: WebSocket,
    connectionParams: {
      authorization: 'Bearer token_admin_test'
    }
  });

  let subscriptionReceived = false;
  let receivedOrder = null;

  const unsubscribe = wsClient.subscribe(
    {
      query: `
        subscription OnPedidoCreado {
          pedidoCreado {
            id
            folio
            total
            status
            nombreCliente
          }
        }
      `
    },
    {
      next: (val) => {
        console.log('   ★ [WS EVENT RECIBIDO]', JSON.stringify(val));
        if (val.data?.pedidoCreado) {
          subscriptionReceived = true;
          receivedOrder = val.data.pedidoCreado;
        }
      },
      error: (err) => {
        console.error('   ✗ Error en suscripcion WS:', JSON.stringify(err));
      },
      complete: () => {
        console.log('   ✓ Suscripcion completada');
      }
    }
  );

  // Esperar 1 segundo para asegurar que el WebSocket handshake se completó
  await new Promise((r) => setTimeout(r, 1000));

  // 3. Disparar Mutation crearPedido por HTTP
  console.log('3. Emitiendo Mutation crearPedido via HTTP...');
  const mutationRes = await fetch(HTTP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        mutation CrearPedidoTest($datos: PedidoInput!) {
          crearPedido(datos: $datos) {
            id
            folio
            total
            status
          }
        }
      `,
      variables: {
        datos: {
          items: [{ productoId: sampleProduct.id, cantidad: 1 }],
          metodoPago: 'TARJETA_CREDITO',
          direccionEnvio: 'Av. Patria 123, Guadalajara',
          nombreCliente: 'Cliente Demo WS',
          emailCliente: 'demo@cetis.mx'
        }
      }
    })
  });
  const mutationData = await mutationRes.json();
  if (mutationData.errors) {
    throw new Error('Error al ejecutar crearPedido: ' + JSON.stringify(mutationData.errors));
  }
  const createdOrderId = mutationData.data.crearPedido.id;
  console.log('   ✓ Pedido creado exitosamente vía HTTP con ID:', createdOrderId);

  // 4. Esperar a que el evento llegue por WebSocket
  console.log('4. Esperando recepción del evento via WebSocket...');
  let attempts = 0;
  while (!subscriptionReceived && attempts < 20) {
    await new Promise((r) => setTimeout(r, 200));
    attempts++;
  }

  if (!subscriptionReceived) {
    throw new Error('✗ No se recibió el evento pedidoCreado en el tiempo esperado.');
  }

  console.log('   ✓ ¡Suscripción pedidoCreado recibida en tiempo real con éxito!');
  console.log('     ID Orden:', receivedOrder.id, '| Total: $' + receivedOrder.total, '| Cliente:', receivedOrder.nombreCliente);

  // 5. Probar suscripción stockActualizado
  console.log('5. Probando suscripción stockActualizado...');
  let stockUpdatedReceived = false;
  let receivedStockProduct = null;

  const unsubscribeStock = wsClient.subscribe(
    {
      query: `
        subscription OnStockActualizado {
          stockActualizado {
            id
            titulo
            stock
          }
        }
      `
    },
    {
      next: (val) => {
        console.log('   ★ [WS EVENT RECIBIDO] stockActualizado:', val.data?.stockActualizado);
        stockUpdatedReceived = true;
        receivedStockProduct = val.data?.stockActualizado;
      },
      error: (err) => console.error(err),
      complete: () => {}
    }
  );

  await new Promise((r) => setTimeout(r, 1000));

  const newStockTarget = Number(sampleProduct.stock) + 5;
  console.log(`6. Actualizando stock del producto ${sampleProduct.id} a ${newStockTarget}...`);
  await fetch(HTTP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        mutation ActualizarStockTest($id: ID!, $stock: Int!) {
          actualizarStock(id: $id, stock: $stock) {
            id
            titulo
            stock
          }
        }
      `,
      variables: { id: sampleProduct.id, stock: newStockTarget }
    })
  });

  attempts = 0;
  while (!stockUpdatedReceived && attempts < 20) {
    await new Promise((r) => setTimeout(r, 200));
    attempts++;
  }

  if (!stockUpdatedReceived) {
    throw new Error('✗ No se recibió el evento stockActualizado en el tiempo esperado.');
  }

  console.log('   ✓ ¡Suscripción stockActualizado recibida en tiempo real con éxito!');
  console.log('     Libro:', receivedStockProduct.titulo, '| Nuevo stock:', receivedStockProduct.stock);

  // 7. Probar suscripción pedidoActualizado
  console.log('7. Probando suscripción pedidoActualizado...');
  let orderUpdatedReceived = false;
  let receivedUpdatedOrder = null;

  const unsubscribeOrderUpdate = wsClient.subscribe(
    {
      query: `
        subscription OnPedidoActualizado {
          pedidoActualizado {
            id
            status
          }
        }
      `
    },
    {
      next: (val) => {
        console.log('   ★ [WS EVENT RECIBIDO] pedidoActualizado:', val.data?.pedidoActualizado);
        orderUpdatedReceived = true;
        receivedUpdatedOrder = val.data?.pedidoActualizado;
      },
      error: (err) => console.error(err),
      complete: () => {}
    }
  );

  await new Promise((r) => setTimeout(r, 1000));

  console.log(`8. Cambiando estado del pedido ${createdOrderId} a ENVIADO...`);
  await fetch(HTTP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        mutation ActualizarEstadoPedidoTest($id: ID!, $status: StatusPedido!) {
          actualizarEstadoPedido(id: $id, status: $status) {
            id
            status
          }
        }
      `,
      variables: { id: createdOrderId, status: 'ENVIADO' }
    })
  });

  attempts = 0;
  while (!orderUpdatedReceived && attempts < 20) {
    await new Promise((r) => setTimeout(r, 200));
    attempts++;
  }

  if (!orderUpdatedReceived) {
    throw new Error('✗ No se recibió el evento pedidoActualizado en el tiempo esperado.');
  }

  console.log('   ✓ ¡Suscripción pedidoActualizado recibida en tiempo real con éxito!');
  console.log('     Orden ID:', receivedUpdatedOrder.id, '| Nuevo estado:', receivedUpdatedOrder.status);

  // Limpiar suscripciones y cliente WS
  unsubscribe();
  unsubscribeStock();
  unsubscribeOrderUpdate();
  await wsClient.dispose();

  console.log('\n===========================================================');
  console.log('   ¡TODAS LAS PRUEBAS DE SUBSCRIPTIONS PASARON CON ÉXITO!');
  console.log('===========================================================');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('\n✗ PRUEBA FALLIDA:', err.message);
  process.exit(1);
});
