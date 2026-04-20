import React from "react";
import { StatusBadge } from "./StatusBadge.jsx";
import { PipelineBar } from "./PipelineBar.jsx";

const overlay = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 1000, backdropFilter: "blur(4px)",
};

const modal = {
  background: "var(--bg-card)",
  border: "1px solid var(--border-light)",
  borderRadius: "var(--radius-lg)",
  width: "min(700px, 95vw)",
  maxHeight: "85vh",
  overflow: "auto",
  padding: "28px",
  animation: "fadeInUp 0.25s ease",
};

export function OrderModal({ order, onClose }) {
  if (!order) return null;

  const fmt = (n) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: "var(--sap-blue)" }}>
                {order.orderId}
              </span>
              <StatusBadge status={order.status} />
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{order.customerName}</div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "1px solid var(--border)", borderRadius: 6,
            color: "var(--text-secondary)", cursor: "pointer", padding: "4px 10px", fontSize: 16,
          }}>✕</button>
        </div>

        {/* Pipeline */}
        <div style={{ marginBottom: 24, padding: "16px", background: "var(--bg-secondary)", borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>O2C Pipeline Progress</div>
          <PipelineBar currentStatus={order.status} />
        </div>

        {/* Order Details Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px", marginBottom: 20, fontSize: 13 }}>
          {[
            ["Customer ID", order.customerId],
            ["Order Date", order.orderDate],
            ["Delivery Date", order.deliveryDate],
            ["Currency", order.currency],
            ["Sales Org", order.salesOrg],
            ["Distribution Ch.", order.distributionChannel],
          ].map(([label, val]) => (
            <div key={label}>
              <div style={{ color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
              <div style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)", marginTop: 2 }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Items Table — VBAP */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Order Items (VBAP)
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Item", "Material", "Description", "Qty", "Unit", "Unit Price", "Total"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "6px 8px", color: "var(--text-muted)", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item) => (
                <tr key={item.itemNo} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "8px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{item.itemNo}</td>
                  <td style={{ padding: "8px", fontFamily: "var(--font-mono)", color: "var(--sap-blue)", fontSize: 11 }}>{item.material}</td>
                  <td style={{ padding: "8px" }}>{item.description}</td>
                  <td style={{ padding: "8px", textAlign: "right", fontFamily: "var(--font-mono)" }}>{item.quantity}</td>
                  <td style={{ padding: "8px", color: "var(--text-muted)" }}>{item.unit}</td>
                  <td style={{ padding: "8px", textAlign: "right", fontFamily: "var(--font-mono)" }}>{fmt(item.unitPrice)}</td>
                  <td style={{ padding: "8px", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--text-primary)", fontWeight: 600 }}>{fmt(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid var(--border-light)" }}>
                <td colSpan={6} style={{ padding: "10px 8px", fontWeight: 600, textAlign: "right", color: "var(--text-secondary)" }}>Total Amount</td>
                <td style={{ padding: "10px 8px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#a371f7", fontSize: 14 }}>
                  {fmt(order.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
