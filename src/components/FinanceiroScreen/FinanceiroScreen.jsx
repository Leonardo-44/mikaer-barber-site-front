// ============================================
//  FinanceiroScreen.jsx — Mikael Barber
// ============================================

import { useState, useMemo } from "react";
import "./FinanceiroScreen.css";

const COMMISSION = 0.5;

const PERIODS = [
  { value: "day",    label: "Hoje"          },
  { value: "week",   label: "Esta semana"   },
  { value: "month",  label: "Este mês"      },
  { value: "custom", label: "Personalizado" },
];

function normalize(a) {
  return {
    ...a,
    clientName: a.client_name  || a.clientName  || "",
    barber:     a.barber_name  || a.barber      || "",
    cut:        a.haircut      || a.cut         || "",
    price:      parseFloat(a.total_price || a.price || 0),
    dateObj:    a.scheduled_at ? new Date(a.scheduled_at) : null,
  };
}

function startOf(unit) {
  const d = new Date();
  if (unit === "day")   { d.setHours(0, 0, 0, 0); return d; }
  if (unit === "week")  { d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); return d; }
  if (unit === "month") { d.setDate(1); d.setHours(0, 0, 0, 0); return d; }
}

function isAdmin(barberName, adminUsername) {
  if (!adminUsername || !barberName) return false;
  return barberName.toLowerCase() === adminUsername.toLowerCase();
}

function MetricCard({ label, value, variant }) {
  return (
    <div className="fin-metric">
      <div className="fin-metric__label">{label}</div>
      <div className={`fin-metric__value${variant ? ` fin-metric__value--${variant}` : ""}`}>
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    done:      { label: "Concluído",  cls: "done"      },
    pending:   { label: "Pendente",   cls: "pending"   },
    cancelled: { label: "Cancelado",  cls: "cancelled" },
  };
  const s = map[status] || { label: status, cls: "" };
  return <span className={`fin-badge fin-badge--${s.cls}`}>{s.label}</span>;
}

const AVATAR_COLORS = ["info", "warning", "success", "danger"];

export default function FinanceiroScreen({ appointments = [], adminUsername }) {
  const [period,     setPeriod]     = useState("day");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo,   setCustomTo]   = useState("");

  // Normaliza, exclui admin e filtra por período — fonte única de verdade
  const filtered = useMemo(() => {
    return appointments
      .map(normalize)
      .filter((a) => {
        if (!a.dateObj) return false;
        if (isAdmin(a.barber, adminUsername)) return false;

        if (period === "custom") {
          if (!customFrom || !customTo) return true;
          const from = new Date(customFrom + "T00:00:00");
          const to   = new Date(customTo   + "T23:59:59");
          return a.dateObj >= from && a.dateObj <= to;
        }
        return a.dateObj >= startOf(period);
      });
  }, [appointments, period, customFrom, customTo, adminUsername]);

  const done = useMemo(
    () => filtered.filter((a) => a.status === "done"),
    [filtered]
  );

  const totalRevenue = done.reduce((s, a) => s + a.price, 0);
  const salonRevenue = totalRevenue * (1 - COMMISSION);
  const totalComm    = totalRevenue * COMMISSION;

  const byBarber = useMemo(() => {
    const map = {};
    done.forEach((a) => {
      if (!map[a.barber]) map[a.barber] = { name: a.barber, count: 0, total: 0 };
      map[a.barber].count++;
      map[a.barber].total += a.price;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [done]);

  const maxTotal = byBarber.length ? byBarber[0].total : 1;

  return (
    <div className="fin">

      {/* ── Filtro de período ── */}
      <div className="fin-period-bar" role="group" aria-label="Filtro de período">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            className={`fin-period-btn${period === p.value ? " fin-period-btn--active" : ""}`}
            onClick={() => setPeriod(p.value)}
            aria-pressed={period === p.value}
          >
            {p.label}
          </button>
        ))}
      </div>

      {period === "custom" && (
        <div className="fin-date-range">
          <input
            type="date"
            className="fin-date-input"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            aria-label="Data inicial"
          />
          <span className="fin-date-range__sep">até</span>
          <input
            type="date"
            className="fin-date-input"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            aria-label="Data final"
          />
        </div>
      )}

      {/* ── Métricas ── */}
      <div className="fin-metrics">
        <MetricCard label="Atendimentos"      value={filtered.length} />
        <MetricCard label="Concluídos"        value={done.length} />
        <MetricCard label="Faturamento total" value={`R$ ${totalRevenue.toFixed(2)}`} />
        <MetricCard label="Líquido barbearia" value={`R$ ${salonRevenue.toFixed(2)}`} variant="green" />
        <MetricCard label="Total comissões"   value={`R$ ${totalComm.toFixed(2)}`}    variant="amber" />
      </div>

      {/* ── Comissão por barbeiro ── */}
      <div className="fin-section-title">
        <i className="ti ti-users" aria-hidden="true" />
        Comissão por barbeiro
      </div>

      {byBarber.length === 0 ? (
        <div className="fin-empty">
          <i className="ti ti-user-off fin-empty__icon" aria-hidden="true" />
          <div>Nenhum atendimento concluído no período</div>
        </div>
      ) : (
        <div className="fin-barber-cards">
          {byBarber.map((b, i) => {
            const comm  = b.total * COMMISSION;
            const pct   = Math.round((b.total / maxTotal) * 100);
            const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
            return (
              <div key={b.name} className="fin-barber-card">
                <div className="fin-barber-card__header">
                  <div className={`fin-avatar fin-avatar--${color}`}>
                    {b.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="fin-barber-card__name">{b.name}</div>
                    <div className="fin-barber-card__count">
                      {b.count} atendimento{b.count !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>

                <div className="fin-barber-card__row">
                  <span className="fin-barber-card__row-label">Faturou</span>
                  <span className="fin-barber-card__row-val">R$ {b.total.toFixed(2)}</span>
                </div>
                <div className="fin-barber-card__row">
                  <span className="fin-barber-card__row-label">Comissão (50%)</span>
                  <span className="fin-barber-card__row-val fin-barber-card__row-val--green">
                    R$ {comm.toFixed(2)}
                  </span>
                </div>

                <div className="fin-bar-wrap" aria-hidden="true">
                  <div className="fin-bar-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Tabela ── */}
      <div className="fin-section-title" style={{ marginTop: "1.5rem" }}>
        <i className="ti ti-list" aria-hidden="true" />
        Atendimentos no período
      </div>

      <div className="fin-table-wrap">
        {filtered.length === 0 ? (
          <div className="fin-empty">
            <i className="ti ti-calendar-off fin-empty__icon" aria-hidden="true" />
            <div>Nenhum atendimento no período selecionado</div>
          </div>
        ) : (
          <table className="fin-table" aria-label="Atendimentos no período">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Barbeiro</th>
                <th>Corte</th>
                <th>Data</th>
                <th>Total</th>
                <th>Comissão</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td>{a.clientName || "-"}</td>
                  <td>{a.barber    || "-"}</td>
                  <td>{a.cut      || "-"}</td>
                  <td>{a.dateObj ? a.dateObj.toLocaleDateString("pt-BR") : "-"}</td>
                  <td>R$ {a.price.toFixed(2)}</td>
                  <td>
                    {a.status === "done"
                      ? `R$ ${(a.price * COMMISSION).toFixed(2)}`
                      : "-"}
                  </td>
                  <td><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}