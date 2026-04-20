import React, { useState, useEffect, useCallback } from "react";
import { api } from "./api.js";
import { KpiCards } from "./components/KpiCards.jsx";
import { OrdersTable } from "./components/OrdersTable.jsx";
import { NewOrderForm } from "./components/NewOrderForm.jsx";
import { OrderModal } from "./components/OrderModal.jsx";

// ─── Toast Notification ───────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = { success: "#3fb950", error: "#ff7b72", info: "#58a6ff" };
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: "var(--bg-card)", border: `1px solid ${colors[type] || "#8b949e"}`,
      borderLeft: `4px solid ${colors[type] || "#8b949e"}`,
      borderRadius: 8, padding: "12px 16px", maxWidth: 360,
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      animation: "slideIn 0.25s ease",
      display: "flex", alignItems: "flex-start", gap: 10,
    }}>
      <span>{type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️"}</span>
      <div style={{ flex: 1, fontSize: 13, lineHeight: 1.5 }}>{message}</div>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 16, lineHeight: 1 }}>✕</button>
    </div>
  );
}

// ─── Filter Pill ──────────────────────────────────────────────────────────────
function FilterPill({ label, count, active, onClick, color }) {
  return (
    <button onClick={onClick} style={{
      padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
      border: `1px solid ${active ? color : "var(--border)"}`,
      background: active ? color + "20" : "var(--bg-secondary)",
      color: active ? color : "var(--text-secondary)",
      cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
      transition: "all 0.2s",
    }}>
      {label}
      {count !== undefined && (
        <span style={{
          padding: "1px 7px", borderRadius: 10, fontSize: 10,
          background: active ? color + "30" : "var(--bg-card)",
          color: active ? color : "var(--text-muted)",
          fontFamily: "var(--font-mono)",
        }}>{count}</span>
      )}
    </button>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN APP
// ═════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [advancing, setAdvancing] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [toast, setToast] = useState(null);

  const notify = (message, type = "info") => setToast({ message, type });

  // ── Data Fetch ────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      const [ordersRes, customersRes, analyticsRes] = await Promise.all([
        api.getOrders(),
        api.getCustomers(),
        api.getAnalytics(),
      ]);
      setOrders(ordersRes.data);
      setCustomers(customersRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      setError("Cannot connect to backend. Is the server running on http://localhost:3000?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Create Order ──────────────────────────────────────────────────────────
  const handleCreateOrder = async (payload) => {
    setSubmitting(true);
    try {
      const res = await api.createOrder(payload);
      setOrders((prev) => [...prev, res.data]);
      setAnalytics((prev) => prev ? {
        ...prev,
        totalOrders: prev.totalOrders + 1,
        totalRevenue: prev.totalRevenue + res.data.totalAmount,
        pendingOrders: prev.pendingOrders + 1,
      } : prev);
      setShowForm(false);
      notify(`✔ ${res.message}`, "success");
    } catch (err) {
      notify(`Failed to create order: ${err.message}`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Advance Status ────────────────────────────────────────────────────────
  const handleAdvance = async (orderId) => {
    setAdvancing(orderId);
    try {
      const res = await api.advanceStatus(orderId);
      setOrders((prev) =>
        prev.map((o) => (o.orderId === orderId ? res.data : o))
      );
      // Refresh analytics
      const analyticsRes = await api.getAnalytics();
      setAnalytics(analyticsRes.data);
      notify(`${res.message} (SAP Tx: ${res.sapTransaction})`, "success");
    } catch (err) {
      notify(`Status update failed: ${err.message}`, "error");
    } finally {
      setAdvancing(null);
    }
  };

  // ── Filtering ─────────────────────────────────────────────────────────────
  const STATUS_FILTERS = ["All", "Pending", "Confirmed", "In Delivery", "Shipped", "Invoiced", "Delivered"];
  const STATUS_COLORS = {
    All: "#58a6ff", Pending: "#f0a500", Confirmed: "#3fb950",
    "In Delivery": "#a371f7", Shipped: "#58a6ff", Invoiced: "#ff7b72", Delivered: "#3fb950",
  };

  const filteredOrders = orders.filter((o) => {
    const matchStatus = statusFilter === "All" || o.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || o.orderId.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) || o.customerId.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const countByStatus = (s) => orders.filter((o) => o.status === s).length;

  // ══════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: "100vh", padding: "0" }}>

      {/* ── Header ── */}
      <header style={{
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border)",
        padding: "0 32px",
        position: "sticky", top: 0, zIndex: 100,
        backdropFilter: "blur(12px)",
      }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* SAP Logo Badge */}
            <div style={{
              width: 36, height: 36, background: "var(--sap-blue)", borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 13, color: "#fff", letterSpacing: "-0.5px",
            }}>SAP</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.3px" }}>
                Order-to-Cash Dashboard
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
                CAPSTONE · SAP O2C INTEGRATION · S/4HANA SIMULATION
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Connection indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: error ? "#ff7b72" : "#3fb950" }}>
              <div style={{
                width: 7, height: 7, borderRadius: "50%",
                background: error ? "#ff7b72" : "#3fb950",
                boxShadow: error ? "none" : "0 0 6px #3fb950",
                animation: error ? "none" : "pulse 2s infinite",
              }} />
              {error ? "Backend Offline" : "Backend Connected"}
            </div>

            <button
              onClick={() => setShowForm((v) => !v)}
              style={{
                padding: "8px 18px", background: showForm ? "var(--bg-card)" : "var(--sap-blue)",
                border: `1px solid ${showForm ? "var(--border)" : "var(--sap-blue)"}`,
                borderRadius: 7, color: showForm ? "var(--text-secondary)" : "#fff",
                cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all 0.2s",
              }}
            >
              {showForm ? "✕ Cancel" : "+ New Order"}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 32px" }}>

        {/* Error Banner */}
        {error && !loading && (
          <div style={{
            background: "rgba(255,123,114,0.1)", border: "1px solid rgba(255,123,114,0.3)",
            borderRadius: 8, padding: "14px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10,
          }}>
            <span>⚠</span>
            <div>
              <div style={{ fontWeight: 600, color: "#ff7b72", fontSize: 13 }}>Backend Connection Error</div>
              <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 2 }}>{error}</div>
              <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 4, fontFamily: "var(--font-mono)" }}>
                Run: cd backend && npm install && node server.js
              </div>
            </div>
            <button onClick={fetchAll} style={{
              marginLeft: "auto", padding: "6px 14px", background: "none",
              border: "1px solid rgba(255,123,114,0.4)", borderRadius: 6,
              color: "#ff7b72", cursor: "pointer", fontSize: 12,
            }}>Retry</button>
          </div>
        )}

        {/* KPI Cards */}
        <section style={{ marginBottom: 24 }}>
          <KpiCards analytics={analytics} loading={loading} />
        </section>

        {/* New Order Form */}
        {showForm && (
          <NewOrderForm
            customers={customers}
            onSubmit={handleCreateOrder}
            onCancel={() => setShowForm(false)}
            submitting={submitting}
          />
        )}

        {/* Orders Section */}
        <section>
          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginRight: 4 }}>
              Sales Orders
              {!loading && (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)", marginLeft: 8, fontWeight: 400 }}>
                  ({filteredOrders.length}/{orders.length})
                </span>
              )}
            </h2>

            {/* Status Filter Pills */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
              {STATUS_FILTERS.map((s) => (
                <FilterPill
                  key={s}
                  label={s}
                  count={s === "All" ? orders.length : countByStatus(s)}
                  active={statusFilter === s}
                  onClick={() => setStatusFilter(s)}
                  color={STATUS_COLORS[s]}
                />
              ))}
            </div>

            {/* Search */}
            <input
              placeholder="Search orders or customers…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: "7px 12px", background: "var(--bg-secondary)",
                border: "1px solid var(--border)", borderRadius: 7,
                color: "var(--text-primary)", fontFamily: "var(--font-sans)",
                fontSize: 12, outline: "none", width: 220,
              }}
            />

            <button onClick={fetchAll} title="Refresh" style={{
              padding: "7px 12px", background: "var(--bg-secondary)",
              border: "1px solid var(--border)", borderRadius: 7,
              color: "var(--text-secondary)", cursor: "pointer", fontSize: 14,
            }}>↺</button>
          </div>

          {loading ? (
            <div style={{
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: 12, padding: 60, textAlign: "center", color: "var(--text-muted)", fontSize: 13,
            }}>
              <div style={{ fontSize: 20, marginBottom: 10, animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</div>
              <div>Loading SAP Order data…</div>
            </div>
          ) : (
            <OrdersTable
              orders={filteredOrders}
              onAdvance={handleAdvance}
              onViewDetail={setSelectedOrder}
              advancing={advancing}
            />
          )}
        </section>

        {/* Footer */}
        <footer style={{ marginTop: 48, paddingTop: 20, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            SAP O2C Dashboard · Capstone Project · Mock SAP ECC/S4HANA Integration
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            Built with React + Vite + Express · Port 3000 (API) · Port 5173 (UI)
          </div>
        </footer>
      </main>

      {/* ── Order Detail Modal ── */}
      {selectedOrder && (
        <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}

      {/* ── Toast ── */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
