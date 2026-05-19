// ============================================
//  MIKAEL BARBER — API Service
//  Centraliza todas as chamadas ao backend Node.js
// ============================================

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('mb_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) throw new Error(data.message || 'Erro na requisição');
  return data;
}

// ─── Auth ────────────────────────────────────
export const authService = {
  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  me: () => request('/auth/me'),
};

// ─── Agendamentos ─────────────────────────────
export const appointmentService = {
  getAll: () => request('/appointments'),

  create: (payload) =>
    request('/appointments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id, payload) =>
    request(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  remove: (id) =>
    request(`/appointments/${id}`, { method: 'DELETE' }),
};