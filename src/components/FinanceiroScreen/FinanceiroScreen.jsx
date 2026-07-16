// ============================================
//  FinanceiroScreen.jsx — Mikael Barber
// ============================================

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { despesaService } from "../../services/api.js";
import "./FinanceiroScreen.css";

const COMMISSION = 0.4;

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
  if (unit === "day")  { d.setHours(0, 0, 0, 0); return d; }
  if (unit === "week") { d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0); return d; }
}

function startOfMonth(month, year) {
  return new Date(year, month, 1, 0, 0, 0, 0);
}

function endOfMonth(month, year) {
  return new Date(year, month + 1, 0, 23, 59, 59, 999);
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

export default function FinanceiroScreen({ appointments = [], adminUsername, currentBarber }) {
  const isAdminUser = currentBarber?.username === adminUsername;

  const [period,       setPeriod]       = useState("day");
  const [customFrom,   setCustomFrom]   = useState("");
  const [customTo,     setCustomTo]     = useState("");
  const [barberFilter, setBarberFilter] = useState("all");

  // ── Mês selecionado ──
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
  });

  const now = new Date();
  const isCurrentMonth =
    selectedMonth.month === now.getMonth() &&
    selectedMonth.year  === now.getFullYear();

  const goToPrevMonth = () =>
    setSelectedMonth((prev) => {
      const d = new Date(prev.year, prev.month - 1);
      return { month: d.getMonth(), year: d.getFullYear() };
    });

  const goToNextMonth = () =>
    setSelectedMonth((prev) => {
      const d = new Date(prev.year, prev.month + 1);
      return { month: d.getMonth(), year: d.getFullYear() };
    });

  const monthLabel = new Date(selectedMonth.year, selectedMonth.month)
    .toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  // ── Lista de barbeiros únicos para o filtro ──
  const barberOptions = useMemo(() => {
    const names = [...new Set(
      appointments
        .map((a) => a.barber_name || a.barber || "")
        .filter(Boolean)
    )].sort();
    return names;
  }, [appointments]);

  // ── Despesas ──
  const [expenses,    setExpenses]    = useState([]);
  const [expLoading,  setExpLoading]  = useState(false);
  const [expSaving,   setExpSaving]   = useState(false);
  const [expFetchErr, setExpFetchErr] = useState("");
  const [expDesc,     setExpDesc]     = useState("");
  const [expValue,    setExpValue]    = useState("");
  const [expQty,      setExpQty]      = useState("1");
  const [expError,    setExpError]    = useState("");
  const descRef = useRef(null);

  const fetchExpenses = useCallback(async () => {
    if (period === "custom" && (!customFrom || !customTo)) {
      setExpenses([]);
      return;
    }

    let fromParam = customFrom;
    let toParam   = customTo;

    if (period === "month") {
      fromParam = startOfMonth(selectedMonth.month, selectedMonth.year).toISOString().slice(0, 10);
      toParam   = endOfMonth(selectedMonth.month, selectedMonth.year).toISOString().slice(0, 10);
    }

    setExpLoading(true);
    setExpFetchErr("");
    try {
      const data = await despesaService.getAll(period, fromParam, toParam);
      setExpenses(Array.isArray(data) ? data : (data.despesas ?? []));
    } catch (err) {
      setExpFetchErr(err.message || "Erro ao carregar despesas.");
    } finally {
      setExpLoading(false);
    }
  }, [period, customFrom, customTo, selectedMonth]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  // ── Filtragem de atendimentos ──
  const filtered = useMemo(() => {
    return appointments
      .map((a) => normalize(a))
      .filter((a) => {
        if (!a.dateObj) return false;

        if (!isAdminUser) {
          if (a.barber?.toLowerCase() !== currentBarber?.name?.toLowerCase()) return false;
        }

        if (isAdminUser && barberFilter !== "all") {
          if (a.barber?.toLowerCase() !== barberFilter.toLowerCase()) return false;
        }

        if (period === "month") {
          const from = startOfMonth(selectedMonth.month, selectedMonth.year);
          const to   = endOfMonth(selectedMonth.month, selectedMonth.year);
          return a.dateObj >= from && a.dateObj <= to;
        }

        if (period === "custom") {
          if (!customFrom || !customTo) return true;
          const from = new Date(customFrom + "T00:00:00");
          const to   = new Date(customTo   + "T23:59:59");
          return a.dateObj >= from && a.dateObj <= to;
        }

        return a.dateObj >= startOf(period);
      });
  }, [appointments, period, customFrom, customTo, currentBarber, isAdminUser, barberFilter, selectedMonth]);

  const done = useMemo(() => filtered.filter((a) => a.status === "done"), [filtered]);

  const totalRevenue  = done.reduce((s, a) => s + a.price, 0);
  const salonRevenue  = totalRevenue * (1 - COMMISSION);
  const totalComm     = totalRevenue * COMMISSION;

  const totalExpenses = expenses.reduce(
    (s, e) => s + parseFloat(e.valor ?? e.value ?? 0) * (e.quantidade ?? 1),
    0
  );
  const netProfit = salonRevenue - totalExpenses;

  // Cards de comissão: exclui o admin
  const byBarber = useMemo(() => {
    const map = {};
    done.forEach((a) => {
      const isAdminRecord =
        a.barber?.toLowerCase() === currentBarber?.name?.toLowerCase() &&
        currentBarber?.username === adminUsername;
      if (isAdminRecord) return;
      if (!map[a.barber]) map[a.barber] = { name: a.barber, count: 0, total: 0 };
      map[a.barber].count++;
      map[a.barber].total += a.price;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [done, currentBarber, adminUsername]);

  const maxTotal = byBarber.length ? byBarber[0].total : 1;

  // ── Handlers de despesas ──
  async function handleAddExpense() {
    const desc = expDesc.trim();
    const val  = parseFloat(expValue.replace(",", "."));
    const qty  = parseInt(expQty, 10);

    if (!desc) { setExpError("Informe a descrição da despesa."); descRef.current?.focus(); return; }
    if (!expValue || isNaN(val) || val <= 0) { setExpError("Informe um valor válido maior que zero."); return; }
    if (isNaN(qty) || qty < 1) { setExpError("A quantidade deve ser pelo menos 1."); return; }

    setExpSaving(true);
    setExpError("");
    try {
      const created = await despesaService.create({ descricao: desc, valor: val, quantidade: qty });
      const newExp = created.despesa ?? created;
      setExpenses((prev) => [newExp, ...prev]);
      setExpDesc(""); setExpValue(""); setExpQty("1");
      descRef.current?.focus();
    } catch (err) {
      setExpError(err.message || "Erro ao salvar despesa.");
    } finally {
      setExpSaving(false);
    }
  }

  async function handleRemoveExpense(id) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    try {
      await despesaService.remove(id);
    } catch (err) {
      setExpFetchErr(err.message || "Erro ao remover despesa.");
      fetchExpenses();
    }
  }

  async function handleChangeQty(id, newQty) {
    const qty = Math.max(1, parseInt(newQty, 10) || 1);
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, quantidade: qty } : e)));
    try {
      await despesaService.updateQty(id, qty);
    } catch (err) {
      setExpFetchErr(err.message || "Erro ao atualizar quantidade.");
      fetchExpenses();
    }
  }

  function handleExpValueKey(e) {
    if (e.key === "Enter") handleAddExpense();
  }

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

      {/* ── Navegação de mês ── */}
      {period === "month" && (
        <div className="fin-month-nav">
          <button className="fin-month-nav__btn" onClick={goToPrevMonth} aria-label="Mês anterior">
            <i className="ti ti-chevron-left" aria-hidden="true" />
          </button>
          <span className="fin-month-nav__label">{monthLabel}</span>
          <button className="fin-month-nav__btn" onClick={goToNextMonth} disabled={isCurrentMonth} aria-label="Próximo mês">
            <i className="ti ti-chevron-right" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* ── Datas customizadas ── */}
      {period === "custom" && (
        <div className="fin-date-range">
          <input type="date" className="fin-date-input" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} aria-label="Data inicial" />
          <span className="fin-date-range__sep">até</span>
          <input type="date" className="fin-date-input" value={customTo} onChange={(e) => setCustomTo(e.target.value)} aria-label="Data final" />
        </div>
      )}

      {/* ── Filtro por barbeiro (só admin) ── */}
      {isAdminUser && barberOptions.length > 0 && (
        <div className="fin-barber-filter" role="group" aria-label="Filtro por barbeiro">
          <button
            className={`fin-barber-filter__btn${barberFilter === "all" ? " fin-barber-filter__btn--active" : ""}`}
            onClick={() => setBarberFilter("all")}
          >
            <i className="ti ti-users" aria-hidden="true" />
            Todos
          </button>
          {barberOptions.map((name) => (
            <button
              key={name}
              className={`fin-barber-filter__btn${barberFilter === name ? " fin-barber-filter__btn--active" : ""}`}
              onClick={() => setBarberFilter(name)}
            >
              <span className="fin-barber-filter__avatar">
                {name.charAt(0).toUpperCase()}
              </span>
              {name}
            </button>
          ))}
        </div>
      )}

      {/* ── Métricas ── */}
      <div className="fin-metrics">
        <MetricCard label="Atendimentos"      value={filtered.length} />
        <MetricCard label="Concluídos"        value={done.length} />
        <MetricCard label="Faturamento total" value={`R$ ${totalRevenue.toFixed(2)}`} />
        <MetricCard label="Líquido barbearia" value={`R$ ${salonRevenue.toFixed(2)}`}  variant="green" />
        <MetricCard label="Total comissões"   value={`R$ ${totalComm.toFixed(2)}`}     variant="amber" />
        <MetricCard label="Total despesas"    value={`R$ ${totalExpenses.toFixed(2)}`} variant="red" />
        <MetricCard
          label="Lucro líquido"
          value={`R$ ${netProfit.toFixed(2)}`}
          variant={netProfit >= 0 ? "green" : "red"}
        />
      </div>

      {/* ── Despesas ── */}
      <div className="fin-section-title">
        <i className="ti ti-receipt" aria-hidden="true" />
        Despesas
      </div>

      <div className="fin-expense-block">
        <div className="fin-expense-form">
          <input
            ref={descRef}
            type="text"
            className="fin-expense-input fin-expense-input--desc"
            placeholder="Descrição da despesa…"
            value={expDesc}
            onChange={(e) => { setExpDesc(e.target.value); setExpError(""); }}
            aria-label="Descrição da despesa"
            maxLength={80}
            disabled={expSaving}
          />
          <input
            type="number"
            className="fin-expense-input fin-expense-input--val"
            placeholder="R$ 0,00"
            value={expValue}
            onChange={(e) => { setExpValue(e.target.value); setExpError(""); }}
            onKeyDown={handleExpValueKey}
            aria-label="Valor unitário"
            min="0"
            step="0.01"
            disabled={expSaving}
          />
          <input
            type="number"
            className="fin-expense-input fin-expense-input--qty"
            placeholder="Qtd"
            value={expQty}
            onChange={(e) => { setExpQty(e.target.value); setExpError(""); }}
            onKeyDown={handleExpValueKey}
            aria-label="Quantidade"
            min="1"
            step="1"
            disabled={expSaving}
          />
          <button className="fin-expense-add-btn" onClick={handleAddExpense} aria-label="Adicionar despesa" disabled={expSaving}>
            {expSaving ? <i className="ti ti-loader-2 ti-spin" aria-hidden="true" /> : <i className="ti ti-plus" aria-hidden="true" />}
            {expSaving ? "Salvando…" : "Adicionar"}
          </button>
        </div>

        {expError && (
          <div className="fin-expense-error" role="alert">
            <i className="ti ti-alert-circle" aria-hidden="true" />
            {expError}
          </div>
        )}

        {expFetchErr && (
          <div className="fin-expense-error" role="alert">
            <i className="ti ti-alert-circle" aria-hidden="true" />
            {expFetchErr}
            <button className="fin-expense-retry-btn" onClick={() => { setExpFetchErr(""); fetchExpenses(); }} aria-label="Tentar novamente">
              Tentar novamente
            </button>
          </div>
        )}

        {expLoading ? (
          <div className="fin-empty fin-empty--sm">
            <i className="ti ti-loader-2 ti-spin fin-empty__icon" aria-hidden="true" />
            <div>Carregando despesas…</div>
          </div>
        ) : expenses.length === 0 ? (
          <div className="fin-empty fin-empty--sm">
            <i className="ti ti-receipt-off fin-empty__icon" aria-hidden="true" />
            <div>Nenhuma despesa registrada</div>
          </div>
        ) : (
          <ul className="fin-expense-list" aria-label="Lista de despesas">
            {expenses.map((e) => {
              const valor    = parseFloat(e.valor ?? e.value ?? 0);
              const qty      = e.quantidade ?? 1;
              const subtotal = valor * qty;
              const createdAt = e.created_at ? new Date(e.created_at) : null;
              return (
                <li key={e.id} className="fin-expense-item">
                  <div className="fin-expense-item__left">
                    <i className="ti ti-minus-vertical fin-expense-item__dot" aria-hidden="true" />
                    <span className="fin-expense-item__desc">{e.descricao ?? e.desc}</span>
                    {createdAt && (
                      <span className="fin-expense-item__date">
                        {createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                  <div className="fin-expense-item__right">
                    <div className="fin-expense-qty" aria-label="Quantidade">
                      <button className="fin-expense-qty__btn" onClick={() => handleChangeQty(e.id, qty - 1)} disabled={qty <= 1} aria-label="Diminuir quantidade">
                        <i className="ti ti-minus" aria-hidden="true" />
                      </button>
                      <span className="fin-expense-qty__val">{qty}</span>
                      <button className="fin-expense-qty__btn" onClick={() => handleChangeQty(e.id, qty + 1)} aria-label="Aumentar quantidade">
                        <i className="ti ti-plus" aria-hidden="true" />
                      </button>
                    </div>
                    <span className="fin-expense-item__val">− R$ {subtotal.toFixed(2)}</span>
                    <button className="fin-expense-remove-btn" onClick={() => handleRemoveExpense(e.id)} aria-label={`Remover despesa ${e.descricao ?? e.desc}`}>
                      <i className="ti ti-trash" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
            <li className="fin-expense-total-row" aria-label="Total de despesas">
              <span className="fin-expense-total-row__label">Total de despesas</span>
              <span className="fin-expense-total-row__val">R$ {totalExpenses.toFixed(2)}</span>
            </li>
          </ul>
        )}
      </div>

      {/* ── Comissão por barbeiro (exclui admin) ── */}
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
                  <span className="fin-barber-card__row-label">Comissão (40%)</span>
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
              {filtered.map((a) => {
                const isAdminRecord =
                  a.barber?.toLowerCase() === currentBarber?.name?.toLowerCase() &&
                  isAdminUser;
                return (
                  <tr key={a.id}>
                    <td>{a.clientName || "-"}</td>
                    <td>{a.barber    || "-"}</td>
                    <td>{a.cut      || "-"}</td>
                    <td>{a.dateObj ? a.dateObj.toLocaleDateString("pt-BR") : "-"}</td>
                    <td>R$ {a.price.toFixed(2)}</td>
                    <td>
                      {a.status === "done" && !isAdminRecord
                        ? `R$ ${(a.price * COMMISSION).toFixed(2)}`
                        : "-"}
                    </td>
                    <td><StatusBadge status={a.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}