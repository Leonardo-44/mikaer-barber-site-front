import { useState } from "react";
import { appointmentService } from "../../services/api";
import "./AppointmentCard.css";

const STATUS_CONFIG = {
  done: { label: "Concluído", icon: "ti-circle-check", cls: "done" },
  pending: { label: "Pendente", icon: "ti-clock", cls: "pending" },
  cancelled: { label: "Cancelado", icon: "ti-circle-x", cls: "cancelled" },
};

function WhatsAppLink({ phone }) {
  if (!phone) return <span className="appt-empty">—</span>;
  const digits = phone.replace(/\D/g, "");
  return (
    <a
      href={`https://wa.me/55${digits}`}
      target="_blank"
      rel="noopener noreferrer"
      className="appt-whatsapp"
      title="Abrir no WhatsApp"
    >
      <i className="ti ti-brand-whatsapp" aria-hidden="true" />
      {phone}
    </a>
  );
}

function StatusSelect({ status, onChange }) {
  return (
    <select
      className={`appt-status-select appt-status-select--${status}`}
      value={status}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Alterar status"
    >
      <option value="done">Concluído</option>
      <option value="pending">Pendente</option>
      <option value="cancelled">Cancelado</option>
    </select>
  );
}

// ── Fora do EditModal para evitar recriação a cada render ──
function ModalField({
  label,
  icon,
  field,
  type = "text",
  placeholder,
  value,
  onChange,
}) {
  return (
    <div className="modal-field">
      <label className="modal-field__label">{label}</label>
      <div className="modal-field__wrapper">
        {icon && (
          <i className={`ti ${icon} modal-field__icon`} aria-hidden="true" />
        )}
        <input
          className="modal-field__input"
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
      </div>
    </div>
  );
}

