// ============================================
//  ServiceManager.jsx — Mikael Barber (Admin)
// ============================================

import { useState, useEffect } from "react";
import { serviceService } from "../../services/api";
import "./ServiceManager.css";

const EMPTY_FORM = { label: "", price: "" };

function ServiceModal({ initial, onClose, onSave, saving }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const set = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.label.trim())               e.label = "Informe o nome do serviço";
    if (!form.price || parseFloat(form.price) < 0) e.price = "Informe um valor válido";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave({ label: form.label.trim(), price: parseFloat(form.price) });
  };

  const isEdit = !!initial?.id;

  return (
    <div
      className="svc-modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="svc-modal-title"
    >
      <div className="svc-modal-card slide-up">
        <div className="svc-modal-header">
          <div className="svc-modal-header__icon" aria-hidden="true">
            <i className={`ti ${isEdit ? "ti-edit" : "ti-plus"}`} />
          </div>
          <div>
            <h2 className="svc-modal-header__title" id="svc-modal-title">
              {isEdit ? "Editar serviço" : "Novo serviço"}
            </h2>
            <p className="svc-modal-header__sub">
              {isEdit ? "Altere o nome ou valor" : "Será exibido no formulário de atendimento"}
            </p>
          </div>
          <button className="svc-modal-close" onClick={onClose} aria-label="Fechar">
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>

        <div className="svc-modal-divider" />

        <div className="svc-modal-body">
          <div className={`svc-field${errors.label ? " svc-field--error" : ""}`}>
            <label className="svc-field__label" htmlFor="svc-label">Nome do serviço</label>
            <div className="svc-field__wrap">
              <i className="ti ti-scissors svc-field__icon" aria-hidden="true" />
              <input
                id="svc-label"
                className="svc-field__input"
                type="text"
                placeholder="Ex: Degradê"
                value={form.label}
                onChange={(e) => set("label", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                autoFocus
              />
            </div>
            {errors.label && <span className="svc-field__hint">{errors.label}</span>}
          </div>

          <div className={`svc-field${errors.price ? " svc-field--error" : ""}`}>
            <label className="svc-field__label" htmlFor="svc-price">Valor (R$)</label>
            <div className="svc-field__wrap">
              <i className="ti ti-currency-dollar svc-field__icon" aria-hidden="true" />
              <input
                id="svc-price"
                className="svc-field__input"
                type="number"
                placeholder="0,00"
                min="0"
                step="0.50"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
            </div>
            {errors.price && <span className="svc-field__hint">{errors.price}</span>}
          </div>
        </div>

        <div className="svc-modal-footer">
          <button className="svc-btn svc-btn--cancel" onClick={onClose}>Cancelar</button>
          <button className="svc-btn svc-btn--save" onClick={handleSave} disabled={saving} aria-busy={saving}>
            {saving ? (
              <><i className="ti ti-loader-2 spin" aria-hidden="true" /> Salvando…</>
            ) : (
              <><i className="ti ti-check" aria-hidden="true" /> {isEdit ? "Salvar alterações" : "Criar serviço"}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ service, onConfirm, onCancel }) {
  return (
    <div
      className="svc-modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="svc-del-title"
    >
      <div className="svc-modal-card svc-modal-card--sm slide-up">
        <div className="svc-modal-header">
          <div className="svc-modal-header__icon svc-modal-header__icon--danger" aria-hidden="true">
            <i className="ti ti-trash" />
          </div>
          <div>
            <h2 className="svc-modal-header__title" id="svc-del-title">Remover serviço</h2>
            <p className="svc-modal-header__sub">Essa ação não pode ser desfeita</p>
          </div>
          <button className="svc-modal-close" onClick={onCancel} aria-label="Fechar">
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>
        <div className="svc-modal-divider" />
        <p className="svc-modal-confirm__text">
          Tem certeza que deseja remover o serviço <strong>{service.label}</strong>?
        </p>
        <div className="svc-modal-footer">
          <button className="svc-btn svc-btn--cancel" onClick={onCancel}>Cancelar</button>
          <button className="svc-btn svc-btn--danger" onClick={onConfirm}>
            <i className="ti ti-trash" aria-hidden="true" /> Remover
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ServiceManager({ fireToast }) {
  const [services, setServices]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [modalOpen, setModalOpen]     = useState(false);
  const [editTarget, setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving]           = useState(false);

  useEffect(() => {
    serviceService.getAll()
      .then((data) => setServices(data.services || []))
      .catch(() => fireToast("Erro ao carregar serviços."))
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit   = (svc) => { setEditTarget(svc); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditTarget(null); };

  const handleSave = async ({ label, price }) => {
    setSaving(true);
    try {
      if (editTarget?.id) {
        const data = await serviceService.update(editTarget.id, { label, price });
        setServices((prev) =>
          prev.map((s) => s.id === editTarget.id ? (data.service || { ...s, label, price }) : s)
        );
        fireToast("Serviço atualizado com sucesso!");
      } else {
        const data = await serviceService.create({ label, price });
        setServices((prev) => [...prev, data.service || { id: Date.now(), label, price }]);
        fireToast("Serviço criado com sucesso!");
      }
      closeModal();
    } catch (err) {
      fireToast(err.message || "Erro ao salvar serviço.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await serviceService.remove(deleteTarget.id);
      setServices((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      fireToast(`Serviço "${deleteTarget.label}" removido.`);
    } catch {
      fireToast("Erro ao remover serviço.");
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="svc-loading">
        <i className="ti ti-loader-2 spin" aria-hidden="true" />
        <span>Carregando serviços…</span>
      </div>
    );
  }

  return (
    <div className="svc-manager fade-in">

      <div className="svc-toolbar">
        <p className="svc-toolbar__hint">
          <i className="ti ti-info-circle" aria-hidden="true" />
          Os serviços abaixo aparecem no formulário de atendimento para todos os barbeiros.
        </p>
        <button className="svc-add-btn" onClick={openCreate}>
          <i className="ti ti-plus" aria-hidden="true" />
          Novo serviço
        </button>
      </div>

      {services.length === 0 ? (
        <div className="svc-empty">
          <i className="ti ti-scissors svc-empty__icon" aria-hidden="true" />
          <div className="svc-empty__title">Nenhum serviço cadastrado</div>
          <p className="svc-empty__sub">Adicione o primeiro serviço pelo botão acima.</p>
        </div>
      ) : (
        <div className="svc-grid">
          {services.map((svc) => (
            <div key={svc.id} className="svc-card">
              <div className="svc-card__icon" aria-hidden="true">
                <i className="ti ti-scissors" />
              </div>
              <div className="svc-card__info">
                <span className="svc-card__label">{svc.label}</span>
                <span className="svc-card__price">R$ {parseFloat(svc.price).toFixed(2)}</span>
              </div>
              <div className="svc-card__actions">
                <button
                  className="svc-card__btn svc-card__btn--edit"
                  onClick={() => openEdit(svc)}
                  aria-label={`Editar ${svc.label}`}
                  title="Editar"
                >
                  <i className="ti ti-edit" aria-hidden="true" />
                </button>
                <button
                  className="svc-card__btn svc-card__btn--delete"
                  onClick={() => setDeleteTarget(svc)}
                  aria-label={`Remover ${svc.label}`}
                  title="Remover"
                >
                  <i className="ti ti-trash" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <ServiceModal
          initial={editTarget}
          onClose={closeModal}
          onSave={handleSave}
          saving={saving}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          service={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}