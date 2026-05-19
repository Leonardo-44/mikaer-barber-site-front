// ============================================
//  AppointmentForm.jsx — Mikael Barber
// ============================================

import { useState } from "react";
import "./AppointmentForm.css";

const CUTS = [
  "Social Degradê",
  "Máquina Zero",
  "Corte Navalhado",
  "Undercut",
  "Pompadour",
  "Crop Top",
  "Militar",
  "Tesoura Clássico",
  "BuzzCut",
  "Afro Degradê",
  "Skin Fade",
  "Corte + Barba",
];

const PRODUCTS_SUGGESTIONS = [
  "Pomada Modeladora",
  "Óleo de Barba",
  "Shampoo Premium",
  "Condicionador Barba",
  "Loção Pós-Barba",
  "Cera Capilar",
  "Gel Fixador",
  "Tônico Capilar",
  "Máscara Facial",
  "Perfume Barber",
  "Hidratante Capilar",
  "Creme de Barbear",
];

const EMPTY_FORM = {
  clientName: "",
  clientPhone: "",
  cut: "",
  price: "",
  status: "done",
  obs: "",
};

// Consumível agora é { name, price }
const EMPTY_CONS = { name: "", price: "" };

export default function AppointmentForm({ barberName, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [consumables, setConsumables] = useState([]); // [{ name, price }]
  const [consInput, setConsInput] = useState(EMPTY_CONS);
  const [errors, setErrors] = useState({});

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // Subtotal dos consumíveis
  const consTotal = consumables.reduce(
    (sum, c) => sum + parseFloat(c.price || 0),
    0,
  );

  // Valor total = serviço + consumíveis
  const grandTotal = parseFloat(form.price || 0) + consTotal;

  const addConsumable = () => {
    const name = consInput.name.trim();
    const price = consInput.price;
    if (!name) return;
    setConsumables((prev) => [...prev, { name, price: price || "0" }]);
    setConsInput(EMPTY_CONS);
  };

  const removeConsumable = (index) =>
    setConsumables((prev) => prev.filter((_, i) => i !== index));

  const validate = () => {
    const e = {};
    if (!form.clientName.trim()) e.clientName = "Obrigatório";
    if (!form.cut) e.cut = "Selecione um corte";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    const record = {
      id: Date.now(),
      clientName: form.clientName.trim(),
      clientPhone: form.clientPhone.trim(),
      cut: form.cut,
      price: grandTotal.toFixed(2), // salva o total já somado
      consumables, // [{ name, price }]
      obs: form.obs.trim(),
      status: form.status,
      barber: barberName,
      date: new Date().toLocaleDateString("pt-BR"),
      time: new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    onSaved(record);
    setForm(EMPTY_FORM);
    setConsumables([]);
    setConsInput(EMPTY_CONS);
    setErrors({});
  };

  const isValid = form.clientName.trim() && form.cut;

  return (
    <div className="appt-form-card fade-in">
      {/* ── Dados do cliente ─────────────────────── */}
      <div className="form-row">
        <div>
          <label className="field-label field-label--required" htmlFor="f-name">
            <i className="ti ti-user" aria-hidden="true" />
            Nome do Cliente
          </label>
          <input
            id="f-name"
            className={`field-input${errors.clientName ? " error" : ""}`}
            type="text"
            placeholder="Ex: João Silva"
            value={form.clientName}
            onChange={(e) => set("clientName", e.target.value)}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="f-phone">
            <i className="ti ti-phone" aria-hidden="true" />
            Telefone
          </label>
          <input
            id="f-phone"
            className="field-input"
            type="tel"
            placeholder="(11) 99999-9999"
            value={form.clientPhone}
            onChange={(e) => set("clientPhone", e.target.value)}
          />
        </div>
      </div>

      {/* ── Corte e Preço do serviço ─────────────── */}
      <div className="form-row">
        <div>
          <label className="field-label field-label--required" htmlFor="f-cut">
            <i className="ti ti-scissors" aria-hidden="true" />
            Tipo de Corte
          </label>
          <select
            id="f-cut"
            className={`field-select${errors.cut ? " error" : ""}`}
            value={form.cut}
            onChange={(e) => set("cut", e.target.value)}
          >
            <option value="">Selecionar corte...</option>
            {CUTS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
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
            onChange={(e) => set("price", e.target.value)}
          />
        </div>
      </div>

      {/* ── Status ───────────────────────────────── */}
      <div className="form-row form-row--single" style={{ marginBottom: 20 }}>
        <div>
          <label className="field-label" htmlFor="f-status">
            <i className="ti ti-flag" aria-hidden="true" />
            Status
          </label>
          <select
            id="f-status"
            className="field-select"
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
          >
            <option value="done">✔ Concluído</option>
            <option value="pending">⏳ Pendente</option>
            <option value="cancelled">✖ Cancelado</option>
          </select>
        </div>
      </div>

      {/* ── Consumíveis com valor ─────────────────── */}
      <div className="consumables-section">
        <div className="field-label" style={{ marginBottom: 10 }}>
          <i className="ti ti-package" aria-hidden="true" />
          Consumíveis e Produtos
        </div>

        {/* Lista de consumíveis adicionados */}
        {consumables.length > 0 && (
          <div className="consumables-list">
            {consumables.map((c, i) => (
              <div className="consumable-row" key={i}>
                <button
                  className="consumable-tag__remove"
                  onClick={() => removeConsumable(i)}
                  aria-label={`Remover ${c.name}`}
                >
                  <i className="ti ti-x" />
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

            {/* Subtotal dos consumíveis */}
            <div className="consumables-subtotal">
              <span>Subtotal consumíveis: </span>
              <span className="subtotal-valor">R$ {consTotal.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Inputs para adicionar novo consumível */}
        <div className="consumables-add-row">
          <input
            className="consumables-add-input"
            list="products-datalist"
            placeholder="Nome do produto..."
            value={consInput.name}
            onChange={(e) =>
              setConsInput((p) => ({ ...p, name: e.target.value }))
            }
            onKeyDown={(e) => e.key === "Enter" && addConsumable()}
            style={{ flex: 2 }}
          />
          <datalist id="products-datalist">
            {PRODUCTS_SUGGESTIONS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>

          <input
            className="consumables-add-input"
            type="number"
            placeholder="R$ 0,00"
            min="0"
            step="0.50"
            value={consInput.price}
            onChange={(e) =>
              setConsInput((p) => ({ ...p, price: e.target.value }))
            }
            onKeyDown={(e) => e.key === "Enter" && addConsumable()}
            style={{ flex: 1, maxWidth: 110 }}
          />

          <button className="consumables-add-btn" onClick={addConsumable}>
            <i className="ti ti-plus" aria-hidden="true" />
            Adicionar
          </button>
        </div>
      </div>

      {/* ── Observações ──────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <label className="field-label" htmlFor="f-obs">
          <i className="ti ti-notes" aria-hidden="true" />
          Observações
        </label>
        <textarea
          id="f-obs"
          className="field-textarea"
          placeholder="Ex: Cliente pediu franja mais curta, prefere pomada fosca..."
          value={form.obs}
          onChange={(e) => set("obs", e.target.value)}
        />
      </div>

      {/* ── Resumo do total ───────────────────────── */}
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

      {/* ── Footer ───────────────────────────────── */}
      <div className="appt-form-footer">
        <button
          className="appt-save-btn"
          onClick={handleSave}
          disabled={!isValid}
        >
          <i className="ti ti-device-floppy" aria-hidden="true" />
          Registrar Atendimento
        </button>
        <p className="appt-form-hint">
          <i className="ti ti-info-circle" aria-hidden="true" /> Campos com{" "}
          <span style={{ color: "var(--red-light)" }}>*</span> são obrigatórios
        </p>
      </div>
    </div>
  );
}
