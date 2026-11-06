import nodemailer from 'nodemailer';

/**
 * Servicio de Envio de Correos Transaccionales (API de Terceros 4)
 * BiblioTech Store - E-Commerce CETI
 */

let transporter = null;

// Inicializar transporte SMTP
async function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass }
    });
    console.log('[Email Service] Conectado a servidor SMTP configurado:', host);
  } else {
    // Modo Sandbox / Cuenta de prueba automatica
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal_pass'
      }
    });
    console.log('[Email Service] Modo Sandbox / Logger activo (Nodemailer Transaccional).');
  }

  return transporter;
}

/**
 * Envia el comprobante oficial de compra por correo electronico
 * @param {Object} pedido - Objeto con datos de la orden
 */
export async function enviarCorreoConfirmacionPedido(pedido) {
  if (!pedido || !pedido.emailCliente) {
    console.warn('[Email Service] No se pudo enviar correo: falta destinatario.');
    return { success: false, error: 'Falta email de destinatario' };
  }

  const itemsHtml = Array.isArray(pedido.detalles) && pedido.detalles.length > 0
    ? pedido.detalles.map(d => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${d.producto?.titulo || 'Libro'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${d.cantidad}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">$${d.precioUnitario?.toFixed(2) || '0.00'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">$${d.subtotal?.toFixed(2) || '0.00'}</td>
        </tr>
      `).join('')
    : `
        <tr>
          <td colspan="4" style="padding: 10px; border-bottom: 1px solid #e2e8f0;">Libros adquiridos segun orden ${pedido.folio}</td>
        </tr>
      `;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Confirmacion de Pedido - BiblioTech</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background: #0284c7; padding: 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px;">BiblioTech Store</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Confirmacion Oficial de Compra</p>
        </div>

        <div style="padding: 24px;">
          <h2 style="color: #0369a1; margin-top: 0;">¡Gracias por tu compra, ${pedido.nombreCliente || 'Cliente'}!</h2>
          <p>Tu orden ha sido procesada y registrada exitosamente en nuestro sistema.</p>

          <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>Folio de Orden:</strong> ${pedido.folio}</p>
            <p style="margin: 4px 0;"><strong>Fecha:</strong> ${pedido.fecha || new Date().toLocaleString('es-MX')}</p>
            <p style="margin: 4px 0;"><strong>Metodo de Pago:</strong> ${pedido.metodoPago}</p>
            <p style="margin: 4px 0;"><strong>Referencia:</strong> ${pedido.referenciaPago || 'N/A'}</p>
            <p style="margin: 4px 0;"><strong>Direccion de Entrega:</strong> ${pedido.direccionEnvio || 'Punto acordado'}</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background: #e2e8f0; font-size: 13px; text-align: left;">
                <th style="padding: 8px;">Producto</th>
                <th style="padding: 8px; text-align: center;">Cant.</th>
                <th style="padding: 8px; text-align: right;">Precio</th>
                <th style="padding: 8px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 12px 10px; font-weight: bold; text-align: right;">Total Pagado:</td>
                <td style="padding: 12px 10px; font-weight: bold; text-align: right; color: #0284c7; font-size: 18px;">$${pedido.total ? pedido.total.toFixed(2) : '0.00'} MXN</td>
              </tr>
            </tfoot>
          </table>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center;">
            <p>BiblioTech Store — Proyecto Integrador de Ingenieria en Software | CETI Colomos</p>
            <p>Este es un correo automatico generado por el servicio de notificaciones transaccionales.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const mailClient = await getTransporter();
    
    // Si tenemos servidor SMTP configurado, enviamos
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      const info = await mailClient.sendMail({
        from: `"BiblioTech Store" <${process.env.SMTP_USER}>`,
        to: pedido.emailCliente,
        subject: `Confirmacion de Pedido ${pedido.folio} — BiblioTech Store`,
        html: htmlContent
      });
      console.log(`[Email Service] Correo enviado exitosamente a ${pedido.emailCliente}. MessageID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } else {
      // En modo local sin SMTP externo configurado, simulamos el envio y logueamos el recibo
      console.log(`[Email Service] Comprobante de pedido ${pedido.folio} generado y listo para entrega a: ${pedido.emailCliente}`);
      return { success: true, messageId: `mock-email-${Date.now()}` };
    }
  } catch (err) {
    console.error('[Email Service] Error al procesar envio de correo:', err.message);
    return { success: false, error: err.message };
  }
}
