import React from "react";

const STATUS_META = {
  Pending:      { color: "#f0a500", bg: "rgba(240,165,0,0.12)",     icon: "⏳", step: 0 },
  Confirmed:    { color: "#3fb950", bg: "rgba(63,185,80,0.12)",     icon: "✅", step: 1 },
  "In Delivery":{ color: "#a371f7", bg: "rgba(163,113,247,0.12)",   icon: "📦", step: 2 },
  Shipped:      { color: "#58a6ff", bg: "rgba(88,166,255,0.12)",    icon: "🚚", step: 3 },
  Invoiced:     { color: "#ff7b72", bg: "rgba(255,123,114,0.12)",   icon: "🧾", step: 4 },
  Delivered:    { color: "#3fb950", bg: "rgba(63,185,80,0.12)",     icon: "✔️", step: 5 },
};

export function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { color: "#8b949e", bg: "rgba(139,148,158,0.12)", icon: "❓", step: -1 };
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      padding: "3px 10px",
      borderRadius: "20px",
      fontSize: "11px",
      fontWeight: 600,
      letterSpacing: "0.04em",
      color: meta.color,
      background: meta.bg,
      border: `1px solid ${meta.color}33`,
      whiteSpace: "nowrap",
    }}>
      <span>{meta.icon}</span>
      {status}
    </span>
  );
}

export { STATUS_META };
