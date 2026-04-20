/**
 * api.js — Centralised API service layer
 * All backend requests routed through Vite proxy → http://localhost:3000
 */

const BASE = "/api";

const handle = async (res) => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
};

export const api = {
  // ── Orders (VBAK + VBAP) ──────────────────────────────────────────────────
  getOrders: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${BASE}/orders${qs ? "?" + qs : ""}`, { method: "GET" }).then(handle);
  },

  getOrder: (id) =>
    fetch(`${BASE}/orders/${id}`).then(handle),

  createOrder: (payload) =>
    fetch(`${BASE}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(handle),

  advanceStatus: (id, status = null) =>
    fetch(`${BASE}/orders/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(status ? { status } : {}),
    }).then(handle),

  // ── Customers (KNA1) ──────────────────────────────────────────────────────
  getCustomers: () =>
    fetch(`${BASE}/customers`).then(handle),

  // ── Analytics / KPIs ─────────────────────────────────────────────────────
  getAnalytics: () =>
    fetch(`${BASE}/analytics`).then(handle),
};
