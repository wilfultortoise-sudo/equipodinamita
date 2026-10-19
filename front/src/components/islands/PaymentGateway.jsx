import { useState, useEffect } from 'react';

// 17 Escenarios Oficiales de Prueba de Mercado Pago Checkout API (test/cards)
const MP_TEST_SCENARIOS = [
  { code: 'APRO', label: 'Pago Aprobado', desc: 'Acreditado exitosamente' },
  { code: 'FUND', label: 'Importe Insuficiente', desc: 'cc_rejected_insufficient_amount' },
  { code: 'CALL', label: 'Validar para Autorizar', desc: 'cc_rejected_call_for_authorize' },
  { code: 'SECU', label: 'CVV Inválido', desc: 'cc_rejected_bad_filled_security_code' },
  { code: 'EXPI', label: 'Fecha Vencida', desc: 'cc_rejected_bad_filled_date' },
  { code: 'FORM', label: 'Error Formulario', desc: 'cc_rejected_bad_filled_other' },
  { code: 'OTHE', label: 'Error General', desc: 'cc_rejected_other' },
  { code: 'CONT', label: 'Pendiente Contingencia', desc: 'pending_contingency' },
  { code: 'CARD', label: 'Tarjeta Inválida', desc: 'cc_rejected_bad_filled_card_number' },
  { code: 'INST', label: 'Cuotas No Válidas', desc: 'cc_rejected_invalid_installments' },
  { code: 'DUPL', label: 'Pago Duplicado', desc: 'cc_rejected_duplicated_payment' },
  { code: 'LOCK', label: 'Tarjeta Bloqueada', desc: 'cc_rejected_card_disabled' },
  { code: 'CTNA', label: 'Tipo No Permitido', desc: 'cc_rejected_card_type_not_allowed' },
  { code: 'ATTE', label: 'Superó Intentos PIN', desc: 'cc_rejected_max_attempts' },
  { code: 'BLAC', label: 'Lista Negra / Fraude', desc: 'cc_rejected_blacklist' },
  { code: 'UNSU', label: 'No Soportada', desc: 'cc_rejected_unsupported_operation' },
  { code: 'TEST', label: 'Reglas de Monto', desc: 'pending_review_manual' }
];

const MP_TEST_CARDS = [
  { label: 'Visa Prueba', num: '4075 5957 1648 3764', exp: '11/30', cvv: '123' },
  { label: 'Mastercard Prueba', num: '5474 9254 3267 0366', exp: '11/30', cvv: '123' },
  { label: 'Amex Prueba', num: '3711 803032 57522', exp: '11/30', cvv: '1234' }
];

