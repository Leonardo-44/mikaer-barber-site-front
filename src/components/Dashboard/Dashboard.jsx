// ============================================
//  Dashboard.jsx — Mikael Barber (Responsivo melhorado)
// ============================================

import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import { appointmentService, authService } from "../../services/api";

import AppointmentForm from "../AppointmentForm/AppointmentForm";
import AppointmentList from "../AppointmentList/AppointmentList";
import ProductList from "../ProductList/ProductList";
import "./Dashboard.css";

const INITIAL_BARBERS = [];

const NAV_ITEMS = [
  { id: "produtos", label: "Produtos", icon: "ti-package" },
  { id: "novo", label: "Novo Atendimento", icon: "ti-plus" },
  { id: "lista", label: "Agendamentos", icon: "ti-calendar" }
];

// ── Avatar com inicial do nome ────────────────────
function BarberAvatar({ name, size = 32 }) {
  return (
    <div
      className="barber-avatar"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
      aria-hidden="true"
    >
      {(name || "?").charAt(0).toUpperCase()}
    </div>
  );
}

// ── Modal de confirmação de remoção ───────────────
function ConfirmModal({ barber, onConfirm, onCancel }) {
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div className="modal-card modal-card--sm slide-up">
        <div className="modal-header">
          <div
            className="modal-header__icon modal-header__icon--danger"
            aria-hidden="true"
          >
            <i className="ti ti-alert-triangle" />
          </div>
          <div>
            <h2 className="modal-header__title" id="confirm-title">
              Remover barbeiro
            </h2>
            <p className="modal-header__sub">Essa ação não pode ser desfeita</p>
          </div>
          <button
            className="modal-close"
            onClick={onCancel}
            aria-label="Fechar"
          >
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>
        <div className="modal-divider" />
        <p className="modal-confirm__text">
          Tem certeza que deseja remover <strong>{barber.name}</strong>{" "}
          <span className="modal-confirm__user">@{barber.username}</span>?
        </p>
        <div className="modal-footer">
          <button className="modal-btn modal-btn--cancel" onClick={onCancel}>
            Cancelar
          </button>
          <button className="modal-btn modal-btn--danger" onClick={onConfirm}>
            <i className="ti ti-trash" aria-hidden="true" /> Remover
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal de criar barbeiro ───────────────────────
function BarberModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: "", username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Informe o nome";
    if (!form.username.trim()) e.username = "Informe o usuário";
    if (form.password.length < 4) e.password = "Mínimo 4 caracteres";
    return e;
  };

  const handleChange = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
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
      // ✅ Chama o backend de verdade
      const data = await authService.createBarber({
        name: form.name.trim(),
        username: form.username.trim(),
        password: form.password,
      });

      onSave(
        data.barber || {
          name: form.name.trim(),
          username: form.username.trim(),
        },
      );
    } catch (err) {
      // Mostra erro dentro do modal (ex: usuário já existe)
      setErrors({ username: err.message || "Erro ao criar barbeiro" });
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleSave();
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-card slide-up">
        <div className="modal-header">
          <div className="modal-header__icon" aria-hidden="true">
            <i className="ti ti-user-plus" />
          </div>
          <div>
            <h2 className="modal-header__title" id="modal-title">
              Novo Barbeiro
            </h2>
            <p className="modal-header__sub">Acesso restrito ao painel</p>
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Fechar modal"
          >
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>

        <div className="modal-divider" />

        <div className="modal-avatar-preview">
          <BarberAvatar name={form.name || "?"} size={52} />
          <div className="modal-avatar-preview__info">
            <span className="modal-avatar-preview__name">
              {form.name.trim() || "Nome do barbeiro"}
            </span>
            {form.username.trim() && (
              <span className="modal-avatar-preview__user">
                @{form.username.trim()}
              </span>
            )}
          </div>
        </div>

        <div className="modal-body">
          <div
            className={`modal-field${errors.name ? " modal-field--error" : ""}`}
          >
            <label className="modal-field__label" htmlFor="barber-name">
              Nome
            </label>
            <div className="modal-field__wrapper">
              <i className="ti ti-user modal-field__icon" aria-hidden="true" />
              <input
                id="barber-name"
                className="modal-field__input"
                type="text"
                placeholder="Ex: João"
                value={form.name}
                onChange={handleChange("name")}
                onKeyDown={handleKey}
                autoFocus
                aria-required="true"
                aria-invalid={!!errors.name}
              />
            </div>
            {errors.name && (
              <span className="modal-field__hint">{errors.name}</span>
            )}
          </div>

          <div
            className={`modal-field${errors.username ? " modal-field--error" : ""}`}
          >
            <label className="modal-field__label" htmlFor="barber-username">
              Usuário (login)
            </label>
            <div className="modal-field__wrapper">
              <i className="ti ti-at modal-field__icon" aria-hidden="true" />
              <input
                id="barber-username"
                className="modal-field__input"
                type="text"
                placeholder="Ex: joao"
                value={form.username}
                onChange={handleChange("username")}
                onKeyDown={handleKey}
                autoComplete="off"
                aria-required="true"
                aria-invalid={!!errors.username}
              />
            </div>
            {errors.username && (
              <span className="modal-field__hint">{errors.username}</span>
            )}
          </div>

          <div
            className={`modal-field${errors.password ? " modal-field--error" : ""}`}
          >
            <label className="modal-field__label" htmlFor="barber-password">
              Senha
            </label>
            <div className="modal-field__wrapper">
              <i className="ti ti-lock modal-field__icon" aria-hidden="true" />
              <input
                id="barber-password"
                className="modal-field__input"
                type={showPass ? "text" : "password"}
                placeholder="Mínimo 4 caracteres"
                value={form.password}
                onChange={handleChange("password")}
                onKeyDown={handleKey}
                autoComplete="new-password"
                aria-required="true"
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                className="modal-field__toggle"
                onClick={() => setShowPass((p) => !p)}
                aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
              >
                <i
                  className={`ti ti-eye${showPass ? "-off" : ""}`}
                  aria-hidden="true"
                />
              </button>
            </div>
            {errors.password && (
              <span className="modal-field__hint">{errors.password}</span>
            )}
          </div>
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
                <i className="ti ti-check" aria-hidden="true" /> Criar barbeiro
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard principal ───────────────────────────
export default function Dashboard() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { barber, logout } = auth || {};

  const isAdmin = barber?.username === import.meta.env.VITE_ADMIN_USERNAME;

  const [tab, setTab] = useState("novo");
  const [appointments, setAppointments] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(true);
  const [barbers, setBarbers] = useState(INITIAL_BARBERS);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [showBarberModal, setShowBarberModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  const todayStr = new Date().toLocaleDateString("pt-BR");

  const todayCount = appointments.filter((a) => {
    const dateStr = a.scheduled_at
      ? new Date(a.scheduled_at).toLocaleDateString("pt-BR")
      : a.date || "";
    return dateStr === todayStr;
  }).length;

  const totalRevenue = appointments
    .filter((a) => a.status === "done")
    .reduce((sum, a) => sum + parseFloat(a.total_price || a.price || 0), 0);

  // ── Busca agendamentos do backend ao montar ──
  useEffect(() => {
    appointmentService
      .getAll(isAdmin)
      .then((data) => {
        const list = Array.isArray(data) ? data : data.appointments || [];
        setAppointments(list);
      })
      .catch(() => fireToast("Erro ao carregar agendamentos."))
      .finally(() => setLoadingAppts(false));
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    authService
      .getBarbers()
      .then((data) => setBarbers(data.barbers || []))
      .catch(() => fireToast("Erro ao carregar barbeiros."));
  }, [isAdmin]); // 👈 adiciona isAdmin como dependência

  // ── Fecha drawer ao pressionar Escape ──
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape" && sidebarOpen) setSidebarOpen(false);
    },
    [sidebarOpen],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // ── Bloqueia scroll enquanto drawer está aberto ──
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const closeSidebar = () => setSidebarOpen(false);

  const handleNavClick = (id) => {
    setTab(id);
    closeSidebar();
  };

  const fireToast = (msg) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  // ── Salva no backend e atualiza estado local ──
  const handleSaved = (appointment) => {
    setAppointments((prev) => [appointment, ...prev]);
    fireToast("Atendimento registrado com sucesso!");
    setTab("lista");
  };

  // ── Remove no backend e atualiza estado local ──
  const handleDelete = async (id) => {
    try {
      await appointmentService.remove(id);
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    } catch {
      fireToast("Erro ao remover atendimento.");
    }
  };

  // ── Atualiza status no backend e no estado local ──
  const handleStatusChange = async (id, newStatus) => {
    try {
      await appointmentService.update(id, { status: newStatus });
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)),
      );
    } catch {
      fireToast("Erro ao atualizar status.");
    }
  };

  const handleBarberSaved = (newBarber) => {
    setBarbers((prev) => [...prev, newBarber]);
    setShowBarberModal(false);
    fireToast(`Barbeiro "${newBarber.name}" criado com sucesso!`);
  };

  const confirmBarberDelete = () => {
    setBarbers((prev) => prev.filter((b) => b.id !== confirmDelete.id));
    fireToast(`Barbeiro "${confirmDelete.name}" removido.`);
    setConfirmDelete(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  if (!auth) {
    return (
      <div className="dashboard-loading">
        <i className="ti ti-loader-2 spin" aria-hidden="true" />
        Carregando…
      </div>
    );
  }

  const handleEdit = (updated) => {
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id !== updated.id) return a;
        const scheduled = updated.scheduled_at
          ? new Date(updated.scheduled_at)
          : null;
        return {
          ...a,
          ...updated,
          barber_name: updated.barber_name || a.barber_name,
          client_name: updated.client_name || a.client_name,
          client_phone: updated.client_phone || a.client_phone,
          total_price: updated.total_price || a.total_price,
          consumables: Array.isArray(updated.consumables)
            ? updated.consumables
            : updated.consumables
              ? JSON.parse(updated.consumables)
              : a.consumables,
          date: scheduled ? scheduled.toLocaleDateString("pt-BR") : a.date,
          time: scheduled
            ? scheduled.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : a.time,
        };
      }),
    );
    fireToast("Atendimento atualizado com sucesso!");
  };

  return (
    <div className="dashboard">
      {/* ── Header ── */}
      <header className="dash-header">
        <Link
          to="/"
          className="dash-header__brand"
          aria-label="Voltar à página inicial"
        >
          <i className="ti ti-cut" aria-hidden="true" />
          MIKAEL BARBER
        </Link>

        <div className="dash-header__right">
          <span className="dash-header__date">{today}</span>

          <div className="dash-header__user">
            <BarberAvatar name={barber?.name} size={30} />
            <span className="dash-header__user-name">
              {barber?.name || "Barbeiro"}
            </span>
            {isAdmin && <span className="dash-header__badge">Admin</span>}
          </div>

          <button className="dash-logout-btn" onClick={handleLogout}>
            <i className="ti ti-logout" aria-hidden="true" />
            <span>Sair</span>
          </button>

          <button
            className="dash-header__menu-btn"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label={sidebarOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={sidebarOpen}
            aria-controls="dash-sidebar"
          >
            <i
              className={`ti ${sidebarOpen ? "ti-x" : "ti-menu-2"}`}
              aria-hidden="true"
            />
          </button>
        </div>
      </header>

      <div className="dash-body">
        {/* Overlay escurecido — clica para fechar no mobile */}
        <div
          className={`sidebar-overlay${sidebarOpen ? " is-open" : ""}`}
          onClick={closeSidebar}
          aria-hidden="true"
        />

        {/* ── Sidebar / Drawer ── */}
        <aside
          id="dash-sidebar"
          className={`dash-sidebar${sidebarOpen ? " is-open" : ""}`}
          aria-label="Menu lateral"
        >
          <div className="sidebar__section-title">Menu</div>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`sidebar__item${tab === item.id ? " active" : ""}`}
              onClick={() => handleNavClick(item.id)}
              aria-current={tab === item.id ? "page" : undefined}
            >
              <i className={`ti ${item.icon}`} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          ))}

          <div className="sidebar__divider" />
          <div className="sidebar__section-title">Hoje</div>

          <div className="sidebar__summary">
            <div className="sidebar__summary-label">Atendimentos</div>
            <div className="sidebar__summary-value">{todayCount}</div>
            <div className="sidebar__summary-sub">realizados hoje</div>
          </div>
          <div className="sidebar__summary">
            <div className="sidebar__summary-label">Faturamento</div>
            <div className="sidebar__summary-value sidebar__summary-value--md">
              R$ {totalRevenue.toFixed(0)}
            </div>
            <div className="sidebar__summary-sub">total geral</div>
          </div>

          {/* ── Equipe — apenas admin ── */}
          {isAdmin && (
            <>
              <div className="sidebar__divider" />
              <div className="sidebar__section-title">Equipe</div>

              <div className="sidebar__barbers">
                {barbers.map((b) => (
                  <div key={b.id} className="sidebar__barber">
                    <BarberAvatar name={b.name} size={28} />
                    <div className="sidebar__barber__info">
                      <span className="sidebar__barber__name">{b.name}</span>
                      <span className="sidebar__barber__user">
                        @{b.username}
                      </span>
                    </div>
                    {b.username !== barber?.username && (
                      <button
                        className="sidebar__barber__remove"
                        onClick={() => setConfirmDelete(b)}
                        aria-label={`Remover ${b.name}`}
                        title="Remover barbeiro"
                      >
                        <i className="ti ti-trash" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                className="sidebar__add-barber"
                onClick={() => setShowBarberModal(true)}
              >
                <i className="ti ti-user-plus" aria-hidden="true" />
                <span>Adicionar barbeiro</span>
              </button>
            </>
          )}
        </aside>

        {/* ── Main ── */}
        <main className="dash-main">
          {showToast && (
            <div className="toast-success" role="status" aria-live="assertive">
              <i className="ti ti-circle-check" aria-hidden="true" />
              {toastMsg}
            </div>
          )}

          {tab === "novo" && (
            <>
              <div className="section-header">
                <h2 className="section-header__title">Novo Atendimento</h2>
                <div className="section-header__line" aria-hidden="true" />
                <span className="section-header__meta">
                  <BarberAvatar name={barber?.name} size={18} />
                  {barber?.name || "Barbeiro"}
                </span>
              </div>
              <AppointmentForm
                barberName={barber?.name}
                onSaved={handleSaved}
              />
            </>
          )}

          {tab === "lista" && (
            <>
              <div className="section-header">
                <h2 className="section-header__title">Agendamentos</h2>
                <div className="section-header__line" aria-hidden="true" />
                <span className="section-header__meta">
                  {appointments.length} total
                </span>
              </div>
              <AppointmentList
                appointments={appointments}
                loading={loadingAppts}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                onEdit={handleEdit} // 👈
              />
            </>
          )}

          {tab === "produtos" && (
            <>
              <div className="section-header">
                <h2 className="section-header__title">Produtos</h2>
              </div>
              <ProductList fireToast={fireToast} />
            </>
          )}
        </main>
      </div>

      {/* ── Modais ── */}
      {showBarberModal && (
        <BarberModal
          onClose={() => setShowBarberModal(false)}
          onSave={handleBarberSaved}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          barber={confirmDelete}
          onConfirm={confirmBarberDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
