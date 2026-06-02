// ============================================
//  ClientList.jsx — Mikael Barber
// ============================================

import { useState, useEffect, useRef } from "react";
import { clientService } from "../../services/api";
import "./ClientList.css";

function formatPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

const EMPTY_FORM = { name: "", phone: "" };

// ── Modal de criar/editar cliente ────────────────
function ClientModal({ client, onClose, onSave }) {
  const [form, setForm] = useState(
    client ? { name: client.name, phone: client.phone || "" } : EMPTY_FORM,
  );
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const isEdit = !!client;

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Informe o nome";
    return e;
  };

  const handleChange = (field) => (e) => {
    const val =
      field === "phone" ? formatPhone(e.target.value) : e.target.value;
    setForm((p) => ({ ...p, [field]: val }));
    setErrors((p) => ({ ...p, [field]: undefined }));
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setLoading(true);
    try {
      const payload = { name: form.name.trim(), phone: form.phone.trim() };
      const data = isEdit
        ? await clientService.update(client.id, payload)
        : await clientService.create(payload);
      onSave(data.client);
    } catch (err) {
      setErrors({ name: err.message || "Erro ao salvar cliente" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="cl-modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cl-modal-title"
    >
      <div className="cl-modal slide-up">
        {/* Header */}
        <div className="cl-modal__header">
          <div className="cl-modal__icon" aria-hidden="true">
            <i className={`ti ${isEdit ? "ti-user-edit" : "ti-user-plus"}`} />
          </div>
          <div>
            <h2 className="cl-modal__title" id="cl-modal-title">
              {isEdit ? "Editar Cliente" : "Novo Cliente"}
            </h2>
            <p className="cl-modal__sub">Dados de contato</p>
          </div>
          <button
            className="cl-modal__close"
            onClick={onClose}
            aria-label="Fechar"
          >
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>

        <div className="cl-modal__divider" />

        {/* Body */}
        <div className="cl-modal__body">
          <div className={`cl-field${errors.name ? " cl-field--error" : ""}`}>
            <label className="cl-field__label" htmlFor="cl-name">
              Nome
            </label>
            <div className="cl-field__wrap">
              <i className="ti ti-user cl-field__icon" aria-hidden="true" />
              <input
                id="cl-name"
                className="cl-field__input"
                type="text"
                placeholder="Ex: João Silva"
                value={form.name}
                onChange={handleChange("name")}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                autoFocus
                autoComplete="off"
              />
            </div>
            {errors.name && (
              <span className="cl-field__hint">{errors.name}</span>
            )}
          </div>

          <div className="cl-field">
            <label className="cl-field__label" htmlFor="cl-phone">
              WhatsApp
            </label>
            <div className="cl-field__wrap">
              <i
                className="ti ti-brand-whatsapp cl-field__icon"
                aria-hidden="true"
              />
              <input
                id="cl-phone"
                className="cl-field__input"
                type="tel"
                placeholder="(11) 99999-9999"
                value={form.phone}
                onChange={handleChange("phone")}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        <div className="cl-modal__footer">
          <button className="cl-btn cl-btn--cancel" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="cl-btn cl-btn--save"
            onClick={handleSave}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <i className="ti ti-loader-2 spin" aria-hidden="true" />{" "}
                Salvando…
              </>
            ) : (
              <>
                <i className="ti ti-check" aria-hidden="true" />{" "}
                {isEdit ? "Salvar" : "Criar cliente"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal de confirmação de exclusão ─────────────
function DeleteModal({ client, onConfirm, onCancel }) {
  return (
    <div
      className="cl-modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
      role="dialog"
      aria-modal="true"
    >
      <div className="cl-modal cl-modal--sm slide-up">
        <div className="cl-modal__header">
          <div
            className="cl-modal__icon cl-modal__icon--danger"
            aria-hidden="true"
          >
            <i className="ti ti-alert-triangle" />
          </div>
          <div>
            <h2 className="cl-modal__title">Remover cliente</h2>
            <p className="cl-modal__sub">Essa ação não pode ser desfeita</p>
          </div>
          <button
            className="cl-modal__close"
            onClick={onCancel}
            aria-label="Fechar"
          >
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>
        <div className="cl-modal__divider" />
        <p className="cl-modal__confirm-text">
          Tem certeza que deseja remover <strong>{client.name}</strong>?
        </p>
        <div className="cl-modal__footer">
          <button className="cl-btn cl-btn--cancel" onClick={onCancel}>
            Cancelar
          </button>
          <button className="cl-btn cl-btn--danger" onClick={onConfirm}>
            <i className="ti ti-trash" aria-hidden="true" /> Remover
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ─────────────────────────
export default function ClientList({ fireToast }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [deleteClient, setDeleteClient] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => {
    clientService
      .getAll()
      .then((data) => setClients(data.clients || []))
      .catch(() => fireToast?.("Erro ao carregar clientes."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || "").includes(search),
  );

  const handleSave = (saved) => {
    setClients((prev) => {
      const exists = prev.find((c) => c.id === saved.id);
      return exists
        ? prev.map((c) => (c.id === saved.id ? saved : c))
        : [saved, ...prev];
    });
    setShowModal(false);
    setEditClient(null);
    fireToast?.(editClient ? "Cliente atualizado!" : "Cliente cadastrado!");
  };

  const handleDelete = async () => {
    try {
      await clientService.remove(deleteClient.id);
      setClients((prev) => prev.filter((c) => c.id !== deleteClient.id));
      fireToast?.("Cliente removido.");
    } catch {
      fireToast?.("Erro ao remover cliente.");
    } finally {
      setDeleteClient(null);
    }
  };

  return (
    <div className="cl-wrap">
      {/* Toolbar */}
      <div className="cl-toolbar">
        <div className="cl-search-wrap">
          <i className="ti ti-search cl-search-icon" aria-hidden="true" />
          <input
            ref={searchRef}
            className="cl-search"
            type="text"
            placeholder="Buscar por nome ou telefone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar cliente"
          />
          {search && (
            <button
              className="cl-search-clear"
              onClick={() => {
                setSearch("");
                searchRef.current?.focus();
              }}
              aria-label="Limpar busca"
            >
              <i className="ti ti-x" aria-hidden="true" />
            </button>
          )}
        </div>

        <button
          className="cl-add-btn"
          onClick={() => {
            setEditClient(null);
            setShowModal(true);
          }}
        >
          <i className="ti ti-user-plus" aria-hidden="true" />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Contador */}
      <div className="cl-meta">
        {loading ? (
          <span className="cl-meta__loading">
            <i className="ti ti-loader-2 spin" aria-hidden="true" /> Carregando…
          </span>
        ) : (
          <span>
            {filtered.length} cliente{filtered.length !== 1 ? "s" : ""}
            {search && ` para "${search}"`}
          </span>
        )}
      </div>

      {/* Lista */}
      {!loading && filtered.length === 0 ? (
        <div className="cl-empty">
          <i className="ti ti-users-group" aria-hidden="true" />
          <p>
            {search
              ? "Nenhum cliente encontrado."
              : "Nenhum cliente cadastrado ainda."}
          </p>
          {!search && (
            <button
              className="cl-add-btn cl-add-btn--ghost"
              onClick={() => {
                setEditClient(null);
                setShowModal(true);
              }}
            >
              <i className="ti ti-user-plus" aria-hidden="true" /> Cadastrar
              primeiro cliente
            </button>
          )}
        </div>
      ) : (
        <div className="cl-grid">
          {filtered.map((c) => (
            <div className="cl-card" key={c.id}>
              <div className="cl-card__avatar" aria-hidden="true">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="cl-card__info">
                <span className="cl-card__name">{c.name}</span>
                {c.phone ? (
                  <a
                    className="cl-card__phone"
                    href={`https://wa.me/55${c.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Abrir no WhatsApp"
                  >
                    <i className="ti ti-brand-whatsapp" aria-hidden="true" />
                    {c.phone}
                  </a>
                ) : (
                  <span className="cl-card__phone cl-card__phone--empty">
                    <i className="ti ti-phone-off" aria-hidden="true" />
                    Sem telefone
                  </span>
                )}
              </div>
              <div className="cl-card__actions">
                <button
                  className="cl-card__btn cl-card__btn--edit"
                  onClick={() => {
                    setEditClient(c);
                    setShowModal(true);
                  }}
                  aria-label={`Editar ${c.name}`}
                  title="Editar"
                >
                  <i className="ti ti-pencil" aria-hidden="true" />
                </button>
                <button
                  className="cl-card__btn cl-card__btn--delete"
                  onClick={() => setDeleteClient(c)}
                  aria-label={`Remover ${c.name}`}
                  title="Remover"
                >
                  <i className="ti ti-trash" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modais */}
      {showModal && (
        <ClientModal
          client={editClient}
          onClose={() => {
            setShowModal(false);
            setEditClient(null);
          }}
          onSave={handleSave}
        />
      )}
      {deleteClient && (
        <DeleteModal
          client={deleteClient}
          onConfirm={handleDelete}
          onCancel={() => setDeleteClient(null)}
        />
      )}
    </div>
  );
}