function EditModal({ appointment: a, onClose, onSaved }) {
  const [form, setForm] = useState({
    clientName: a.clientName || "",
    clientPhone: a.clientPhone || "",
    cut: a.cut || "",
    price: a.price || "",
    obs: a.obs || "",
    date: a.date || "",
    time: a.time || "",
    status: a.status || "pending",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.clientName.trim() || !form.cut.trim()) {
      setError("Nome do cliente e corte são obrigatórios.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await appointmentService.update(a.id, {
        clientName: form.clientName.trim(),
        clientPhone: form.clientPhone.trim() || "",
        cut: form.cut.trim(),
        price: form.price !== "" ? parseFloat(form.price) : 0,
        obs: form.obs.trim() || "",
        date: form.date || "",
        time: form.time || "",
        status: form.status,
      });
      onSaved(data.appointment);
    } catch (err) {
      setError(err.message || "Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-title"
    >
      <div className="modal-card slide-up" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div className="modal-header__icon" aria-hidden="true">
            <i className="ti ti-edit" />
          </div>
          <div>
            <h2 className="modal-header__title" id="edit-title">
              Editar Atendimento
            </h2>
            <p className="modal-header__sub">{a.clientName}</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>

        <div className="modal-divider" />

        <div className="modal-body">
          <ModalField
            label="Nome do cliente"
            icon="ti-user"
            field="clientName"
            placeholder="Nome"
            value={form.clientName}
            onChange={set("clientName")}
          />
          <ModalField
            label="Telefone"
            icon="ti-phone"
            field="clientPhone"
            placeholder="(11) 99999-9999"
            value={form.clientPhone}
            onChange={set("clientPhone")}
          />
          <ModalField
            label="Corte"
            icon="ti-cut"
            field="cut"
            placeholder="Ex: Degradê"
            value={form.cut}
            onChange={set("cut")}
          />
          <ModalField
            label="Valor total (R$)"
            icon="ti-coin"
            field="price"
            placeholder="0.00"
            type="number"
            value={form.price}
            onChange={set("price")}
          />

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <ModalField
              label="Data"
              icon="ti-calendar"
              field="date"
              placeholder="DD/MM/AAAA"
              value={form.date}
              onChange={set("date")}
            />
            <ModalField
              label="Hora"
              icon="ti-clock"
              field="time"
              placeholder="HH:MM"
              value={form.time}
              onChange={set("time")}
            />
          </div>

          <div className="modal-field">
            <label className="modal-field__label">Status</label>
            <div className="modal-field__wrapper">
              <i
                className="ti ti-circle-check modal-field__icon"
                aria-hidden="true"
              />
              <select
                className="modal-field__input"
                value={form.status}
                onChange={set("status")}
                style={{ paddingLeft: 38, cursor: "pointer" }}
              >
                <option value="pending">Pendente</option>
                <option value="done">Concluído</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>

          <div className="modal-field">
            <label className="modal-field__label">Observações</label>
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
                <i className="ti ti-loader-2 spin" aria-hidden="true" />{" "}
                Salvando…
              </>
            ) : (
              <>
                <i className="ti ti-check" aria-hidden="true" /> Salvar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppointmentCard({
  appointment: a,
  onDelete,
  onStatusChange,
  onEdit,
}) {
  const st = STATUS_CONFIG[a.status] || STATUS_CONFIG.pending;
  const [showEdit, setShowEdit] = useState(false);

  const handleSaved = (updated) => {
    onEdit(updated);
    setShowEdit(false);
  };

  return (
    <>
      <article className={`appt-card appt-card--${a.status}`}>
        <div className="appt-card__stripe" aria-hidden="true" />

        <div className="appt-card__head">
          <div className="appt-card__client">
            <div className="appt-card__avatar" aria-hidden="true">
              {(a.clientName || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="appt-card__name">{a.clientName}</div>
              <WhatsAppLink phone={a.clientPhone} />
            </div>
          </div>

          <div className="appt-card__head-right">
            <div className="appt-card__datetime">
              <i className="ti ti-calendar" aria-hidden="true" />
              {a.date}
              {a.time && <span className="appt-card__time">{a.time}</span>}
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                className="appt-card__edit"
                onClick={() => setShowEdit(true)}
                aria-label={`Editar atendimento de ${a.clientName}`}
                title="Editar"
              >
                <i className="ti ti-pencil" aria-hidden="true" />
              </button>
              <button
                className="appt-card__delete"
                onClick={() => onDelete(a.id)}
                aria-label={`Remover atendimento de ${a.clientName}`}
                title="Remover"
              >
                <i className="ti ti-trash" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div className="appt-card__body">
          <div className="appt-card__field">
            <span className="appt-card__field-label">Corte</span>
            <span className="appt-card__cut">{a.cut || "—"}</span>
          </div>
          <div className="appt-card__field">
            <span className="appt-card__field-label">Barbeiro</span>
            <span className="appt-card__barber">
              <i className="ti ti-scissors" aria-hidden="true" />
              {a.barber || "—"}
            </span>
          </div>
          <div className="appt-card__field">
            <span className="appt-card__field-label">Valor</span>
            {a.price ? (
              <span className="appt-card__price">
                R$ {parseFloat(a.price).toFixed(2)}
              </span>
            ) : (
              <span className="appt-empty">—</span>
            )}
          </div>
          {a.consumables.length > 0 && (
            <div className="appt-card__field appt-card__field--full">
              <span className="appt-card__field-label">Consumíveis</span>
              <div className="appt-card__tags">
                {a.consumables.map((c, i) => {
                  const name = typeof c === "object" ? c.name : c;
                  const qty = typeof c === "object" ? c.qty || 1 : 1;
                  return (
                    <span className="appt-card__tag" key={i}>
                      {name}
                      {qty > 1 && (
                        <strong className="appt-card__tag-qty">×{qty}</strong>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {a.obs && (
            <div className="appt-card__field appt-card__field--full">
              <span className="appt-card__field-label">Obs</span>
              <span className="appt-card__obs">{a.obs}</span>
            </div>
          )}
        </div>

        <div className="appt-card__foot">
          <span
            className={`appt-card__status-badge appt-card__status-badge--${st.cls}`}
          >
            <i className={`ti ${st.icon}`} aria-hidden="true" />
            {st.label}
          </span>
          <StatusSelect
            status={a.status}
            onChange={(s) => onStatusChange(a.id, s)}
          />
        </div>
      </article>

      {showEdit && (
        <EditModal
          appointment={a}
          onClose={() => setShowEdit(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
