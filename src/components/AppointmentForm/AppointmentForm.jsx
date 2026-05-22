// ============================================
//  AppointmentForm.jsx — Mikael Barber
// ============================================

import { useState, useEffect } from 'react';
import { appointmentService, productService } from '../../services/api';
import './AppointmentForm.css';

// Cortes com valor fixo
const CUTS = [
  { label: 'Degradê',      price: 20 },
  { label: 'Corte Social', price: 17 },
  { label: 'Barba',        price: 15 },
  { label: 'Sobrancelha',  price: 5  },
  { label: 'Alisamento',   price: 25 },
  { label: 'Luzes',        price: 70 },
  { label: 'Nevou',        price: 90 },
  { label: 'Reflexo',      price: 80 },
  { label: 'Selagem',      price: 70 },
  { label: 'Botox',        price: 30 },
  { label: 'Barboterapia', price: 25 },
];

const EMPTY_FORM = { clientName: '', clientPhone: '', cut: '', price: '', status: 'done', obs: '' };
const EMPTY_CONS = { name: '', price: '' };

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2)  return digits.length ? `(${digits}` : '';
  if (digits.length <= 7)  return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
  return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
}

export default function AppointmentForm({ barberName, onSaved }) {
  const [form, setForm]               = useState(EMPTY_FORM);
  // consumable shape: { name, price, qty, productId (null = manual) }
  const [consumables, setConsumables] = useState([]);
  const [consInput, setConsInput]     = useState(EMPTY_CONS);
  const [errors, setErrors]           = useState({});
  const [saving, setSaving]           = useState(false);
  const [apiError, setApiError]       = useState('');
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [showCatalog, setShowCatalog] = useState(false);

  // Carrega produtos cadastrados
  useEffect(() => {
    productService.getAll()
      .then((data) => setCatalogProducts(data.products || []))
      .catch(() => {}); // silencioso — catálogo é opcional
  }, []);

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    if (apiError) setApiError('');
  };

  // Ao selecionar o corte, preenche o preço automaticamente
  const handleCutChange = (e) => {
    const label = e.target.value;
    const found = CUTS.find((c) => c.label === label);
    set('cut', label);
    if (found) set('price', String(found.price));
  };

  // Soma: preço × quantidade de cada consumível
  const consTotal  = consumables.reduce((sum, c) => sum + parseFloat(c.price || 0) * (c.qty || 1), 0);
  const grandTotal = parseFloat(form.price || 0) + consTotal;

  // Adiciona consumível manual
  const addConsumable = (name = consInput.name, price = consInput.price) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setConsumables((prev) => [...prev, { name: trimmed, price: price || '0', qty: 1, productId: null }]);
    setConsInput(EMPTY_CONS);
  };

  // Adiciona produto do catálogo — incrementa qty se já estiver na lista
  const addFromCatalog = (product) => {
    setConsumables((prev) => {
      const existingIdx = prev.findIndex((c) => c.productId === product.id);
      if (existingIdx >= 0) {
        // Verifica se há estoque suficiente
        const currentQty = prev[existingIdx].qty;
        const catalogItem = catalogProducts.find((p) => p.id === product.id);
        const availableStock = catalogItem?.stock ?? Infinity;
        if (currentQty >= availableStock) return prev; // não incrementa além do estoque
        return prev.map((c, i) =>
          i === existingIdx ? { ...c, qty: c.qty + 1 } : c
        );
      }
      return [
        ...prev,
        { name: product.name, price: String(product.price), qty: 1, productId: product.id },
      ];
    });
  };

  // Altera a quantidade de um consumível (+1 / -1)
  const changeQty = (index, delta) => {
    setConsumables((prev) =>
      prev.map((c, i) => {
        if (i !== index) return c;
        const newQty = Math.max(1, (c.qty || 1) + delta);
        // Para itens do catálogo, não ultrapassar o estoque disponível
        if (c.productId) {
          const catalogItem = catalogProducts.find((p) => p.id === c.productId);
          const maxStock = catalogItem?.stock ?? Infinity;
          return { ...c, qty: Math.min(newQty, maxStock) };
        }
        return { ...c, qty: newQty };
      })
    );
  };

  const removeConsumable = (index) =>
    setConsumables((prev) => prev.filter((_, i) => i !== index));

  const validate = () => {
    const e = {};
    if (!form.clientName.trim()) e.clientName = 'Obrigatório';
    if (!form.cut)               e.cut        = 'Selecione um corte';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setSaving(true);
    setApiError('');

    try {
      const payload = {
        clientName:   form.clientName.trim(),
        clientPhone:  form.clientPhone.trim(),
        cut:          form.cut,
        servicePrice: parseFloat(form.price || 0),
        price:        grandTotal.toFixed(2),
        consumables:  consumables.map((c) => ({
          name:      c.name,
          price:     c.price,
          qty:       c.qty || 1,
          productId: c.productId || null,
        })),
        obs:    form.obs.trim(),
        status: form.status,
      };

      const data = await appointmentService.create(payload);

      // ── Atualiza estoque dos produtos do catálogo ──────────────────
      const stockUpdates = consumables.filter((c) => c.productId);
      if (stockUpdates.length > 0) {
        await Promise.all(
          stockUpdates.map(async (c) => {
            const catalogItem = catalogProducts.find((p) => p.id === c.productId);
            if (!catalogItem) return;
            const newStock = Math.max(0, (catalogItem.stock || 0) - (c.qty || 1));
            try {
              await productService.update(c.productId, { ...catalogItem, stock: newStock });
              // Atualiza estado local do catálogo para refletir o novo estoque
              setCatalogProducts((prev) =>
                prev.map((p) => p.id === c.productId ? { ...p, stock: newStock } : p)
              );
            } catch {
              // Falha silenciosa no estoque — o atendimento já foi salvo
            }
          })
        );
      }
      // ──────────────────────────────────────────────────────────────

      onSaved(data.appointment);
      setForm(EMPTY_FORM);
      setConsumables([]);
      setConsInput(EMPTY_CONS);
      setErrors({});
      setShowCatalog(false);
    } catch (err) {
      setApiError(err.message || 'Erro ao registrar atendimento. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const isValid = form.clientName.trim() && form.cut && !saving;

  return (
    <div className="appt-form-card fade-in">

      {/* Erro de API */}
      {apiError && (
        <div className="form-api-error" role="alert">
          <i className="ti ti-alert-triangle" aria-hidden="true" />
          {apiError}
        </div>
      )}

      {/* ── Dados do cliente ── */}
      <div className="form-row">
        <div>
          <label className="field-label field-label--required" htmlFor="f-name">
            <i className="ti ti-user" aria-hidden="true" />
            Nome do Cliente
          </label>
          <input
            id="f-name"
            className={`field-input${errors.clientName ? ' error' : ''}`}
            type="text"
            placeholder="Ex: João Silva"
            value={form.clientName}
            onChange={(e) => set('clientName', e.target.value)}
            autoComplete="off"
            aria-required="true"
            aria-invalid={!!errors.clientName}
          />
          {errors.clientName && (
            <span className="field-error" role="alert">{errors.clientName}</span>
          )}
        </div>

        <div>
          <label className="field-label" htmlFor="f-phone">
            <i className="ti ti-brand-whatsapp" aria-hidden="true" />
            WhatsApp
          </label>
          <input
            id="f-phone"
            className="field-input"
            type="tel"
            placeholder="(11) 99999-9999"
            value={form.clientPhone}
            onChange={(e) => set('clientPhone', formatPhone(e.target.value))}
            autoComplete="off"
          />
        </div>
      </div>

      {/* ── Corte e Preço ── */}
      <div className="form-row">
        <div>
          <label className="field-label field-label--required" htmlFor="f-cut">
            <i className="ti ti-scissors" aria-hidden="true" />
            Tipo de Corte
          </label>
          <select
            id="f-cut"
            className={`field-select${errors.cut ? ' error' : ''}`}
            value={form.cut}
            onChange={handleCutChange}
            aria-required="true"
            aria-invalid={!!errors.cut}
          >
            <option value="">Selecionar corte...</option>
            {CUTS.map((c) => (
              <option key={c.label} value={c.label}>
                {c.label} — R$ {c.price},00
              </option>
            ))}
          </select>
          {errors.cut && (
            <span className="field-error" role="alert">{errors.cut}</span>
          )}
        </div>

        <div>
          <label className="field-label" htmlFor="f-price">
            <i className="ti ti-currency-dollar" aria-hidden="true" />
            Valor do Serviço (R$)
          </label>
          <input
            id="f-price"
            className="field-input"
            type="number"
            placeholder="0,00"
            min="0"
            step="0.50"
            value={form.price}
            onChange={(e) => set('price', e.target.value)}
          />
        </div>
      </div>

      {/* ── Status ── */}
      <div className="form-row form-row--single">
        <div>
          <label className="field-label" htmlFor="f-status">
            <i className="ti ti-flag" aria-hidden="true" />
            Status
          </label>
          <select
            id="f-status"
            className="field-select"
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
          >
            <option value="done">Concluído</option>
            <option value="pending">Pendente</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      </div>

      {/* ── Consumíveis ── */}
      <div className="consumables-section">
        <div className="consumables-section__header">
          <div className="field-label">
            <i className="ti ti-package" aria-hidden="true" />
            Consumíveis e Produtos
          </div>
          {catalogProducts.length > 0 && (
            <button
              type="button"
              className="catalog-toggle-btn"
              onClick={() => setShowCatalog((v) => !v)}
              aria-expanded={showCatalog}
            >
              <i className={`ti ${showCatalog ? 'ti-chevron-up' : 'ti-layout-grid'}`} aria-hidden="true" />
              {showCatalog ? 'Fechar catálogo' : 'Ver catálogo'}
            </button>
          )}
        </div>

        {/* Catálogo de produtos cadastrados */}
        {showCatalog && catalogProducts.length > 0 && (
          <div className="catalog-grid">
            {catalogProducts.map((p) => {
              const inCart = consumables.find((c) => c.productId === p.id);
              const outOfStock = p.stock <= 0;
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`catalog-product-btn${inCart ? ' catalog-product-btn--active' : ''}${outOfStock ? ' catalog-product-btn--disabled' : ''}`}
                  onClick={() => !outOfStock && addFromCatalog(p)}
                  disabled={outOfStock}
                  title={
                    outOfStock
                      ? `${p.name} — sem estoque`
                      : `Adicionar ${p.name} — R$ ${parseFloat(p.price).toFixed(2)}`
                  }
                >
                  <span className="catalog-product-btn__name">{p.name}</span>
                  <span className="catalog-product-btn__price">
                    R$ {parseFloat(p.price).toFixed(2)}
                  </span>

                  <span className="catalog-product-btn__stock-row">
                    {outOfStock ? (
                      <span className="catalog-product-btn__out">sem estoque</span>
                    ) : p.stock <= 2 ? (
                      <span className="catalog-product-btn__low" title="Estoque baixo">
                        <i className="ti ti-alert-triangle" aria-hidden="true" />
                        {p.stock} restante{p.stock !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="catalog-product-btn__stock-ok">
                        {p.stock} em estoque
                      </span>
                    )}

                    {/* Badge de quantidade no carrinho */}
                    {inCart && (
                      <span className="catalog-product-btn__cart-badge">
                        ×{inCart.qty}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Lista de consumíveis adicionados */}
        {consumables.length > 0 && (
          <div className="consumables-list">
            {consumables.map((c, i) => (
              <div className="consumable-row" key={i}>
                {/* Botão remover */}
                <button
                  className="consumable-tag__remove"
                  onClick={() => removeConsumable(i)}
                  aria-label={`Remover ${c.name}`}
                >
                  <i className="ti ti-x" aria-hidden="true" />
                </button>

                {/* Nome */}
                <span className="consumable-row__name">
                  <i className="ti ti-sparkles" aria-hidden="true" />
                  {c.name}
                </span>

                {/* Controles de quantidade */}
                <div className="consumable-qty" aria-label={`Quantidade de ${c.name}`}>
                  <button
                    className="consumable-qty__btn"
                    onClick={() => changeQty(i, -1)}
                    disabled={(c.qty || 1) <= 1}
                    aria-label="Diminuir quantidade"
                  >
                    <i className="ti ti-minus" aria-hidden="true" />
                  </button>
                  <span className="consumable-qty__value">{c.qty || 1}</span>
                  <button
                    className="consumable-qty__btn"
                    onClick={() => changeQty(i, +1)}
                    aria-label="Aumentar quantidade"
                  >
                    <i className="ti ti-plus" aria-hidden="true" />
                  </button>
                </div>

                {/* Preço total do item (unitário × qty) */}
                <span className="consumable-row__price">
                  R$ {(parseFloat(c.price) * (c.qty || 1)).toFixed(2)}
                  {(c.qty || 1) > 1 && (
                    <span className="consumable-row__unit-price">
                      {' '}(R$ {parseFloat(c.price).toFixed(2)} × {c.qty})
                    </span>
                  )}
                </span>
              </div>
            ))}

            <div className="consumables-subtotal">
              <span>Subtotal consumíveis:</span>
              <span className="subtotal-valor">R$ {consTotal.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Adição manual */}
        <div className="consumables-add-row">
          <input
            className="consumables-add-input consumables-add-input--name"
            placeholder="Nome do produto..."
            value={consInput.name}
            onChange={(e) => setConsInput((p) => ({ ...p, name: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && addConsumable()}
            aria-label="Nome do consumível"
          />
          <input
            className="consumables-add-input consumables-add-input--price"
            type="number"
            placeholder="R$ 0,00"
            min="0"
            step="0.50"
            value={consInput.price}
            onChange={(e) => setConsInput((p) => ({ ...p, price: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && addConsumable()}
            aria-label="Preço do consumível"
          />
          <button className="consumables-add-btn" onClick={() => addConsumable()}>
            <i className="ti ti-plus" aria-hidden="true" />
            <span>Adicionar</span>
          </button>
        </div>
      </div>

      {/* ── Observações ── */}
      <div className="appt-form-obs">
        <label className="field-label" htmlFor="f-obs">
          <i className="ti ti-notes" aria-hidden="true" />
          Observações
        </label>
        <textarea
          id="f-obs"
          className="field-textarea"
          placeholder="Ex: Cliente pediu franja mais curta, prefere pomada fosca..."
          value={form.obs}
          onChange={(e) => set('obs', e.target.value)}
          rows={3}
        />
      </div>

      {/* ── Resumo do total ── */}
      {(form.price || consTotal > 0) && (
        <div className="price-summary">
          {form.price && (
            <div className="price-summary__row">
              <span>Serviço</span>
              <span>R$ {parseFloat(form.price || 0).toFixed(2)}</span>
            </div>
          )}
          {consTotal > 0 && (
            <div className="price-summary__row">
              <span>Consumíveis</span>
              <span>R$ {consTotal.toFixed(2)}</span>
            </div>
          )}
          <div className="price-summary__row price-summary__row--total">
            <span>Total</span>
            <span>R$ {grandTotal.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div className="appt-form-footer">
        <button
          className="appt-save-btn"
          onClick={handleSave}
          disabled={!isValid}
          aria-busy={saving}
        >
          {saving ? (
            <>
              <i className="ti ti-loader-2 spin" aria-hidden="true" />
              Salvando…
            </>
          ) : (
            <>
              <i className="ti ti-device-floppy" aria-hidden="true" />
              Registrar Atendimento
            </>
          )}
        </button>

        <p className="appt-form-hint">
          <i className="ti ti-info-circle" aria-hidden="true" />
          Campos com <span style={{ color: 'var(--red-light)' }}>*</span> são obrigatórios
        </p>
      </div>

    </div>
  );
}