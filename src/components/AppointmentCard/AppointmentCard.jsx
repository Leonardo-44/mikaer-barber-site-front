// ============================================
//  AppointmentCard.jsx — Mikael Barber
// ============================================

const STATUS_CONFIG = {
  done:      { label: 'Concluído', icon: 'ti-circle-check', cls: 'done'      },
  pending:   { label: 'Pendente',  icon: 'ti-clock',        cls: 'pending'   },
  cancelled: { label: 'Cancelado', icon: 'ti-circle-x',     cls: 'cancelled' },
};

function WhatsAppLink({ phone }) {
  if (!phone) return <span className="appt-empty">—</span>;
  const digits = phone.replace(/\D/g, '');
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

export default function AppointmentCard({ appointment: a, onDelete, onStatusChange }) {
  const st = STATUS_CONFIG[a.status] || STATUS_CONFIG.pending;

  return (
    <article className={`appt-card appt-card--${a.status}`}>

      {/* Faixa lateral de status */}
      <div className="appt-card__stripe" aria-hidden="true" />

      {/* Cabeçalho do card */}
      <div className="appt-card__head">
        <div className="appt-card__client">
          <div className="appt-card__avatar" aria-hidden="true">
            {(a.clientName || '?').charAt(0).toUpperCase()}
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

      {/* Corpo */}
      <div className="appt-card__body">

        <div className="appt-card__field">
          <span className="appt-card__field-label">Corte</span>
          <span className="appt-card__cut">{a.cut || '—'}</span>
        </div>

        <div className="appt-card__field">
          <span className="appt-card__field-label">Barbeiro</span>
          <span className="appt-card__barber">
            <i className="ti ti-scissors" aria-hidden="true" />
            {a.barber || '—'}
          </span>
        </div>

        <div className="appt-card__field">
          <span className="appt-card__field-label">Valor</span>
          {a.price
            ? <span className="appt-card__price">R$ {parseFloat(a.price).toFixed(2)}</span>
            : <span className="appt-empty">—</span>}
        </div>

        {a.consumables.length > 0 && (
          <div className="appt-card__field appt-card__field--full">
            <span className="appt-card__field-label">Consumíveis</span>
            <div className="appt-card__tags">
              {a.consumables.map((c, i) => (
                <span className="appt-card__tag" key={i}>
                  {typeof c === 'object' ? c.name : c}
                </span>
              ))}
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

      {/* Rodapé — status */}
      <div className="appt-card__foot">
        <span className={`appt-card__status-badge appt-card__status-badge--${st.cls}`}>
          <i className={`ti ${st.icon}`} aria-hidden="true" />
          {st.label}
        </span>
        <StatusSelect
          status={a.status}
          onChange={(newStatus) => onStatusChange(a.id, newStatus)}
        />
      </div>

    </article>
  );
}