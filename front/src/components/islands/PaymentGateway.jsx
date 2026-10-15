import { useState, useEffect } from 'react';

export default function PaymentGateway() {
  const [selectedMethod, setSelectedMethod] = useState('TARJETA_CREDITO');
  
  // Estados para Tarjeta
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardBrand, setCardBrand] = useState('generic'); // visa, mastercard, amex, generic

  // Estados para OXXO Pay
  const [oxxoRef] = useState(() => {
    const p1 = Math.floor(1000 + Math.random() * 9000);
    const p2 = Math.floor(1000 + Math.random() * 9000);
    const p3 = Math.floor(1000 + Math.random() * 9000);
    const p4 = Math.floor(10 + Math.random() * 90);
    return `${p1} ${p2} ${p3} ${p4}`;
  });

  // Estados para SPEI
  const clabeInterbancaria = '6461 8012 3456 7890 12';
  const [copiedClabe, setCopiedClabe] = useState(false);

  // Sub-billetera digital (Mercado Pago o PayPal)
  const [walletType, setWalletType] = useState('MERCADO_PAGO');

  // Obtener nombre visible de la marca de tarjeta
  const getBrandDisplayName = (brand) => {
    switch (brand) {
      case 'amex':
        return 'AMERICAN EXPRESS';
      case 'visa':
        return 'VISA';
      case 'mastercard':
        return 'MASTERCARD';
      default:
        return 'TARJETA';
    }
  };

  // Detectar marca de tarjeta por prefijo BIN (Amex: empieza con 3 o 34/37)
  useEffect(() => {
    const raw = cardNumber.replace(/\s+/g, '');
    if (raw.startsWith('4')) {
      setCardBrand('visa');
    } else if (/^5[1-5]/.test(raw) || /^2[2-7]/.test(raw)) {
      setCardBrand('mastercard');
    } else if (raw.startsWith('34') || raw.startsWith('37') || raw.startsWith('3')) {
      setCardBrand('amex');
    } else {
      setCardBrand('generic');
    }
  }, [cardNumber]);

  // Formatear número de tarjeta (4-6-5 para Amex de 15 dígitos; 4-4-4-4 para 16 dígitos)
  const handleCardNumberChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    const isAmex = rawVal.startsWith('3');
    const maxDigits = isAmex ? 15 : 16;
    const val = rawVal.slice(0, maxDigits);

    let formatted = val;
    if (isAmex) {
      // Formato oficial American Express (4-6-5): 3782 822468 98210
      const parts = [];
      if (val.length > 0) parts.push(val.slice(0, 4));
      if (val.length > 4) parts.push(val.slice(4, 10));
      if (val.length > 10) parts.push(val.slice(10, 15));
      formatted = parts.join(' ');
    } else {
      // Formato estándar (4-4-4-4): 4152 7890 1234 9812
      formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    }

    setCardNumber(formatted);
  };

  // Formatear Expiración MM/AA
  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 3) {
      val = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
    }
    setCardExpiry(val);
  };

  // Notificar al formulario padre de checkout sobre el método seleccionado y datos
  useEffect(() => {
    let detallesPago = {};
    let referenciaPago = null;

    if (selectedMethod === 'TARJETA_CREDITO' || selectedMethod === 'TARJETA_DEBITO') {
      const cleanNum = cardNumber.replace(/\s+/g, '');
      const last4 = cleanNum.slice(-4) || '••••';
      detallesPago = {
        marca: cardBrand === 'amex' ? 'AMERICAN EXPRESS' : cardBrand.toUpperCase(),
        ultimos4: last4,
        titular: cardHolder || 'NO ESPECIFICADO'
      };
      referenciaPago = `CARD-${cardBrand === 'amex' ? 'AMEX' : cardBrand.toUpperCase()}-${last4}`;
    } else if (selectedMethod === 'OXXO_EFECTIVO') {
      detallesPago = {
        tienda: 'OXXO Pay',
        comision: 15.0,
        vigencia: '48 horas'
      };
      referenciaPago = `OXXO-${oxxoRef.replace(/\s+/g, '')}`;
    } else if (selectedMethod === 'MERCADO_PAGO' || selectedMethod === 'PAYPAL') {
      detallesPago = {
        billetera: walletType,
        modo: 'Acreditación Inmediata Digital'
      };
      referenciaPago = `${walletType}-DIGITAL-${Date.now().toString(36).toUpperCase()}`;
    } else if (selectedMethod === 'TRANSFERENCIA_SPEI') {
      detallesPago = {
        banco: 'STP / BiblioTech',
        clabe: clabeInterbancaria
      };
      referenciaPago = `SPEI-${Date.now().toString().slice(-6)}`;
    }

    const payload = {
      metodoPago: selectedMethod === 'MERCADO_PAGO' ? walletType : selectedMethod,
      detallesPago: JSON.stringify(detallesPago),
      referenciaPago
    };

    window.dispatchEvent(new CustomEvent('payment-method-changed', { detail: payload }));
  }, [selectedMethod, cardNumber, cardHolder, cardBrand, walletType, oxxoRef]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text.replace(/\s+/g, ''));
    setCopiedClabe(true);
    if (window.showToast) {
      window.showToast('CLABE copiada al portapapeles', 'success');
    }
    setTimeout(() => setCopiedClabe(false), 2500);
  };

  return (
    <div className="payment-gateway-island">
      <div className="gateway-header">
        <h3 className="gateway-title">
          <span>Selecciona tu Método de Pago</span>
          <span className="gateway-secure-tag">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            256-bit SSL Cifrado
          </span>
        </h3>
      </div>

      {/* Pestañas de Selección */}
      <div className="gateway-tabs">
        <button
          type="button"
          className={`gateway-tab ${selectedMethod === 'TARJETA_CREDITO' ? 'active' : ''}`}
          onClick={() => setSelectedMethod('TARJETA_CREDITO')}
        >
          <span className="tab-icon">💳</span>
          <span className="tab-label">Tarjeta</span>
        </button>

        <button
          type="button"
          className={`gateway-tab ${selectedMethod === 'OXXO_EFECTIVO' ? 'active' : ''}`}
          onClick={() => setSelectedMethod('OXXO_EFECTIVO')}
        >
          <span className="tab-icon">🏪</span>
          <span className="tab-label">OXXO Pay</span>
        </button>

        <button
          type="button"
          className={`gateway-tab ${selectedMethod === 'MERCADO_PAGO' ? 'active' : ''}`}
          onClick={() => setSelectedMethod('MERCADO_PAGO')}
        >
          <span className="tab-icon">⚡</span>
          <span className="tab-label">Digital</span>
        </button>

        <button
          type="button"
          className={`gateway-tab ${selectedMethod === 'TRANSFERENCIA_SPEI' ? 'active' : ''}`}
          onClick={() => setSelectedMethod('TRANSFERENCIA_SPEI')}
        >
          <span className="tab-icon">🏦</span>
          <span className="tab-label">SPEI</span>
        </button>
      </div>

      {/* CONTENIDO 1: TARJETA DE CRÉDITO / DÉBITO */}
      {(selectedMethod === 'TARJETA_CREDITO' || selectedMethod === 'TARJETA_DEBITO') && (
        <div className="gateway-content card-payment-panel">
          
          {/* Tarjeta Virtual Animada */}
          <div className={`virtual-card-wrapper ${isFlipped ? 'flipped' : ''}`}>
            {/* Frente de la Tarjeta */}
            <div className={`virtual-card card-front brand-${cardBrand}`}>
              <div className="card-top-row">
                <div className="card-chip"></div>
                <div className="card-brand-badge">{getBrandDisplayName(cardBrand)}</div>
              </div>
              <div className="card-number-display">
                {cardNumber || (cardBrand === 'amex' ? '•••• •••••• •••••' : '•••• •••• •••• ••••')}
              </div>
              <div className="card-bottom-row">
                <div className="card-holder-col">
                  <span className="col-label">TITULAR</span>
                  <span className="col-val">{cardHolder || 'NOMBRE APELLIDO'}</span>
                </div>
                <div className="card-expiry-col">
                  <span className="col-label">VENCE</span>
                  <span className="col-val">{cardExpiry || 'MM/AA'}</span>
                </div>
              </div>
            </div>

            {/* Reverso de la Tarjeta */}
            <div className={`virtual-card card-back brand-${cardBrand}`}>
              <div className="magnetic-bar"></div>
              <div className="cvv-band">
                <span className="cvv-label">{cardBrand === 'amex' ? 'CID (4 dígitos)' : 'CVV / CVC'}</span>
                <span className="cvv-val">{cardCvv ? (cardBrand === 'amex' ? '••••' : '•••') : (cardBrand === 'amex' ? '1234' : '123')}</span>
              </div>
              <p className="card-security-note">Firma autorizada. No compartir código con terceros.</p>
            </div>
          </div>

          {/* Formulario de Entrada de Tarjeta */}
          <div className="card-form-grid">
            <div className="form-group full-width">
              <label htmlFor="input-card-num" className="field-label">Número de Tarjeta</label>
              <div className="input-with-icon">
                <input
                  id="input-card-num"
                  type="text"
                  className="gateway-input"
                  placeholder={cardBrand === 'amex' ? '3782 822468 98210' : '4152 7890 1234 9812'}
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  maxLength={19}
                  inputMode="numeric"
                />
                <span className="field-icon-brand">{getBrandDisplayName(cardBrand)}</span>
              </div>
            </div>

            <div className="form-group full-width">
              <label htmlFor="input-card-holder" className="field-label">Nombre del Titular (como aparece en el plástico)</label>
              <input
                id="input-card-holder"
                type="text"
                className="gateway-input"
                placeholder="JUAN PEREZ GARCIA"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
              />
            </div>

            <div className="form-group half-width">
              <label htmlFor="input-card-exp" className="field-label">Vencimiento</label>
              <input
                id="input-card-exp"
                type="text"
                className="gateway-input"
                placeholder="MM/AA"
                value={cardExpiry}
                onChange={handleExpiryChange}
                maxLength={5}
                inputMode="numeric"
              />
            </div>

            <div className="form-group half-width">
              <label htmlFor="input-card-cvv" className="field-label">
                {cardBrand === 'amex' ? 'Código CID (4 dígitos)' : 'Código CVV (3 dígitos)'}
              </label>
              <input
                id="input-card-cvv"
                type="password"
                className="gateway-input"
                placeholder={cardBrand === 'amex' ? '1234' : '123'}
                value={cardCvv}
                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                onFocus={() => setIsFlipped(true)}
                onBlur={() => setIsFlipped(false)}
                maxLength={4}
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="card-type-toggle">
            <label className="radio-pill">
              <input
                type="radio"
                name="cardSubtype"
                value="TARJETA_CREDITO"
                checked={selectedMethod === 'TARJETA_CREDITO'}
                onChange={() => setSelectedMethod('TARJETA_CREDITO')}
              />
              <span>Tarjeta de Crédito</span>
            </label>
            <label className="radio-pill">
              <input
                type="radio"
                name="cardSubtype"
                value="TARJETA_DEBITO"
                checked={selectedMethod === 'TARJETA_DEBITO'}
                onChange={() => setSelectedMethod('TARJETA_DEBITO')}
              />
              <span>Tarjeta de Débito</span>
            </label>
          </div>
        </div>
      )}

      {/* CONTENIDO 2: OXXO PAY */}
      {selectedMethod === 'OXXO_EFECTIVO' && (
        <div className="gateway-content oxxo-panel">
          <div className="oxxo-ticket">
            <div className="oxxo-ticket-header">
              <div className="oxxo-brand">OXXO Pay</div>
              <span className="oxxo-badge">Ficha Digital de Pago</span>
            </div>

            <p className="oxxo-instructions">
              Acude a cualquier tienda OXXO de la República Mexicana y dile al cajero que realizarás un pago de servicio con esta referencia:
            </p>

            <div className="oxxo-reference-box">
              <span className="ref-title">REFERENCIA DE PAGO (14 DÍGITOS)</span>
              <div className="ref-number">{oxxoRef}</div>
              <button
                type="button"
                className="btn-copy-ref"
                onClick={() => copyToClipboard(oxxoRef)}
              >
                Copiar Referencia
              </button>
            </div>

            {/* Simulación Gráfica de Código de Barras */}
            <div className="oxxo-barcode">
              <div className="barcode-lines">
                <span style={{ width: '3px' }}></span>
                <span style={{ width: '1px' }}></span>
                <span style={{ width: '4px' }}></span>
                <span style={{ width: '2px' }}></span>
                <span style={{ width: '5px' }}></span>
                <span style={{ width: '1px' }}></span>
                <span style={{ width: '3px' }}></span>
                <span style={{ width: '2px' }}></span>
                <span style={{ width: '4px' }}></span>
                <span style={{ width: '1px' }}></span>
                <span style={{ width: '6px' }}></span>
                <span style={{ width: '2px' }}></span>
                <span style={{ width: '3px' }}></span>
                <span style={{ width: '1px' }}></span>
                <span style={{ width: '5px' }}></span>
                <span style={{ width: '3px' }}></span>
                <span style={{ width: '2px' }}></span>
                <span style={{ width: '4px' }}></span>
                <span style={{ width: '1px' }}></span>
                <span style={{ width: '5px' }}></span>
                <span style={{ width: '2px' }}></span>
                <span style={{ width: '3px' }}></span>
              </div>
              <span className="barcode-num">{oxxoRef.replace(/\s+/g, '')}</span>
            </div>

            <div className="oxxo-terms">
              <div className="term-item">
                <strong>Vigencia:</strong> 48 horas a partir del momento de tu orden.
              </div>
              <div className="term-item">
                <strong>Comisión en caja:</strong> $15.00 MXN cobrados por la tienda OXXO.
              </div>
              <div className="term-item">
                <strong>Acreditación:</strong> En menos de 5 minutos tras pagar.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO 3: MERCADO PAGO / PAYPAL */}
      {selectedMethod === 'MERCADO_PAGO' && (
        <div className="gateway-content digital-wallet-panel">
          <div className="wallet-options-toggle">
            <button
              type="button"
              className={`wallet-btn ${walletType === 'MERCADO_PAGO' ? 'active' : ''}`}
              onClick={() => setWalletType('MERCADO_PAGO')}
            >
              <span style={{ fontSize: '1.2rem' }}>🔵</span> Mercado Pago
            </button>
            <button
              type="button"
              className={`wallet-btn ${walletType === 'PAYPAL' ? 'active' : ''}`}
              onClick={() => setWalletType('PAYPAL')}
            >
              <span style={{ fontSize: '1.2rem' }}>🅿️</span> PayPal
            </button>
          </div>

          {walletType === 'MERCADO_PAGO' ? (
            <div className="wallet-card mp-style">
              <div className="wallet-card-header">
                <h4>Mercado Pago Checkout Pro</h4>
                <span className="mp-pill">Acreditación Inmediata</span>
              </div>
              <p>Paga con tu saldo de Mercado Pago, tarjeta de débito/crédito guardada o Mercado Crédito sin compartir tus datos financieros.</p>
              <ul className="wallet-perks">
                <li>✓ Dinero en cuenta protegido por Mercado Libre</li>
                <li>✓ Hasta 12 meses sin tarjeta</li>
                <li>✓ Notificación instantánea de acreditación</li>
              </ul>
              <div className="sandbox-demo-box">
                <span className="badge-demo">MODO PRUEBA INTEGRADO</span>
                <span>Cuenta demo vinculada: <strong>comprador@bibliotech.mx</strong></span>
              </div>
            </div>
          ) : (
            <div className="wallet-card pp-style">
              <div className="wallet-card-header">
                <h4>PayPal Checkout Express</h4>
                <span className="pp-pill">Protección al Comprador</span>
              </div>
              <p>Usa tu cuenta de PayPal para pagar en moneda nacional o extranjera con protección completa en envíos y devoluciones.</p>
              <ul className="wallet-perks">
                <li>✓ Cero comisiones adicionales al comprador</li>
                <li>✓ Soporte para cuentas bancarias internacionales</li>
                <li>✓ Protección antifraude 24/7</li>
              </ul>
              <div className="sandbox-demo-box">
                <span className="badge-demo">PAYPAL SANDBOX</span>
                <span>Listo para autorizar token con un solo clic</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONTENIDO 4: SPEI (TRANSFERENCIA BANCARIA) */}
      {selectedMethod === 'TRANSFERENCIA_SPEI' && (
        <div className="gateway-content spei-panel">
          <div className="spei-card">
            <h4>Transferencia Interbancaria SPEI</h4>
            <p className="spei-subtitle">Realiza tu transferencia desde la app de tu banco móvil favorito (BBVA, Santander, Banorte, Nu, etc.).</p>

            <div className="spei-data-table">
              <div className="data-row">
                <span className="data-key">Banco Destino:</span>
                <span className="data-val"><strong>STP (Sistema de Transferencias y Pagos)</strong></span>
              </div>
              <div className="data-row">
                <span className="data-key">Beneficiario:</span>
                <span className="data-val">BiblioTech Store S.A. de C.V.</span>
              </div>
              <div className="data-row highlight">
                <span className="data-key">CLABE Interbancaria:</span>
                <div className="clabe-copy-group">
                  <span className="clabe-code">{clabeInterbancaria}</span>
                  <button
                    type="button"
                    className="btn-copy-small"
                    onClick={() => copyToClipboard(clabeInterbancaria)}
                  >
                    {copiedClabe ? '¡Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
              <div className="data-row">
                <span className="data-key">Concepto de Pago:</span>
                <span className="data-val">Compra Libros BiblioTech</span>
              </div>
            </div>

            <div className="spei-alert">
              ℹ️ Las transferencias SPEI no tienen comisión y se acreditan automáticamente en un lapso de 1 a 10 minutos.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
