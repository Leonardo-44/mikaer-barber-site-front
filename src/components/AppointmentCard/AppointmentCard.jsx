import { useState, useEffect } from "react";
import EditAppointmentModal from "../EditAppointmentModal/EditAppointmentModal";
import "./AppointmentCard.css";

const STATUS_CONFIG = {
  done:      { label: "Concluído", icon: "ti-circle-check", cls: "done" },
  pending:   { label: "Pendente",  icon: "ti-clock",        cls: "pending" },
  cancelled: { label: "Cancelado", icon: "ti-circle-x",     cls: "cancelled" },
};

// ── Botões de status (substituem o <select> nativo) ──────────────────────────
const STATUS_BUTTONS = [
  { key: "done",      icon: "ti-circle-check", label: "Feito" },
  { key: "pending",   icon: "ti-clock",        label: "Pendente" },
  { key: "cancelled", icon: "ti-circle-x",     label: "Cancelado" },
];

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

// ── Segmented control substituindo o <select> ─────────────────────────────────
function StatusSwitcher({ status, onChange }) {
  return (
    <div
      className="appt-status-switcher"
      role="group"
      aria-label="Alterar status do atendimento"
    >
      {STATUS_BUTTONS.map(({ key, icon, label }) => (
        <button
          key={key}
          className={`appt-status-btn appt-status-btn--${key}${
            status === key ? " appt-status-btn--active" : ""
          }`}
          onClick={() => onChange(key)}
          aria-pressed={status === key}
          title={label}
        >
          <i className={`ti ${icon}`} aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
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

  useEffect(() => {
    document.body.style.overflow = showEdit ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showEdit]);

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
              {(a.client_name || a.clientName || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="appt-card__name">
                {a.client_name || a.clientName}
              </div>
              <WhatsAppLink phone={a.client_phone || a.clientPhone} />
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
                aria-label={`Editar atendimento de ${a.client_name || a.clientName}`}
                title="Editar"
              >
                <i className="ti ti-pencil" aria-hidden="true" />
              </button>
              <button
                className="appt-card__delete"
                onClick={() => onDelete(a.id)}
                aria-label={`Remover atendimento de ${a.client_name || a.clientName}`}
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
            <span className="appt-card__cut">
              {a.cut?.trim() ? a.cut : "Sem corte"}
            </span>
          </div>
          <div className="appt-card__field">
            <span className="appt-card__field-label">Barbeiro</span>
            <span className="appt-card__barber">
              <i className="ti ti-scissors" aria-hidden="true" />
              {a.barber_name || a.barber || "—"}
            </span>
          </div>
          <div className="appt-card__field">
            <span className="appt-card__field-label">Valor</span>
            {a.price || a.total_price ? (
              <span className="appt-card__price">
                R$ {parseFloat(a.total_price || a.price).toFixed(2)}
              </span>
            ) : (
              <span className="appt-empty">—</span>
            )}
          </div>
          {Array.isArray(a.consumables) && a.consumables.length > 0 && (
            <div className="appt-card__field appt-card__field--full">
              <span className="appt-card__field-label">Consumíveis</span>
              <div className="appt-card__tags">
                {a.consumables.map((c, i) => {
                  const name = typeof c === "object" ? c.name : c;
                  const qty  = typeof c === "object" ? c.qty || 1 : 1;
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

        {/* ── Rodapé com badge + segmented control ── */}
        <div className="appt-card__foot">
          <span
            className={`appt-card__status-badge appt-card__status-badge--${st.cls}`}
          >
            <i className={`ti ${st.icon}`} aria-hidden="true" />
            {st.label}
          </span>

          <StatusSwitcher
            status={a.status}
            onChange={(s) => onStatusChange(a.id, s)}
          />
        </div>
      </article>

      {showEdit && (
        <EditAppointmentModal
          appointment={a}
          onClose={() => setShowEdit(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}