// ============================================
//  AppointmentList.jsx — Mikael Barber
// ============================================

import { useState } from 'react';
import './AppointmentList.css';

const STATUS_LABELS = {
  done:      'Concluído',
  pending:   'Pendente',
  cancelled: 'Cancelado',
};

function StatusSelect({ status, onChange }) {
  return (
    <select
      className={`status-select status-select--${status}`}
      value={status}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Alterar status"
    >
      <option value="done">✔ Concluído</option>
      <option value="pending">⏳ Pendente</option>
      <option value="cancelled">✖ Cancelado</option>
    </select>
  );
}

export default function AppointmentList({ appointments, onDelete, onStatusChange }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = appointments.filter((a) => {
    const matchSearch =
      a.clientName.toLowerCase().includes(search.toLowerCase()) ||
      a.cut.toLowerCase().includes(search.toLowerCase()) ||
      a.barber?.toLowerCase().includes(search.toLowerCase());

    const matchFilter = filter === 'all' || a.status === filter;
    return matchSearch && matchFilter;
  });

  const totalRevenue = filtered
    .filter((a) => a.status === 'done' && a.price)
    .reduce((sum, a) => sum + parseFloat(a.price || 0), 0);

  return (
    <div className="fade-in">
      {/* Toolbar */}
      <div className="list-toolbar">
        <div className="list-search-wrap">
          <i className="ti ti-search" aria-hidden="true" />
          <input
            className="list-search"
            type="text"
            placeholder="Buscar por cliente, corte ou barbeiro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="list-filter-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filtrar por status"
        >
          <option value="all">Todos os status</option>
          <option value="done">Concluídos</option>
          <option value="pending">Pendentes</option>
          <option value="cancelled">Cancelados</option>
        </select>

        <span className="list-count">
          <strong>{filtered.length}</strong> registro(s)
        </span>
      </div>

      {/* Tabela */}
      <div className="appt-table-wrapper">
        {filtered.length === 0 ? (
          <div className="list-empty">
            <i className="ti ti-calendar-off list-empty__icon" aria-hidden="true" />
            <div className="list-empty__title">Nenhum atendimento encontrado</div>
            <p className="list-empty__sub">
              {search || filter !== 'all'
                ? 'Tente ajustar os filtros de busca.'
                : 'Registre o primeiro atendimento do dia!'}
            </p>
          </div>
        ) : (
          <table className="appt-table" role="table">
            <thead>
              <tr>
                <th className="col-client">Cliente</th>
                <th className="col-cut">Corte</th>
                <th className="col-cons">Consumíveis</th>
                <th className="col-barber">Barbeiro</th>
                <th className="col-date">Data / Hora</th>
                <th className="col-price">Valor</th>
                <th className="col-status">Status</th>
                <th className="col-actions" aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className="cell-client__name">{a.clientName}</div>
                    {a.clientPhone && (
                      <div className="cell-client__phone">{a.clientPhone}</div>
                    )}
                  </td>

                  <td>
                    <span className="cut-badge">{a.cut}</span>
                  </td>

                  <td>
                    {a.consumables && a.consumables.length > 0 ? (
                      <div className="cons-tags">
                        {a.consumables.map((c) => (
                          <span className="cons-tag" key={c}>{c}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="cons-empty">—</span>
                    )}
                  </td>

                  <td style={{ color: 'var(--gray-light)', fontSize: 12 }}>
                    {a.barber}
                  </td>

                  <td style={{ fontSize: 12, color: 'var(--gray-light)' }}>
                    <div>{a.date}</div>
                    {a.time && (
                      <div style={{ color: 'var(--gray-2)', fontSize: 11 }}>{a.time}</div>
                    )}
                  </td>

                  <td>
                    {a.price
                      ? <span className="cell-price">R$ {parseFloat(a.price).toFixed(2)}</span>
                      : <span className="cons-empty">—</span>
                    }
                  </td>

                  {/* ✅ Select inline no lugar do badge estático */}
                  <td>
                    <StatusSelect
                      status={a.status}
                      onChange={(newStatus) => onStatusChange(a.id, newStatus)}
                    />
                  </td>

                  <td>
                    <button
                      className="action-btn"
                      onClick={() => onDelete(a.id)}
                      aria-label={`Remover atendimento de ${a.clientName}`}
                      title="Remover"
                    >
                      <i className="ti ti-trash" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="list-footer">
          <span className="list-footer__total">
            {filtered.length} atendimento(s) exibido(s)
          </span>
          {totalRevenue > 0 && (
            <div>
              <span className="list-footer__revenue-label">Faturamento filtrado</span>
              <span className="list-footer__revenue">
                R$ {totalRevenue.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}