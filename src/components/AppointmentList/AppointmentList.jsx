// ============================================
//  AppointmentList.jsx — Mikael Barber
// ============================================

import { useState } from "react";
import AppointmentCard from "../AppointmentCard/AppointmentCard";
import DeleteAppointmentModal from "../DeleteAppointmentModal/DeleteAppointmentModal";
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
    dateISO: a.scheduled_at
      ? new Date(a.scheduled_at).toISOString().slice(0, 10)
      : "",
  };
}

const FILTERS = [
  { value: "all",       label: "Todos" },
  { value: "pending",   label: "Pendentes" },
  { value: "done",      label: "Concluídos" },
  { value: "cancelled", label: "Cancelados" },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function AppointmentList({
  appointments = [],
  loading,
  onDelete,
  onStatusChange,
  onEdit,
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
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
    const matchDate = !dateFilter || a.dateISO === dateFilter;
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
            title={isToday ? "Ver todos" : "Ver só os de hoje"}
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
            className={`appt-filter-chip appt-filter-chip--${f.value}${filter === f.value ? " appt-filter-chip--active" : ""}`}
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
                weekday: "long",
                day: "2-digit",
                month: "long",
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

      {/* ── Grid ── */}
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

      {/* ── Modal de exclusão ── */}
      {confirmDelete && (
        <DeleteAppointmentModal
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}