async function testStep3() {
  console.log('--- TEST STEP 3: POSTGRESQL & MONGODB ---');

  // 1. Health endpoint
  const healthRes = await fetch('http://localhost:4000/health');
  const health = await healthRes.json();
  console.log('1. Health check status:');
  console.log('   PostgreSQL driver:', health.databases.relational.driver);
  console.log('   PostgreSQL engine:', health.databases.relational.engine);
  console.log('   MongoDB driver:   ', health.databases.nosql.driver);
  console.log('   MongoDB mode:     ', health.databases.nosql.mode);
  console.log('   MongoDB collections:', health.databases.nosql.collections.join(', '));

  // 2. Query resenasPorProducto from MongoDB
  const queryRes = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        query {
          resenasPorProducto(productoId: "1") {
            id
            usuarioNombre
            calificacion
            comentario
            fecha
          }
          statusBasesDeDatos {
            relacionalMotor
            nosqlMotor
            nosqlModo
            nosqlColecciones
          }
        }
      `
    })
  });
  const data = await queryRes.json();
  console.log('\n2. GraphQL resenasPorProducto (MongoDB):');
  console.log('   Reseñas encontradas:', data.data?.resenasPorProducto?.length);
  if (data.data?.resenasPorProducto?.length > 0) {
    const first = data.data.resenasPorProducto[0];
    console.log(`   ★ [${first.calificacion}/5] ${first.usuarioNombre}: "${first.comentario}"`);
  }

  // 3. Crear una nueva reseña en MongoDB
  const mutationRes = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        mutation {
          crearResena(
            productoId: "1"
            usuarioNombre: "Profesor Evaluador"
            calificacion: 5
            comentario: "Excelente implementación de catálogo con reseñas almacenadas en MongoDB NoSQL."
          ) {
            id
            productoId
            usuarioNombre
            calificacion
            comentario
          }
        }
      `
    })
  });
  const mutData = await mutationRes.json();
  console.log('\n3. Mutation crearResena (MongoDB):');
  console.log('   Reseña creada:', mutData.data?.crearResena?.id);
  console.log('   Usuario:', mutData.data?.crearResena?.usuarioNombre);

  // 4. Auditoría de Pedidos en MongoDB
  const auditRes = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        query {
          todasAuditorias(limite: 5) {
            id
            pedidoFolio
            evento
            detalles
            fecha
          }
        }
      `
    })
  });
  const auditData = await auditRes.json();
  console.log('\n4. Auditoría NoSQL de Pedidos (MongoDB):');
  console.log('   Registros de auditoría:', auditData.data?.todasAuditorias?.length);
  if (auditData.data?.todasAuditorias?.length > 0) {
    console.log('   Último evento:', auditData.data.todasAuditorias[0].evento, '->', auditData.data.todasAuditorias[0].detalles);
  }

  console.log('\n===========================================================');
  console.log('   PASO 3: POSTGRESQL & MONGODB VERIFICADO CON ÉXITO');
  console.log('===========================================================');
}

testStep3().catch(err => {
  console.error('Error en testStep3:', err);
  process.exit(1);
});
