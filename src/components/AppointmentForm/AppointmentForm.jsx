// ============================================
//  AppointmentForm.jsx — Mikael Barber
// ============================================

import { useState } from 'react';
import { appointmentService } from '../../services/api';
import './AppointmentForm.css';

const CUTS = [
  'Degradê', 'Corte Social', 'Barba', 'Sobrancelha',
  'Alisamento', 'Luzes', 'Nevou', 'Reflexo',
  'Selagem', 'Botox', 'Barboterapia', 
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
  const [consumables, setConsumables] = useState([]);
  const [consInput, setConsInput]     = useState(EMPTY_CONS);
  const [errors, setErrors]           = useState({});
  const [saving, setSaving]           = useState(false);
  const [apiError, setApiError]       = useState('');

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    if (apiError) setApiError('');
  };

  const consTotal  = consumables.reduce((sum, c) => sum + parseFloat(c.price || 0), 0);
  const grandTotal = parseFloat(form.price || 0) + consTotal;

  const addConsumable = () => {
    const name = consInput.name.trim();
    if (!name) return;
    setConsumables((prev) => [...prev, { name, price: consInput.price || '0' }]);
    setConsInput(EMPTY_CONS);
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
        consumables,
        obs:          form.obs.trim(),
        status:       form.status,
      };

      const data = await appointmentService.create(payload);
      onSaved(data.appointment);
      setForm(EMPTY_FORM);
      setConsumables([]);
      setConsInput(EMPTY_CONS);
      setErrors({});
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
            onChange={(e) => set('cut', e.target.value)}
            aria-required="true"
            aria-invalid={!!errors.cut}
          >
            <option value="">Selecionar corte...</option>
            {CUTS.map((c) => <option key={c} value={c}>{c}</option>)}
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
        <div className="field-label">
          <i className="ti ti-package" aria-hidden="true" />
          Consumíveis e Produtos
        </div>

        {consumables.length > 0 && (
          <div className="consumables-list">
            {consumables.map((c, i) => (
              <div className="consumable-row" key={i}>
                <button
                  className="consumable-tag__remove"
                  onClick={() => removeConsumable(i)}
                  aria-label={`Remover ${c.name}`}
                >
                  <i className="ti ti-x" aria-hidden="true" />
                </button>
                <span className="consumable-row__name">
                  <i className="ti ti-sparkles" aria-hidden="true" />
                  {c.name}
                </span>
                <span className="consumable-row__price">
                  R$ {parseFloat(c.price).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="consumables-subtotal">
              <span>Subtotal consumíveis:</span>
              <span className="subtotal-valor">R$ {consTotal.toFixed(2)}</span>
            </div>
          </div>
        )}

        <div className="consumables-add-row">
          <input
            className="consumables-add-input consumables-add-input--name"
            list="products-datalist"
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

          <button className="consumables-add-btn" onClick={addConsumable}>
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