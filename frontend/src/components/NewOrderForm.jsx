import React, { useState } from "react";

const input = {
  width: "100%",
  padding: "9px 12px",
  background: "var(--bg-secondary)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  color: "var(--text-primary)",
  fontFamily: "var(--font-sans)",
  fontSize: "13px",
  outline: "none",
  transition: "border-color 0.2s",
};

const label = {
  display: "block",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "var(--text-secondary)",
  marginBottom: "5px",
};

const EMPTY_ITEM = { material: "", description: "", quantity: 1, unit: "EA", unitPrice: "" };

export function NewOrderForm({ customers, onSubmit, onCancel, submitting }) {
  const [customerId, setCustomerId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [error, setError] = useState("");

  const updateItem = (idx, field, value) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const addItem = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const calcTotal = () =>
    items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!customerId) return setError("Please select a customer.");
    if (!deliveryDate) return setError("Delivery date is required.");
    if (items.some((i) => !i.description || !i.unitPrice)) return setError("All items must have a description and unit price.");

    onSubmit({ customerId, deliveryDate, items });
  };

  const fmt = (n) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--sap-blue)",
      borderRadius: "var(--radius-lg)",
      padding: "24px",
      marginBottom: "24px",
      animation: "fadeInUp 0.3s ease",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: 15, color: "var(--sap-blue)" }}>Create New Sales Order</h3>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>SAP Transaction: VA01</div>
        </div>
        <button onClick={onCancel} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 18 }}>✕</button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Customer + Date Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div>
            <label style={label}>Customer (KNA1)</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}
              style={{ ...input, cursor: "pointer" }}>
              <option value="">— Select Customer —</option>
              {customers.map((c) => (
                <option key={c.customerId} value={c.customerId}>{c.customerId} — {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={label}>Requested Delivery Date</label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              style={input}
            />
          </div>
        </div>

        {/* Items — VBAP */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <label style={label}>Order Items (VBAP)</label>
            <button type="button" onClick={addItem} style={{
              padding: "4px 12px", fontSize: 12, background: "var(--bg-secondary)",
              border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-secondary)", cursor: "pointer",
            }}>+ Add Item</button>
          </div>

          {items.map((item, idx) => (
            <div key={idx} style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 2fr 80px 70px 100px 36px",
              gap: 8,
              marginBottom: 8,
              alignItems: "center",
            }}>
              <input placeholder="Material ID" value={item.material} onChange={(e) => updateItem(idx, "material", e.target.value)}
                style={{ ...input, fontSize: 12, fontFamily: "var(--font-mono)" }} />
              <input placeholder="Description *" value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)}
                required style={{ ...input, fontSize: 12 }} />
              <input type="number" placeholder="Qty" min={1} value={item.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                style={{ ...input, fontSize: 12 }} />
              <select value={item.unit} onChange={(e) => updateItem(idx, "unit", e.target.value)}
                style={{ ...input, fontSize: 12, cursor: "pointer" }}>
                {["EA", "HR", "DAY", "UNIT", "KG", "PC"].map((u) => <option key={u}>{u}</option>)}
              </select>
              <input type="number" placeholder="Unit Price *" min={0} value={item.unitPrice}
                onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                style={{ ...input, fontSize: 12 }} />
              <button type="button" onClick={() => removeItem(idx)} disabled={items.length === 1}
                style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6,
                  color: "#ff7b72", cursor: items.length === 1 ? "not-allowed" : "pointer",
                  opacity: items.length === 1 ? 0.3 : 1, fontSize: 14, height: 34 }}>
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Total Preview */}
        {calcTotal() > 0 && (
          <div style={{
            textAlign: "right", padding: "10px 0", borderTop: "1px solid var(--border)",
            marginBottom: 16, fontFamily: "var(--font-mono)", color: "#a371f7", fontSize: 14, fontWeight: 700,
          }}>
            Estimated Total: {fmt(calcTotal())}
          </div>
        )}

        {error && (
          <div style={{ color: "#ff7b72", fontSize: 12, marginBottom: 12, padding: "8px 12px",
            background: "rgba(255,123,114,0.1)", borderRadius: 6, border: "1px solid rgba(255,123,114,0.2)" }}>
            ⚠ {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button type="button" onClick={onCancel} style={{
            padding: "9px 20px", background: "none", border: "1px solid var(--border)",
            borderRadius: 6, color: "var(--text-secondary)", cursor: "pointer", fontSize: 13,
          }}>Cancel</button>
          <button type="submit" disabled={submitting} style={{
            padding: "9px 24px", background: submitting ? "var(--border)" : "var(--sap-blue)",
            border: "none", borderRadius: 6, color: "#fff", cursor: submitting ? "not-allowed" : "pointer",
            fontSize: 13, fontWeight: 600, transition: "background 0.2s",
          }}>
            {submitting ? "Creating…" : "Create Order (VA01)"}
          </button>
        </div>
      </form>
    </div>
  );
}
