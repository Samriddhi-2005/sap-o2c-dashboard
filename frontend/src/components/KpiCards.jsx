import React from "react";

const cardStyle = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)",
  padding: "20px 24px",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  transition: "border-color 0.2s, transform 0.2s",
};

const labelStyle = {
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--text-secondary)",
};

const valueStyle = {
  fontSize: "28px",
  fontWeight: 700,
  fontFamily: "var(--font-mono)",
  color: "var(--text-primary)",
  lineHeight: 1.1,
};

const subStyle = {
  fontSize: "11px",
  color: "var(--text-muted)",
};

function KpiCard({ label, value, sub, accent }) {
  return (
    <div style={{ ...cardStyle, borderTop: `3px solid ${accent}` }}>
      <div style={labelStyle}>{label}</div>
      <div style={{ ...valueStyle, color: accent || "var(--text-primary)" }}>{value}</div>
      {sub && <div style={subStyle}>{sub}</div>}
    </div>
  );
}

export function KpiCards({ analytics, loading }) {
  const fmt = (n) =>
    n !== undefined
      ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n)
      : "—";

  if (loading) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ ...cardStyle, height: 100, opacity: 0.4, animation: "pulse 1.5s infinite" }} />
        ))}
      </div>
    );
  }

  const d = analytics || {};

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
      <KpiCard label="Total Orders" value={d.totalOrders ?? 0} sub="All O2C pipeline orders" accent="#58a6ff" />
      <KpiCard label="Total Revenue" value={fmt(d.totalRevenue)} sub="Across all orders" accent="#a371f7" />
      <KpiCard label="Invoiced Revenue" value={fmt(d.invoicedRevenue)} sub="Invoiced + Delivered" accent="#3fb950" />
      <KpiCard label="Pending Orders" value={d.pendingOrders ?? 0} sub="Awaiting confirmation" accent="#f0a500" />
    </div>
  );
}
