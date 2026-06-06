// ============================================
//  services/api.js — Mikael Barber
// ============================================

const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:3333/api";

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("mb_token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

// ─── Auth ────────────────────────────────────
export const authService = {
  login: (username, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  me: () => request("/auth/me"),
  getBarbers: () => request("/auth/barbers"),
  createBarber: (payload) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

// ─── Agendamentos ─────────────────────────────
export const appointmentService = {
  getAll: (isAdmin = false) =>
    request(`/appointments${isAdmin ? "?all=true" : ""}`),
  create: (payload) =>
    request("/appointments", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    request(`/appointments/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  updateStatus: (id, status) =>
    request(`/appointments/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  remove: (id) => request(`/appointments/${id}`, { method: "DELETE" }),
};

// ─── Produtos ─────────────────────────────────
export const productService = {
  getAll: () => request("/products"),
  create: (payload) =>
    request("/products", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    request(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id) => request(`/products/${id}`, { method: "DELETE" }),
};

// ─── Serviços ─────────────────────────────────
export const serviceService = {
  getAll: () => request("/services"),
  create: (payload) =>
    request("/services", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    request(`/services/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id) => request(`/services/${id}`, { method: "DELETE" }),
};

// ─── Clientes ─────────────────────────────────
export const clientService = {
  getAll: () => request("/clients"),
  create: (payload) =>
    request("/clients", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    request(`/clients/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id) => request(`/clients/${id}`, { method: "DELETE" }),
};

// ─── Despesas ─────────────────────────────────
export const despesaService = {
  getAll: (period = "day", from = "", to = "") => {
    const params = new URLSearchParams({ period });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return request(`/despesas?${params.toString()}`);
  },
  create: (payload) =>
    request("/despesas", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateQty: (id, quantidade) =>
    request(`/despesas/${id}`, {
      method: "PUT",
      body: JSON.stringify({ quantidade }),
    }),
  remove: (id) => request(`/despesas/${id}`, { method: "DELETE" }),
};
