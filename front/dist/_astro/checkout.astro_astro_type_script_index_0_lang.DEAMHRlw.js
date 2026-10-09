import{t as e}from"./cart.DMgG0ncx.js";import{n as t,t as n}from"./auth.DU1tc4gE.js";var r=document.getElementById(`telefonoCliente`),i=document.getElementById(`auth-required-box`),a=document.getElementById(`checkout-main-view`),o=document.getElementById(`checkout-form`),s=document.getElementById(`submit-order-btn`),c=document.getElementById(`checkout-error-alert`),l=document.getElementById(`order-items-preview`),u=document.getElementById(`chk-subtotal`),d=document.getElementById(`chk-discount-row`),f=document.getElementById(`chk-discount`),p=document.getElementById(`chk-shipping`),m=document.getElementById(`chk-total`);if(r&&r.addEventListener(`input`,()=>{r.value=r.value.replace(/\D/g,``).slice(0,10)}),!n.isAuthenticated())i&&(i.style.display=`block`),a&&(a.style.display=`none`);else{i&&(i.style.display=`none`),a&&(a.style.display=`grid`);let h=e.getItems();h.length===0&&(window.showToast&&window.showToast(`Tu carrito está vacío. Agrega libros primero.`,`info`),setTimeout(()=>{window.location.href=`/catalogo`},500));let g=n.getUser();if(g){let e=document.getElementById(`nombreCliente`),t=document.getElementById(`emailCliente`),n=document.getElementById(`telefonoCliente`),r=document.getElementById(`direccionEnvio`);e&&(e.value=g.nombre||``),t&&(t.value=g.email||``),n&&g.telefono&&(n.value=g.telefono),r&&g.direccion&&(r.value=g.direccion)}l&&(l.innerHTML=h.map(e=>`
        <div class="order-item-mini">
          <img src="${e.imagen}" alt="${e.titulo}" class="mini-thumb" />
          <div class="mini-details">
            <span class="mini-title">${e.titulo}</span>
            <span class="mini-meta">Cant: ${e.cantidad} × $${Number(e.precio).toFixed(2)}</span>
          </div>
          <span class="mini-price">$${(Number(e.precio)*Number(e.cantidad)).toFixed(2)}</span>
        </div>
      `).join(``));let _=e.getFinancials();u&&(u.textContent=`$${_.subtotal.toFixed(2)} MXN`),p&&(p.textContent=_.shipping===0?`GRATIS`:`$${_.shipping.toFixed(2)} MXN`),m&&(m.textContent=`$${_.total.toFixed(2)} MXN`),_.discount>0&&d&&(d.style.display=`flex`,f&&(f.textContent=`-$${_.discount.toFixed(2)} MXN`)),document.querySelectorAll(`.payment-card-option`).forEach(e=>{e.addEventListener(`click`,()=>{document.querySelectorAll(`.payment-card-option`).forEach(e=>e.classList.remove(`selected`)),e.classList.add(`selected`);let t=e.querySelector(`input`);t&&(t.checked=!0);let n=document.getElementById(`card-fields-box`);n&&(n.style.display=t.value===`TARJETA_CREDITO`||t.value===`TARJETA_DEBITO`?`block`:`none`)})});let v={metodoPago:`TARJETA_CREDITO`,detallesPago:null,referenciaPago:null};window.addEventListener(`payment-method-changed`,e=>{e.detail&&(v={metodoPago:e.detail.metodoPago||`TARJETA_CREDITO`,detallesPago:e.detail.detallesPago||null,referenciaPago:e.detail.referenciaPago||null})}),o&&o.addEventListener(`submit`,async n=>{n.preventDefault(),c&&(c.style.display=`none`);let i=h.find(e=>Number(e.cantidad)>Number(e.stock));if(i){let e=`Stock insuficiente para "`+i.titulo+`". Solicitado: `+i.cantidad+`, disponible: `+i.stock+`.`;c&&(c.textContent=e,c.style.display=`block`),window.showToast&&window.showToast(e,`error`);return}let a=document.getElementById(`telefonoCliente`).value.trim();if(a&&!/^\d{10}$/.test(a)){let e=`El teléfono debe tener exactamente 10 dígitos.`;c&&(c.textContent=e,c.style.display=`block`),window.showToast&&window.showToast(e,`error`),r.focus();return}let o=document.getElementById(`nombreCliente`).value.trim(),l=document.getElementById(`emailCliente`).value.trim(),u=document.getElementById(`direccionEnvio`).value.trim(),d=document.getElementById(`ciudadCliente`).value.trim(),f=v.metodoPago||`TARJETA_CREDITO`,p=v.detallesPago,m=v.referenciaPago,_=`${u}, ${d}`,y=h.map(e=>({productoId:e.id,cantidad:e.cantidad}));s.disabled=!0,s.innerHTML=`<span>⏳ Procesando pago y registrando orden...</span>`;try{let n=await t.mutation(`
        mutation CrearPedidoDirecto($datos: PedidoInput!) {
          crearPedido(datos: $datos) {
            id
            folio
            fecha
            subtotal
            envio
            total
            status
            metodoPago
            nombreCliente
            detallesPago
            referenciaPago
          }
        }
      `,{datos:{items:y,metodoPago:f,direccionEnvio:_,nombreCliente:o,emailCliente:l,usuarioId:g?g.id:null,detallesPago:p,referenciaPago:m}});if(n?.crearPedido?.folio)e.clearCart(),window.showToast&&window.showToast(`¡Orden generada exitosamente!`,`success`),setTimeout(()=>{let e=new URLSearchParams({folio:n.crearPedido.folio,metodo:n.crearPedido.metodoPago||f,ref:n.crearPedido.referenciaPago||``});window.location.href=`/orden-confirmada?${e.toString()}`},500);else throw Error(`No se recibió el folio de confirmación.`)}catch(e){c&&(c.textContent=e.message||`Error al procesar la orden. Verifica la disponibilidad.`,c.style.display=`block`),s.disabled=!1,s.innerHTML=`<span>Confirmar y Pagar Orden</span>`}})}