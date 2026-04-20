import React, { useState } from "react";
import { StatusBadge } from "./StatusBadge.jsx";
import { PipelineBar } from "./PipelineBar.jsx";

const O2C_STAGES = ["Pending", "Confirmed", "In Delivery", "Shipped", "Invoiced", "Delivered"];

const NEXT_ACTION = {
  Pending:      { label: "Confirm Order",    tx: "VA02",  color: "#3fb950" },
  Confirmed:    { label: "Create Delivery",  tx: "VL01N", color: "#a371f7" },
  "In Delivery":{ label: "Post Goods Issue", tx: "VL02N", color: "#58a6ff" },
  Shipped:      { label: "Create Invoice",   tx: "VF01",  color: "#ff7b72" },
  Invoiced:     { label: "Clear Payment",    tx: "F-28",  color: "#3fb950" },
  Delivered:    { label: "Completed",        tx: "—",     color: "#4d5566" },
};

const th = {
  padding: "10px 14px",
  textAlign: "left",
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
  borderBottom: "1px solid var(--border)",
  whiteSpace: "nowrap",
};

const td = {
  padding: "12px 14px",
  fontSize: "13px",
  borderBottom: "1px solid var(--border)",
  verticalAlign: "middle",
};

export function OrdersTable({ orders, onAdvance, onViewDetail, advancing }) {
  const [expandedId, setExpandedId] = useState(null);

  const fmt = (n) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
    }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "var(--bg-secondary)" }}>
            <tr>
              <th style={{ ...th, width: 32 }}></th>
              <th style={th}>Order ID</th>
              <th style={th}>Customer</th>
              <th style={th}>Order Date</th>
              <th style={th}>Delivery Date</th>
              <th style={th}>Amount</th>
              <th style={th}>Status</th>
              <th style={th}>O2C Pipeline</th>
              <th style={th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={9} style={{ ...td, textAlign: "center", color: "var(--text-muted)", padding: 40 }}>
                  No orders found
                </td>
              </tr>
            )}
            {orders.map((order) => {
              const isExpanded = expandedId === order.orderId;
              const isAdvancing = advancing === order.orderId;
              const isDone = order.status === "Delivered";
              const action = NEXT_ACTION[order.status] || NEXT_ACTION["Delivered"];

              return (
                <React.Fragment key={order.orderId}>
                  <tr
                    style={{
                      background: isExpanded ? "var(--bg-card-hover)" : "transparent",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                    onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = "transparent"; }}
                  >
                    {/* Expand Toggle */}
                    <td style={{ ...td, paddingRight: 4, cursor: "pointer" }} onClick={() => toggleExpand(order.orderId)}>
                      <span style={{ color: "var(--text-muted)", fontSize: 11, userSelect: "none" }}>
                        {isExpanded ? "▼" : "▶"}
                      </span>
                    </td>

                    {/* Order ID */}
                    <td style={td}>
                      <button onClick={() => onViewDetail(order)} style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: "var(--sap-blue)",
                        textDecoration: "underline", textDecorationColor: "transparent",
                        transition: "text-decoration-color 0.2s",
                      }}
                        onMouseEnter={(e) => e.target.style.textDecorationColor = "var(--sap-blue)"}
                        onMouseLeave={(e) => e.target.style.textDecorationColor = "transparent"}
                      >
                        {order.orderId}
                      </button>
                    </td>

                    <td style={{ ...td, maxWidth: 180 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{order.customerName}</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{order.customerId}</div>
                    </td>
                    <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 12 }}>{order.orderDate}</td>
                    <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 12 }}>{order.deliveryDate}</td>
                    <td style={{ ...td, fontFamily: "var(--font-mono)", fontWeight: 600, color: "#a371f7" }}>{fmt(order.totalAmount)}</td>

                    <td style={td}><StatusBadge status={order.status} /></td>

                    {/* Pipeline minibar */}
                    <td style={{ ...td, minWidth: 200 }}>
                      <PipelineBar currentStatus={order.status} />
                    </td>

                    {/* Advance Action */}
                    <td style={td}>
                      <button
                        onClick={() => !isDone && onAdvance(order.orderId)}
                        disabled={isDone || isAdvancing}
                        title={isDone ? "Order complete" : `SAP Tx: ${action.tx}`}
                        style={{
                          padding: "5px 12px",
                          fontSize: "11px",
                          fontWeight: 600,
                          border: `1px solid ${isDone ? "var(--border)" : action.color + "60"}`,
                          borderRadius: 6,
                          background: isDone ? "transparent" : action.color + "18",
                          color: isDone ? "var(--text-muted)" : action.color,
                          cursor: isDone ? "not-allowed" : isAdvancing ? "wait" : "pointer",
                          whiteSpace: "nowrap",
                          transition: "all 0.2s",
                          opacity: isAdvancing ? 0.6 : 1,
                        }}
                      >
                        {isAdvancing ? "…" : isDone ? "✔ Done" : action.label}
                        {!isDone && (
                          <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.7, fontFamily: "var(--font-mono)" }}>
                            [{action.tx}]
                          </span>
                        )}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Items Row */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={9} style={{ background: "var(--bg-secondary)", padding: "12px 20px 16px" }}>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                          Line Items (VBAP) — {order.orderId}
                        </div>
                        <div style={{ overflowX: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                            <thead>
                              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                {["Item No.", "Material", "Description", "Qty", "Unit", "Unit Price", "Line Total"].map((h) => (
                                  <th key={h} style={{ ...th, borderBottom: "none", fontSize: 10 }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {order.items?.map((item) => (
                                <tr key={item.itemNo} style={{ borderBottom: "1px solid var(--border)" }}>
                                  <td style={{ ...td, fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{item.itemNo}</td>
                                  <td style={{ ...td, fontFamily: "var(--font-mono)", color: "var(--sap-blue)", fontSize: 11 }}>{item.material}</td>
                                  <td style={td}>{item.description}</td>
                                  <td style={{ ...td, textAlign: "right", fontFamily: "var(--font-mono)" }}>{item.quantity}</td>
                                  <td style={{ ...td, color: "var(--text-muted)" }}>{item.unit}</td>
                                  <td style={{ ...td, textAlign: "right", fontFamily: "var(--font-mono)" }}>{fmt(item.unitPrice)}</td>
                                  <td style={{ ...td, textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{fmt(item.totalPrice)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
