import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  appointmentService,
  productService,
  serviceService,
} from "../../services/api";
import "./EditAppointmentModal.css";

function formatPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function EditAppointmentModal({
  appointment: a,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState({
    clientName: a.client_name || a.clientName || "",
    clientPhone: a.client_phone || a.clientPhone || "",
    obs: a.obs || "",
    date: a.date || "",
    time: a.time || "",
    status: a.status || "pending",
  });

  const initialCons = Array.isArray(a.consumables)
    ? a.consumables.map((c) =>
        typeof c === "object"
          ? {
              name: c.name,
              price: String(c.price ?? 0),
              qty: c.qty || 1,
              productId: c.productId || null,
            }
          : { name: c, price: "0", qty: 1, productId: null },
      )
    : [];

  const initialConsTotal = initialCons.reduce(
    (acc, c) => acc + parseFloat(c.price || 0) * (c.qty || 1),
    0,
  );

  const initialServices =
    Array.isArray(a.services) && a.services.length > 0
      ? a.services.map((s) => ({ cut: s.cut, price: String(s.price ?? 0) }))
      : a.cut
        ? a.cut.split(" + ").map((c, index) => {
            let fallbackPrice = 0;
            if (a.servicePrice !== undefined && a.servicePrice !== null) {
              fallbackPrice = parseFloat(a.servicePrice);
            } else {
              const totalLegado = parseFloat(a.price || a.total_price || "0");
              fallbackPrice = Math.max(0, totalLegado - initialConsTotal);
            }
            return {
              cut: c.trim(),
              price: index === 0 ? String(fallbackPrice) : "0",
            };
          })
        : [];

  const [services, setServices] = useState(initialServices);
  const [serviceInput, setServiceInput] = useState({ cut: "", price: "" });
  const [consumables, setConsumables] = useState(initialCons);
  const [consInput, setConsInput] = useState({ name: "", price: "" });
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [catalogServices, setCatalogServices] = useState([]);
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [pData, sData] = await Promise.all([
          productService.getAll(),
          serviceService.getAll(),
        ]);
        setCatalogProducts(pData.products || []);
        setCatalogServices(sData.services || []);
        setCatalogLoaded(true);
      } catch (err) {
        console.error("Erro ao carregar catálogos:", err);
      }
    };
    loadCatalogs();
  }, []);

  const servicesTotal = services.reduce(
    (s, x) => s + parseFloat(x.price || 0),
    0,
  );
  const consTotal = consumables.reduce(
    (s, c) => s + parseFloat(c.price || 0) * (c.qty || 1),
    0,
  );
  const grandTotal = servicesTotal + consTotal;

  const toggleCatalog = () => {
    setShowCatalog((v) => !v);
  };

  const handleServiceCutChange = (e) => {
    const label = e.target.value;
    const found = catalogServices.find((c) => c.label === label);
    setServiceInput({ cut: label, price: found ? String(found.price) : "" });
  };

  const addService = () => {
    if (!serviceInput.cut.trim()) return;
    setServices((prev) => [
      ...prev,
      { cut: serviceInput.cut.trim(), price: serviceInput.price || "0" },
    ]);
    setServiceInput({ cut: "", price: "" });
  };

  const removeService = (i) =>
    setServices((prev) => prev.filter((_, idx) => idx !== i));

  const addConsumable = () => {
    if (!consInput.name.trim()) return;
    setConsumables((prev) => [
      ...prev,
      {
        name: consInput.name.trim(),
        price: consInput.price || "0",
        qty: 1,
        productId: null,
      },
    ]);
    setConsInput({ name: "", price: "" });
  };

  const addFromCatalog = (product) => {
    setConsumables((prev) => {
      const idx = prev.findIndex((c) => c.productId === product.id);
      if (idx >= 0) {
        const max =
          catalogProducts.find((p) => p.id === product.id)?.stock ?? Infinity;
        if (prev[idx].qty >= max) return prev;
        return prev.map((c, i) => (i === idx ? { ...c, qty: c.qty + 1 } : c));
      }
      return [
        ...prev,
        {
          name: product.name,
          price: String(product.price),
          qty: 1,
          productId: product.id,
        },
      ];
    });
  };

  const changeQty = (i, delta) => {
    setConsumables((prev) =>
      prev.map((c, idx) => {
        if (idx !== i) return c;
        const newQty = Math.max(1, (c.qty || 1) + delta);
        if (c.productId) {
          const max =
            catalogProducts.find((p) => p.id === c.productId)?.stock ??
            Infinity;
          return { ...c, qty: Math.min(newQty, max) };
        }
        return { ...c, qty: newQty };
      }),
    );
  };

  const removeCons = (i) =>
    setConsumables((prev) => prev.filter((_, idx) => idx !== i));
  const set = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.clientName.trim()) {
      setError("Nome do cliente é obrigatório.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload = {
        clientName: form.clientName.trim(),
        clientPhone: form.clientPhone.trim() || "",
        cut: services.length > 0 ? services.map((s) => s.cut).join(" + ") : "",
        servicePrice: servicesTotal,
        price: grandTotal.toFixed(2),
        services: services.map((s) => ({
          cut: s.cut,
          price: parseFloat(s.price || 0),
        })),
        consumables: consumables.map((c) => ({
          name: c.name,
          price: c.price,
          qty: c.qty || 1,
          productId: c.productId || null,
        })),
        obs: form.obs.trim() || "",
        date: form.date || "",
        time: form.time || "",
        status: form.status,
      };
      const data = await appointmentService.update(a.id, payload);
      onSaved(data.appointment);
    } catch (err) {
      setError(err.message || "Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  const modal = (
    <div
      className="modal-backdrop modal-backdrop--edit"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-title"
    >
      <div className="modal-card edit-modal-card slide-up">
        <div className="modal-header">
          <div className="modal-header__icon">
            <i className="ti ti-edit" />
          </div>
          <div>
            <h2 className="modal-header__title" id="edit-title">
              Editar Atendimento
            </h2>
            <p className="modal-header__sub">{a.client_name || a.clientName}</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>

        <div className="modal-divider" />

        <div className="modal-body edit-modal-body">
          <div className="edit-modal__section-title">
            <i className="ti ti-user" /> Cliente
          </div>
          <div className="edit-modal__row-2">
            <div className="modal-field">
              <label className="modal-field__label">Nome</label>
              <div className="modal-field__wrapper">
                <i className="ti ti-user modal-field__icon" />
                <input
                  className="modal-field__input"
                  placeholder="Nome do cliente"
                  value={form.clientName}
                  onChange={set("clientName")}
                />
              </div>
            </div>
            <div className="modal-field">
              <label className="modal-field__label">WhatsApp</label>
              <div className="modal-field__wrapper">
                <i className="ti ti-brand-whatsapp modal-field__icon" />
                <input
                  className="modal-field__input"
                  placeholder="(11) 99999-9999"
                  value={form.clientPhone}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      clientPhone: formatPhone(e.target.value),
                    }))
                  }
                  type="tel"
                />
              </div>
            </div>
          </div>

          <div className="edit-modal__row-3">
            <div className="modal-field">
              <label className="modal-field__label">Data</label>
              <div className="modal-field__wrapper">
                <i className="ti ti-calendar modal-field__icon" />
                <input
                  className="modal-field__input"
                  placeholder="DD/MM/AAAA"
                  value={form.date}
                  onChange={set("date")}
                />
              </div>
            </div>
            <div className="modal-field">
              <label className="modal-field__label">Hora</label>
              <div className="modal-field__wrapper">
                <i className="ti ti-clock modal-field__icon" />
                <input
                  className="modal-field__input"
                  placeholder="HH:MM"
                  value={form.time}
                  onChange={set("time")}
                />
              </div>
            </div>
            <div className="modal-field">
              <label className="modal-field__label">Status</label>
              <div className="modal-field__wrapper">
                <i className="ti ti-flag modal-field__icon" />
                <select
                  className="modal-field__input"
                  value={form.status}
                  onChange={set("status")}
                  style={{ paddingLeft: 38, cursor: "pointer" }}
                >
                  <option value="done">Concluído</option>
                  <option value="pending">Pendente</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            </div>
          </div>

          <div className="edit-modal__section-title">
            <i className="ti ti-scissors" /> Serviços
            {services.length > 0 && (
              <span className="edit-modal__badge">{services.length}</span>
            )}
            {servicesTotal > 0 && (
              <span className="edit-modal__subtotal">
                R$ {servicesTotal.toFixed(2)}
              </span>
            )}
          </div>

          {services.length > 0 && (
            <div className="edit-modal__list">
              {services.map((s, i) => (
                <div className="edit-modal__list-item" key={i}>
                  <button
                    className="edit-modal__remove-btn"
                    onClick={() => removeService(i)}
                    type="button"
                  >
                    <i className="ti ti-x" />
                  </button>
                  <span className="edit-modal__list-name">
                    <i className="ti ti-scissors" />
                    {s.cut}
                  </span>
                  <span className="edit-modal__list-price">
                    R$ {parseFloat(s.price || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="edit-modal__add-row">
            <select
              className="edit-modal__add-select"
              value={serviceInput.cut}
              onChange={handleServiceCutChange}
              aria-label="Selecionar serviço"
            >
              <option value="">Selecionar serviço...</option>
              {catalogServices.length === 0 ? (
                <option disabled>Carregando serviços...</option>
              ) : (
                catalogServices.map((c) => (
                  <option key={c.id || c.label} value={c.label}>
                    {c.label} — R$ {parseFloat(c.price).toFixed(2)}
                  </option>
                ))
              )}
            </select>
            <input
              className="edit-modal__add-price"
              type="number"
              placeholder="R$"
              min="0"
              step="0.50"
              value={serviceInput.price}
              onChange={(e) =>
                setServiceInput((p) => ({ ...p, price: e.target.value }))
              }
              aria-label="Valor do serviço"
            />
            <button
              type="button"
              className="edit-modal__add-btn"
              onClick={addService}
              disabled={!serviceInput.cut}
            >
              <i className="ti ti-plus" />
            </button>
          </div>

          <div className="edit-modal__section-title">
            <i className="ti ti-package" /> Consumíveis
            {consumables.length > 0 && (
              <span className="edit-modal__badge">{consumables.length}</span>
            )}
            {consTotal > 0 && (
              <span className="edit-modal__subtotal">
                R$ {consTotal.toFixed(2)}
              </span>
            )}
            <button
              type="button"
              className="edit-modal__catalog-btn"
              onClick={toggleCatalog}
              aria-expanded={showCatalog}
            >
              <i
                className={`ti ${showCatalog ? "ti-chevron-up" : "ti-layout-grid"}`}
              />
              {showCatalog ? "Fechar" : "Catálogo"}
            </button>
          </div>

          {showCatalog && catalogProducts.length > 0 && (
            <div className="edit-modal__catalog-grid">
              {catalogProducts.map((p) => {
                const inCart = consumables.find((c) => c.productId === p.id);
                const noStock = p.stock <= 0;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`edit-modal__cat-btn${inCart ? " edit-modal__cat-btn--active" : ""}${noStock ? " edit-modal__cat-btn--disabled" : ""}`}
                    onClick={() => !noStock && addFromCatalog(p)}
                    disabled={noStock}
                    title={
                      noStock
                        ? `${p.name} — sem estoque`
                        : `Adicionar ${p.name}`
                    }
                  >
                    <span className="edit-modal__cat-name">{p.name}</span>
                    <span className="edit-modal__cat-price">
                      R$ {parseFloat(p.price).toFixed(2)}
                    </span>
                    <span className="edit-modal__cat-stock">
                      {noStock ? (
                        <span className="edit-modal__cat-out">sem estoque</span>
                      ) : p.stock <= 2 ? (
                        <span className="edit-modal__cat-low">
                          <i className="ti ti-alert-triangle" />
                          {p.stock} rest.
                        </span>
                      ) : (
                        <span className="edit-modal__cat-ok">
                          {p.stock} em estoque
                        </span>
                      )}
                      {inCart && (
                        <span className="edit-modal__cat-badge">
                          ×{inCart.qty}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {consumables.length > 0 && (
            <div className="edit-modal__list">
              {consumables.map((c, i) => (
                <div className="edit-modal__list-item" key={i}>
                  <button
                    className="edit-modal__remove-btn"
                    onClick={() => removeCons(i)}
                    type="button"
                  >
                    <i className="ti ti-x" />
                  </button>
                  <span className="edit-modal__list-name">
                    <i className="ti ti-sparkles" />
                    {c.name}
                  </span>
                  <div className="edit-modal__qty">
                    <button
                      className="edit-modal__qty-btn"
                      type="button"
                      onClick={() => changeQty(i, -1)}
                      disabled={(c.qty || 1) <= 1}
                      aria-label="Diminuir"
                    >
                      <i className="ti ti-minus" />
                    </button>
                    <span className="edit-modal__qty-val">{c.qty || 1}</span>
                    <button
                      className="edit-modal__qty-btn"
                      type="button"
                      onClick={() => changeQty(i, +1)}
                      aria-label="Aumentar"
                    >
                      <i className="ti ti-plus" />
                    </button>
                  </div>
                  <span className="edit-modal__list-price">
                    R$ {(parseFloat(c.price) * (c.qty || 1)).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="edit-modal__add-row">
            <input
              className="edit-modal__add-input edit-modal__add-input--name"
              placeholder="Nome do produto..."
              value={consInput.name}
              onChange={(e) =>
                setConsInput((p) => ({ ...p, name: e.target.value }))
              }
              onKeyDown={(e) => e.key === "Enter" && addConsumable()}
            />
            <input
              className="edit-modal__add-price"
              type="number"
              placeholder="R$"
              min="0"
              step="0.50"
              value={consInput.price}
              onChange={(e) =>
                setConsInput((p) => ({ ...p, price: e.target.value }))
              }
              onKeyDown={(e) => e.key === "Enter" && addConsumable()}
            />
            <button
              type="button"
              className="edit-modal__add-btn"
              onClick={addConsumable}
            >
              <i className="ti ti-plus" />
            </button>
          </div>

          {(services.length > 0 || consTotal > 0) && (
            <div className="edit-modal__total">
              {services.length > 0 && (
                <div className="edit-modal__total-row">
                  <span>Serviços</span>
                  <span>R$ {servicesTotal.toFixed(2)}</span>
                </div>
              )}
              {consTotal > 0 && (
                <div className="edit-modal__total-row">
                  <span>Consumíveis</span>
                  <span>R$ {consTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="edit-modal__total-row edit-modal__total-row--grand">
                <span>Total</span>
                <span>R$ {grandTotal.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="modal-field">
            <label className="modal-field__label">
              <i className="ti ti-notes" style={{ marginRight: 5 }} />{" "}
              Observações
            </label>
            <textarea
              className="modal-field__input"
              placeholder="Observações..."
              value={form.obs}
              onChange={set("obs")}
              rows={3}
              style={{ resize: "vertical", paddingLeft: 14, paddingTop: 12 }}
            />
          </div>

          {error && <span className="modal-field__hint">{error}</span>}
        </div>

        <div className="modal-footer">
          <button className="modal-btn modal-btn--cancel" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="modal-btn modal-btn--save"
            onClick={handleSave}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <i className="ti ti-loader-2 spin" /> Salvando…
              </>
            ) : (
              <>
                <i className="ti ti-check" /> Salvar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}