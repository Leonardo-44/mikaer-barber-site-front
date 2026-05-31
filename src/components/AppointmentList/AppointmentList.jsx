// ============================================
//  AppointmentList.jsx — Mikael Barber
// ============================================

import { useState } from "react";
import AppointmentCard from "../AppointmentCard/AppointmentCard";
import "./AppointmentList.css";

function normalize(a) {
  return {
    ...a,
    clientName: a.client_name || a.clientName || "",
    clientPhone: a.client_phone || a.clientPhone || "",
    cut: a.cut || a.haircut || "",
    price: a.total_price || a.price || 0,
    consumables: Array.isArray(a.consumables) ? a.consumables : [],
    obs: a.obs || a.notes || "",
    barber: a.barber_name || a.barber || "",
    date: a.scheduled_at
      ? new Date(a.scheduled_at).toLocaleDateString("pt-BR")
      : a.date || "",
    time: a.scheduled_at
      ? new Date(a.scheduled_at).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : a.time || "",
    // ISO para comparar com input[type=date]
    dateISO: a.scheduled_at
      ? new Date(a.scheduled_at).toISOString().slice(0, 10)
      : "",
  };
}

const FILTERS = [
  { value: "all",       label: "Todos"      },
  { value: "pending",   label: "Pendentes"  },
  { value: "done",      label: "Concluídos" },
  { value: "cancelled", label: "Cancelados" },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function DeleteModal({ onConfirm, onCancel }) {
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="del-title"
    >
      <div className="modal-card modal-card--sm slide-up">
        <div className="modal-header">
          <div className="modal-header__icon modal-header__icon--danger" aria-hidden="true">
            <i className="ti ti-trash" />
          </div>
          <div>
            <h2 className="modal-header__title" id="del-title">Remover atendimento</h2>
            <p className="modal-header__sub">Essa ação não pode ser desfeita</p>
          </div>
          <button className="modal-close" onClick={onCancel} aria-label="Fechar">
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>
        <div className="modal-divider" />
        <p className="modal-confirm__text">
          Tem certeza que deseja remover este atendimento permanentemente?
        </p>
        <div className="modal-footer">
          <button className="modal-btn modal-btn--cancel" onClick={onCancel}>Cancelar</button>
          <button className="modal-btn modal-btn--danger" onClick={onConfirm}>
            <i className="ti ti-trash" aria-hidden="true" /> Remover
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppointmentList({
  appointments = [],
  loading,
  onDelete,
  onStatusChange,
  onEdit,
}) {
  const [search,        setSearch]        = useState("");
  const [filter,        setFilter]        = useState("all");
  const [dateFilter,    setDateFilter]    = useState("");   // "" = todos os dias
  const [confirmDelete, setConfirmDelete] = useState(null);

  const normalized = appointments.map(normalize);

  const filtered = normalized.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch =
      a.clientName.toLowerCase().includes(q) ||
      a.cut.toLowerCase().includes(q) ||
      a.barber.toLowerCase().includes(q) ||
      a.clientPhone.includes(q);
    const matchStatus = filter === "all" || a.status === filter;
    const matchDate   = !dateFilter || a.dateISO === dateFilter;
    return matchSearch && matchStatus && matchDate;
  });

  const totalRevenue = filtered
    .filter((a) => a.status === "done")
    .reduce((sum, a) => sum + parseFloat(a.price || 0), 0);

  const counts = normalized.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  const isToday = dateFilter === todayISO();

  const setToday = () =>
    setDateFilter((prev) => (prev === todayISO() ? "" : todayISO()));

  const handleDeleteConfirm = () => {
    onDelete(confirmDelete);
    setConfirmDelete(null);
  };

  if (loading) {
    return (
      <div className="appt-list-loading">
        <i className="ti ti-loader-2 spin" aria-hidden="true" />
        <span>Carregando agendamentos…</span>
      </div>
    );
  }

  return (
    <div className="appt-list fade-in">

      {/* ── Toolbar ── */}
      <div className="appt-toolbar">
        <div className="appt-search-wrap">
          <i className="ti ti-search" aria-hidden="true" />
          <input
            className="appt-search"
            type="text"
            placeholder="Buscar cliente, corte, barbeiro…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar agendamentos"
          />
          {search && (
            <button
              className="appt-search-clear"
              onClick={() => setSearch("")}
              aria-label="Limpar busca"
            >
              <i className="ti ti-x" />
            </button>
          )}
        </div>

        {/* ── Filtro de data ── */}
        <div className="appt-date-wrap">
          <button
            className={`appt-today-btn${isToday ? " appt-today-btn--active" : ""}`}
            onClick={setToday}
            title={isToday ? "Mostrando só hoje — clique para ver todos" : "Ver só os de hoje"}
          >
            <i className="ti ti-calendar-event" aria-hidden="true" />
            Hoje
          </button>

          <div className="appt-date-input-wrap">
            <i className="ti ti-calendar" aria-hidden="true" />
            <input
              type="date"
              className="appt-date-input"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="Filtrar por data"
            />
            {dateFilter && (
              <button
                className="appt-date-clear"
                onClick={() => setDateFilter("")}
                aria-label="Limpar filtro de data"
              >
                <i className="ti ti-x" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Chips de status ── */}
      <div className="appt-filters" role="group" aria-label="Filtrar por status">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={`appt-filter-chip${filter === f.value ? " appt-filter-chip--active" : ""} appt-filter-chip--${f.value}`}
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
          >
            {f.label}
            {f.value !== "all" && counts[f.value] > 0 && (
              <span className="appt-filter-chip__count">{counts[f.value]}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Label da data ativa ── */}
      {dateFilter && (
        <div className="appt-date-label">
          <i className="ti ti-filter" aria-hidden="true" />
          {isToday
            ? "Mostrando atendimentos de hoje"
            : `Mostrando: ${new Date(dateFilter + "T12:00:00").toLocaleDateString("pt-BR", {
                weekday: "long", day: "2-digit", month: "long",
              })}`}
          <button
            className="appt-date-label__clear"
            onClick={() => setDateFilter("")}
            aria-label="Remover filtro de data"
          >
            LIMPAR
          </button>
        </div>
      )}

      {/* ── Grid de cards ── */}
      {filtered.length === 0 ? (
        <div className="appt-empty-state">
          <i className="ti ti-calendar-off appt-empty-state__icon" aria-hidden="true" />
          <div className="appt-empty-state__title">Nenhum atendimento encontrado</div>
          <p className="appt-empty-state__sub">
            {search || filter !== "all" || dateFilter
              ? "Tente ajustar os filtros ou a busca."
              : "Registre o primeiro atendimento pelo menu ao lado."}
          </p>
        </div>
      ) : (
        <div className="appt-grid">
          {filtered.map((a) => (
            <AppointmentCard
              key={a.id}
              appointment={a}
              onDelete={(id) => setConfirmDelete(id)}
              onStatusChange={onStatusChange}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}

      {/* ── Rodapé ── */}
      {filtered.length > 0 && (
        <div className="appt-list-footer">
          <span className="appt-list-footer__count">
            {filtered.length} atendimento{filtered.length !== 1 ? "s" : ""}
            {dateFilter && " nesta data"}
          </span>
          {totalRevenue > 0 && (
            <div className="appt-list-footer__revenue">
              <span className="appt-list-footer__revenue-label">Faturamento filtrado</span>
              <span className="appt-list-footer__revenue-value">
                R$ {totalRevenue.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}

      {confirmDelete && (
        <DeleteModal
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}