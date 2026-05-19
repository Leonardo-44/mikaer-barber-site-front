// ============================================
//  Dashboard.jsx — Mikael Barber
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from "react-router-dom";
import { useAuth } from '../../Context/AuthContext';
import AppointmentForm from '../AppointmentForm/AppointmentForm';
import AppointmentList from '../AppointmentList/AppointmentList';
import './Dashboard.css';

const INITIAL_APPOINTMENTS = [
  {
    id: 1,
    clientName:  'Carlos Mendes',
    clientPhone: '(11) 91234-5678',
    cut:         'Social Degradê',
    price:       '55',
    consumables: ['Pomada Modeladora'],
    obs:         '',
    status:      'cancelled',
    barber:      'Mikael',
    date:        new Date().toLocaleDateString('pt-BR'),
    time:        '09:30',
  },
  {
    id: 2,
    clientName:  'Bruno Alves',
    clientPhone: '',
    cut:         'Corte + Barba',
    price:       '80',
    consumables: ['Óleo de Barba', 'Loção Pós-Barba'],
    obs:         'Prefere acabamento reto na nuca',
    status:      'done',
    barber:      'Lucas',
    date:        new Date().toLocaleDateString('pt-BR'),
    time:        '10:15',
  },
  {
    id: 3,
    clientName:  'Felipe Costa',
    clientPhone: '(11) 99876-5432',
    cut:         'Skin Fade',
    price:       '60',
    consumables: [],
    obs:         '',
    status:      'pending',
    barber:      'Mikael',
    date:        new Date().toLocaleDateString('pt-BR'),
    time:        '14:00',
  },
];

const NAV_ITEMS = [
  { id: 'novo',  label: 'Novo Atendimento', icon: 'ti-plus'          },
  { id: 'lista', label: 'Agendamentos',     icon: 'ti-calendar-list' },
];

export default function Dashboard() {
  const auth     = useAuth();
  const navigate = useNavigate();
  const { barber, logout } = auth || {};

  const [tab, setTab]                   = useState('novo');
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [showToast, setShowToast]       = useState(false);

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  });

  const todayCount = appointments.filter(
    (a) => a.date === new Date().toLocaleDateString('pt-BR'),
  ).length;

  const totalRevenue = appointments
    .filter((a) => a.status === 'done' && a.price)
    .reduce((sum, a) => sum + parseFloat(a.price || 0), 0);

  const handleSaved = (record) => {
    setAppointments((prev) => [record, ...prev]);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
    setTab('lista');
  };

  const handleDelete = (id) =>
    setAppointments((prev) => prev.filter((a) => a.id !== id));

  // ✅ Atualiza o status de um agendamento pelo id
  const handleStatusChange = (id, newStatus) =>
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)),
    );

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  if (!auth) {
    return <div className="dashboard-loading">Carregando aplicação...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dash-header">
        <Link to="/" className="dash-header__brand">
          <i className="ti ti-cut" aria-hidden="true" />
          MIKAEL BARBER
        </Link>

        <div className="dash-header__right">
          <span className="dash-header__date">{today}</span>

          <div className="dash-header__user">
            <i className="ti ti-user-circle" aria-hidden="true" />
            <span className="dash-header__user-name">{barber?.name || 'Barbeiro'}</span>
          </div>

          <button className="dash-logout-btn" onClick={handleLogout}>
            <i className="ti ti-logout" aria-hidden="true" />
            Sair
          </button>
        </div>
      </header>

      <div className="dash-body">
        <aside className="dash-sidebar">
          <div className="sidebar__section-title">Menu</div>

          {NAV_ITEMS.map((item) => (
            <div
              key={item.id}
              className={`sidebar__item${tab === item.id ? ' active' : ''}`}
              onClick={() => setTab(item.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setTab(item.id)}
              aria-current={tab === item.id ? 'page' : undefined}
            >
              <i className={`ti ${item.icon}`} aria-hidden="true" />
              <span>{item.label}</span>
            </div>
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
            <div className="sidebar__summary-value" style={{ fontSize: 18 }}>
              R$ {totalRevenue.toFixed(0)}
            </div>
            <div className="sidebar__summary-sub">total geral</div>
          </div>
        </aside>

        <main className="dash-main">
          {showToast && (
            <div className="toast-success" role="status">
              <i className="ti ti-circle-check" aria-hidden="true" />
              Atendimento registrado com sucesso!
            </div>
          )}

          {tab === 'novo' && (
            <>
              <div className="section-header">
                <h2 className="section-header__title">Novo Atendimento</h2>
                <div className="section-header__line" aria-hidden="true" />
                <span className="section-header__meta">
                  <i className="ti ti-user" style={{ marginRight: 6 }} />
                  {barber?.name || 'Barbeiro'}
                </span>
              </div>
              <AppointmentForm barberName={barber?.name} onSaved={handleSaved} />
            </>
          )}

          {tab === 'lista' && (
            <>
              <div className="section-header">
                <h2 className="section-header__title">Agendamentos</h2>
                <div className="section-header__line" aria-hidden="true" />
                <span className="section-header__meta">
                  {appointments.length} total
                </span>
              </div>
              {/* ✅ onStatusChange passado para o componente */}
              <AppointmentList
                appointments={appointments}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}