export default function PaymentGateway() {
  // Pestañas independientes: TARJETA_CREDITO (tarjeta bancaria directa) y MERCADO_PAGO (pasarela con card token y webhook)
  const [selectedMethod, setSelectedMethod] = useState('TARJETA_CREDITO');
  const [cardSubtype, setCardSubtype] = useState('TARJETA_CREDITO'); // TARJETA_CREDITO o TARJETA_DEBITO
  
  // Estados para Tarjeta (Mercado Pago Custom Checkout)
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardBrand, setCardBrand] = useState('generic'); // visa, mastercard, amex, generic
  const [generatedToken, setGeneratedToken] = useState(null);

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
      const parts = [];
      if (val.length > 0) parts.push(val.slice(0, 4));
      if (val.length > 4) parts.push(val.slice(4, 10));
      if (val.length > 10) parts.push(val.slice(10, 15));
      formatted = parts.join(' ');
    } else {
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

  // Límite dinámico del código de seguridad: 4 dígitos para American Express (CID), 3 dígitos para Visa/Mastercard (CVV)
  const maxCvvDigits = cardBrand === 'amex' ? 4 : 3;

  // Ajustar automáticamente el código de seguridad si cambia la marca de tarjeta
  useEffect(() => {
    if (cardBrand !== 'amex' && cardCvv.length > 3) {
      setCardCvv((prev) => prev.slice(0, 3));
    }
  }, [cardBrand]);

  const handleCvvChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, maxCvvDigits);
    setCardCvv(val);
  };

  const handleCardHolderChange = (e) => {
    const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').toUpperCase();
    setCardHolder(val);
  };

  // Auto-prellenar titular desde la sesión del usuario si está disponible
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem('auth_user');
        if (raw) {
          const u = JSON.parse(raw);
          if (u?.nombre) {
            setCardHolder((prev) => prev || u.nombre.toUpperCase());
          }
        }
      } catch {}
    }
  }, []);

  // Validación de campos y generación de Token de Mercado Pago
  useEffect(() => {
    let detallesPago = {};
    let referenciaPago = null;
    let isCardValid = true;
    let cardError = null;
    let token = null;

    if (selectedMethod === 'MERCADO_PAGO' || selectedMethod === 'TARJETA_CREDITO' || selectedMethod === 'TARJETA_DEBITO') {
      const cleanNum = cardNumber.replace(/\s+/g, '');
      const isAmexCard = cleanNum.startsWith('3');
      const expectedCardLen = isAmexCard ? 15 : 16;
      const expectedCvvLen = isAmexCard ? 4 : 3;
      const cleanExp = cardExpiry.trim();
      const cleanCvv = cardCvv.trim();

      if (cleanNum.length !== expectedCardLen) {
        isCardValid = false;
        cardError = isAmexCard 
          ? `El número de tarjeta American Express debe tener exactamente 15 dígitos (formato 4-6-5). Llevas ${cleanNum.length}.` 
          : `El número de tarjeta debe tener exactamente 16 dígitos. Llevas ${cleanNum.length}.`;
      } else if (!cardHolder.trim() || cardHolder.trim().length < 3) {
        isCardValid = false;
        cardError = 'Ingresa el nombre completo del titular como figura en el plástico.';
      } else if (!/^\d{2}\/\d{2}$/.test(cleanExp)) {
        isCardValid = false;
        cardError = 'La fecha de vencimiento debe tener el formato MM/AA (ej. 12/28).';
      } else if (cleanCvv.length !== expectedCvvLen) {
        isCardValid = false;
        cardError = isAmexCard
          ? `El código de seguridad CID para American Express debe tener exactamente 4 dígitos (tienes ${cleanCvv.length}).`
          : `El código de seguridad CVV debe tener exactamente 3 dígitos (tienes ${cleanCvv.length}).`;
      }

      const last4 = cleanNum.slice(-4) || '••••';

      if (selectedMethod === 'MERCADO_PAGO') {
        // Pasarela Mercado Pago: generación de Card Token (PCI-DSS)
        if (isCardValid) {
          const [mes, anio] = cleanExp.includes('/') ? cleanExp.split('/') : ['', ''];
          const tokenPayload = {
            cardNumber: cleanNum,
            cardholderName: cardHolder.trim().toUpperCase(),
            expirationMonth: parseInt(mes, 10),
            expirationYear: 2000 + parseInt(anio, 10),
            securityCode: cleanCvv,
            brand: cardBrand,
            gateway: 'MERCADO_PAGO',
            timestamp: Date.now()
          };
          token = `tok_mp_${btoa(unescape(encodeURIComponent(JSON.stringify(tokenPayload))))}`;
          setGeneratedToken(token);
        } else {
          setGeneratedToken(null);
        }

        detallesPago = {
          pasarela: 'MERCADO_PAGO',
          marca: cardBrand === 'amex' ? 'AMERICAN EXPRESS' : (cardBrand === 'generic' ? 'TARJETA BANCARIA' : cardBrand.toUpperCase()),
          ultimos4: last4,
          titular: cardHolder || 'NO ESPECIFICADO',
          subtipo: cardSubtype,
          tokenTarjeta: token
        };
        referenciaPago = `MP-TOK-${last4}`;
      } else {
        // Tarjeta Bancaria Directa (sin intermediación de Mercado Pago)
        setGeneratedToken(null);
        detallesPago = {
          pasarela: 'TARJETA_BANCARIA',
          banco: 'EMISOR BANCARIO NACIONAL',
          marca: cardBrand === 'amex' ? 'AMERICAN EXPRESS' : (cardBrand === 'generic' ? 'TARJETA BANCARIA' : cardBrand.toUpperCase()),
          ultimos4: last4,
          titular: cardHolder || 'NO ESPECIFICADO',
          subtipo: cardSubtype
        };
        referenciaPago = `CARD-${last4}`;
      }
    } else if (selectedMethod === 'OXXO_EFECTIVO') {
      detallesPago = {
        tienda: 'OXXO Pay',
        comision: 15.0,
        vigencia: '48 horas'
      };
      referenciaPago = `OXXO-${oxxoRef.replace(/\s+/g, '')}`;
    } else if (selectedMethod === 'PAYPAL') {
      detallesPago = {
        billetera: 'PAYPAL',
        modo: 'Acreditación Inmediata Digital'
      };
      referenciaPago = `PAYPAL-DIGITAL-${Date.now().toString(36).toUpperCase()}`;
    } else if (selectedMethod === 'TRANSFERENCIA_SPEI') {
      detallesPago = {
        banco: 'STP / BiblioTech',
        clabe: clabeInterbancaria
      };
      referenciaPago = `SPEI-${Date.now().toString().slice(-6)}`;
    }

    const metodoFinal = selectedMethod === 'TARJETA_CREDITO' ? cardSubtype : selectedMethod;

    const payload = {
      metodoPago: metodoFinal,
      detallesPago: JSON.stringify(detallesPago),
      referenciaPago,
      isCardValid,
      cardError,
      tokenTarjeta: token
    };

    window.dispatchEvent(new CustomEvent('payment-method-changed', { detail: payload }));
  }, [selectedMethod, cardSubtype, cardNumber, cardHolder, cardBrand, oxxoRef, cardExpiry, cardCvv]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text.replace(/\s+/g, ''));
    setCopiedClabe(true);
    if (window.showToast) {
      window.showToast('CLABE copiada al portapapeles', 'success');
    }
    setTimeout(() => setCopiedClabe(false), 2500);
  };

  const applyTestCard = (card) => {
    setCardNumber(card.num);
    setCardExpiry(card.exp);
    setCardCvv(card.cvv);
  };

  const applyScenario = (sc) => {
    setCardHolder(sc.code);
    if (!cardNumber) {
      setCardNumber('4075 5957 1648 3764');
      setCardExpiry('11/30');
      setCardCvv('123');
    }
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

      {/* Pestañas de Selección: 5 Métodos Independientes */}
      <div className="gateway-tabs">
        <button
          type="button"
          className={`gateway-tab ${selectedMethod === 'TARJETA_CREDITO' ? 'active' : ''}`}
          onClick={() => setSelectedMethod('TARJETA_CREDITO')}
        >
          <span className="tab-icon">💳</span>
          <span className="tab-label">Tarjeta Bancaria</span>
        </button>

        <button
          type="button"
          className={`gateway-tab ${selectedMethod === 'MERCADO_PAGO' ? 'active' : ''}`}
          onClick={() => setSelectedMethod('MERCADO_PAGO')}
        >
          <span className="tab-icon">💙</span>
          <span className="tab-label">Mercado Pago</span>
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
          className={`gateway-tab ${selectedMethod === 'TRANSFERENCIA_SPEI' ? 'active' : ''}`}
          onClick={() => setSelectedMethod('TRANSFERENCIA_SPEI')}
        >
          <span className="tab-icon">🏦</span>
          <span className="tab-label">SPEI</span>
        </button>

        <button
          type="button"
          className={`gateway-tab ${selectedMethod === 'PAYPAL' ? 'active' : ''}`}
          onClick={() => setSelectedMethod('PAYPAL')}
        >
          <span className="tab-icon">🅿️</span>
          <span className="tab-label">PayPal</span>
        </button>
      </div>

      {/* CONTENIDO 1: TARJETA BANCARIA DIRECTA */}
      {selectedMethod === 'TARJETA_CREDITO' && (
        <div className="gateway-content card-payment-panel">
          <div className="bank-card-badge-row">
            <div className="mp-badge-title">
              <span className="bank-brand-logo">💳 Tarjeta Bancaria Directa</span>
              <span className="mp-subtitle">Pago directo con tarjeta de crédito o débito</span>
            </div>
            <div className="mp-features">
              <span className="feature-pill bank-pill">🏦 Cargo Bancario</span>
              <span className="feature-pill bank-pill">🔒 Cifrado 256-bit SSL</span>
            </div>
          </div>

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
              <p className="card-security-note">Firma autorizada. Transacción directa protegida por cifrado bancario SSL.</p>
            </div>
          </div>

          {/* Formulario de Entrada de Tarjeta Bancaria */}
          <div className="card-form-grid">
            <div className="form-group full-width">
              <label htmlFor="input-card-num-bank" className="field-label">
                Número de Tarjeta <span className="req-star">*</span>
              </label>
              <div className="input-with-icon">
                <input
                  id="input-card-num-bank"
                  type="text"
                  className="gateway-input"
                  placeholder={cardBrand === 'amex' ? '3782 822468 98210' : '4152 7890 1234 9812'}
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  maxLength={cardBrand === 'amex' ? 17 : 19}
                  inputMode="numeric"
                />
                <span className="field-icon-brand">{getBrandDisplayName(cardBrand)}</span>
              </div>
            </div>

            <div className="form-group full-width">
              <label htmlFor="input-card-holder-bank" className="field-label">
                Nombre del Titular (como figura en el plástico) <span className="req-star">*</span>
              </label>
              <input
                id="input-card-holder-bank"
                type="text"
                className="gateway-input"
                placeholder="JUAN PEREZ GARCIA"
                value={cardHolder}
                onChange={handleCardHolderChange}
              />
            </div>

            <div className="form-group half-width">
              <label htmlFor="input-card-exp-bank" className="field-label">
                Vencimiento <span className="req-star">*</span>
              </label>
              <input
                id="input-card-exp-bank"
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
              <label htmlFor="input-card-cvv-bank" className="field-label">
                {cardBrand === 'amex' ? 'Código CID (4 dígitos)' : 'Código CVV (3 dígitos)'} <span className="req-star">*</span>
              </label>
              <input
                id="input-card-cvv-bank"
                type="password"
                className="gateway-input"
                placeholder={cardBrand === 'amex' ? '1234' : '123'}
                value={cardCvv}
                onChange={handleCvvChange}
                onFocus={() => setIsFlipped(true)}
                onBlur={() => setIsFlipped(false)}
                maxLength={maxCvvDigits}
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="card-type-toggle">
            <label className="radio-pill">
              <input
                type="radio"
                name="cardSubtypeBank"
                value="TARJETA_CREDITO"
                checked={cardSubtype === 'TARJETA_CREDITO'}
                onChange={() => setCardSubtype('TARJETA_CREDITO')}
              />
              <span>Tarjeta de Crédito</span>
            </label>
            <label className="radio-pill">
              <input
                type="radio"
                name="cardSubtypeBank"
                value="TARJETA_DEBITO"
                checked={cardSubtype === 'TARJETA_DEBITO'}
                onChange={() => setCardSubtype('TARJETA_DEBITO')}
              />
              <span>Tarjeta de Débito</span>
            </label>
          </div>

          <div className="bank-secure-note">
            <span>🛡️</span>
            <span>Pago directo bancario con confirmación y emisión de folio inmediata.</span>
          </div>
        </div>
      )}

      {/* CONTENIDO 2: PASARELA MERCADO PAGO API CON CARD TOKEN & WEBHOOK */}
      {selectedMethod === 'MERCADO_PAGO' && (
        <div className="gateway-content card-payment-panel">
          <div className="mp-panel-badge-row">
            <div className="mp-badge-title">
              <span className="mp-brand-logo">💙 Pasarela Oficial Mercado Pago API</span>
              <span className="mp-subtitle">Formulario de Tarjeta con Card Token (PCI-DSS) & Webhook</span>
            </div>
            <div className="mp-features">
              <span className="feature-pill">🔒 Card Token (PCI-DSS)</span>
              <span className="feature-pill">⚡ Webhook Activo</span>
            </div>
          </div>

          {/* Tarjeta Virtual Animada Mercado Pago */}
          <div className={`virtual-card-wrapper ${isFlipped ? 'flipped' : ''}`}>
            {/* Frente de la Tarjeta */}
            <div className={`virtual-card card-front brand-${cardBrand}`}>
              <div className="card-top-row">
                <div className="card-chip"></div>
                <div className="card-brand-badge">{getBrandDisplayName(cardBrand)} • MP</div>
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
              <p className="card-security-note">Firma autorizada. Transacción protegida por pasarela Mercado Pago.</p>
            </div>
          </div>

          {/* Formulario de Entrada de Tarjeta para Mercado Pago */}
          <div className="card-form-grid">
            <div className="form-group full-width">
              <label htmlFor="input-card-num-mp" className="field-label">
                Número de Tarjeta <span className="req-star">*</span>
              </label>
              <div className="input-with-icon">
                <input
                  id="input-card-num-mp"
                  type="text"
                  className="gateway-input"
                  placeholder={cardBrand === 'amex' ? '3782 822468 98210' : '4152 7890 1234 9812'}
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  maxLength={cardBrand === 'amex' ? 17 : 19}
                  inputMode="numeric"
                />
                <span className="field-icon-brand">{getBrandDisplayName(cardBrand)}</span>
              </div>
            </div>

            <div className="form-group full-width">
              <label htmlFor="input-card-holder-mp" className="field-label">
                Nombre del Titular (como figura en el plástico) <span className="req-star">*</span>
              </label>
              <input
                id="input-card-holder-mp"
                type="text"
                className="gateway-input"
                placeholder="JUAN PEREZ GARCIA"
                value={cardHolder}
                onChange={handleCardHolderChange}
              />
            </div>

            <div className="form-group half-width">
              <label htmlFor="input-card-exp-mp" className="field-label">
                Vencimiento <span className="req-star">*</span>
              </label>
              <input
                id="input-card-exp-mp"
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
              <label htmlFor="input-card-cvv-mp" className="field-label">
                {cardBrand === 'amex' ? 'Código CID (4 dígitos)' : 'Código CVV (3 dígitos)'} <span className="req-star">*</span>
              </label>
              <input
                id="input-card-cvv-mp"
                type="password"
                className="gateway-input"
                placeholder={cardBrand === 'amex' ? '1234' : '123'}
                value={cardCvv}
                onChange={handleCvvChange}
                onFocus={() => setIsFlipped(true)}
                onBlur={() => setIsFlipped(false)}
                maxLength={maxCvvDigits}
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="card-type-toggle">
            <label className="radio-pill">
              <input
                type="radio"
                name="cardSubtypeMP"
                value="TARJETA_CREDITO"
                checked={cardSubtype === 'TARJETA_CREDITO'}
                onChange={() => setCardSubtype('TARJETA_CREDITO')}
              />
              <span>Tarjeta de Crédito</span>
            </label>
            <label className="radio-pill">
              <input
                type="radio"
                name="cardSubtypeMP"
                value="TARJETA_DEBITO"
                checked={cardSubtype === 'TARJETA_DEBITO'}
                onChange={() => setCardSubtype('TARJETA_DEBITO')}
              />
              <span>Tarjeta de Débito</span>
            </label>
          </div>

          {/* Indicador de Tokenización y Estado de Validación */}
          <div className={`token-status-box ${generatedToken ? 'token-ready' : 'token-pending'}`}>
            {generatedToken ? (
              <div className="token-info-content">
                <span className="token-icon">🔒</span>
                <div>
                  <strong>Card Token generado exitosamente para Mercado Pago:</strong>
                  <div className="token-string">{generatedToken.slice(0, 32)}...</div>
                  <span className="token-sub">Listo para transmitirse a la API del backend y procesar con Webhook (/webhook/mercadopago).</span>
                </div>
              </div>
            ) : (
              <div className="token-info-content">
                <span className="token-icon">ℹ️</span>
                <div>
                  <strong>Validación de campos:</strong>
                  <span className="token-sub">Completa los 16 dígitos (o 15 Amex), titular, expiración MM/AA y código de seguridad para generar el token.</span>
                </div>
              </div>
            )}
          </div>

          {/* Panel Interactivo de los 17 Escenarios Oficiales de Checkout API */}
          <div className="mp-sandbox-notice">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <strong>🧪 Checkout API — 17 Escenarios Oficiales de Prueba (test/cards):</strong>
                <div style={{ fontSize: '0.75rem', color: '#0369a1', marginTop: '0.15rem' }}>
                  Escribe la palabra clave en <strong>Nombre del Titular</strong> o haz clic en cualquiera de las siguientes para probar la respuesta del procesador:
                </div>
              </div>
            </div>

            <div className="quick-fill-row">
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0c4a6e', alignSelf: 'center' }}>Cargar tarjeta:</span>
              {MP_TEST_CARDS.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  className="quick-fill-btn"
                  onClick={() => applyTestCard(c)}
                >
                  💳 {c.label}
                </button>
              ))}
            </div>

            <div className="mp-scenarios-grid">
              {MP_TEST_SCENARIOS.map((sc) => {
                const isSelected = cardHolder.toUpperCase().includes(sc.code);
                return (
                  <button
                    key={sc.code}
                    type="button"
                    className={`mp-scenario-chip ${isSelected ? 'active' : ''}`}
                    onClick={() => applyScenario(sc)}
                    title={sc.desc}
                  >
                    <span className="chip-code">{sc.code}</span>
                    <span className="chip-label">{sc.label}</span>
                  </button>
                );
              })}
            </div>
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

      {/* CONTENIDO 3: SPEI (TRANSFERENCIA BANCARIA) */}
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

      {/* CONTENIDO 4: PAYPAL */}
      {selectedMethod === 'PAYPAL' && (
        <div className="gateway-content digital-wallet-panel">
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
              <span className="badge-demo">PAYPAL DIGITAL</span>
              <span>Listo para autorizar con un solo clic</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
