/**
 * SAP O2C Mock Backend — server.js
 * Simulates SAP ECC/S4HANA OData-style REST APIs for the Order-to-Cash process.
 * Tables modelled: Customers (KNA1), Sales Order Header (VBAK), Sales Order Items (VBAP)
 */

const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = 3000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Request Logger ───────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.url}`);
  next();
});

// ═════════════════════════════════════════════════════════════════════════════
//  MOCK SAP DATA STORE
//  Simulates: KNA1 (Customers), VBAK (Sales Order Header), VBAP (Order Items)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * KNA1 — Customer Master Data
 */
const Customers = [
  { customerId: "C001", name: "Tata Consultancy Services", country: "IN", creditLimit: 500000 },
  { customerId: "C002", name: "Infosys Limited", country: "IN", creditLimit: 750000 },
  { customerId: "C003", name: "Wipro Technologies", country: "IN", creditLimit: 300000 },
  { customerId: "C004", name: "HCL Technologies", country: "IN", creditLimit: 420000 },
  { customerId: "C005", name: "Tech Mahindra Ltd", country: "IN", creditLimit: 280000 },
];

/**
 * O2C Pipeline Statuses (in order)
 * Maps to real SAP O2C stages:
 *  1. Pending       → Sales Order Created (VA01)
 *  2. Confirmed     → Order Confirmed / Credit Check Passed
 *  3. In Delivery   → Delivery Document Created (VL01N)
 *  4. Shipped       → Goods Issue Posted (VL02N - Post Goods Issue)
 *  5. Invoiced      → Billing Document Created (VF01)
 *  6. Delivered     → Payment Received / Cleared (F-28)
 */
const O2C_STATUSES = [
  "Pending",
  "Confirmed",
  "In Delivery",
  "Shipped",
  "Invoiced",
  "Delivered",
];

/**
 * VBAK — Sales Order Header
 * VBAP — Sales Order Items (embedded as `items[]`)
 */
let SalesOrders = [
  {
    orderId: "SO-10001",
    customerId: "C001",
    customerName: "Tata Consultancy Services",
    orderDate: "2025-06-01",
    deliveryDate: "2025-06-15",
    currency: "INR",
    totalAmount: 120000,
    status: "Delivered",
    salesOrg: "1000",
    distributionChannel: "10",
    division: "00",
    items: [
      { itemNo: "10", material: "SAP-LIC-001", description: "SAP S/4HANA License", quantity: 2, unit: "EA", unitPrice: 45000, totalPrice: 90000 },
      { itemNo: "20", material: "SAP-SVC-002", description: "Implementation Consulting", quantity: 3, unit: "HR", unitPrice: 10000, totalPrice: 30000 },
    ],
  },
  {
    orderId: "SO-10002",
    customerId: "C002",
    customerName: "Infosys Limited",
    orderDate: "2025-06-05",
    deliveryDate: "2025-06-20",
    currency: "INR",
    totalAmount: 85000,
    status: "Invoiced",
    salesOrg: "1000",
    distributionChannel: "10",
    division: "00",
    items: [
      { itemNo: "10", material: "SAP-MOD-003", description: "SAP FICO Module Training", quantity: 5, unit: "DAY", unitPrice: 12000, totalPrice: 60000 },
      { itemNo: "20", material: "SAP-SUP-004", description: "Annual Support Contract", quantity: 1, unit: "EA", unitPrice: 25000, totalPrice: 25000 },
    ],
  },
  {
    orderId: "SO-10003",
    customerId: "C003",
    customerName: "Wipro Technologies",
    orderDate: "2025-06-10",
    deliveryDate: "2025-06-25",
    currency: "INR",
    totalAmount: 62500,
    status: "In Delivery",
    salesOrg: "1000",
    distributionChannel: "10",
    division: "00",
    items: [
      { itemNo: "10", material: "SAP-INT-005", description: "SAP Integration Suite Setup", quantity: 1, unit: "EA", unitPrice: 42500, totalPrice: 42500 },
      { itemNo: "20", material: "SAP-DOC-006", description: "Technical Documentation", quantity: 4, unit: "HR", unitPrice: 5000, totalPrice: 20000 },
    ],
  },
  {
    orderId: "SO-10004",
    customerId: "C004",
    customerName: "HCL Technologies",
    orderDate: "2025-06-12",
    deliveryDate: "2025-06-28",
    currency: "INR",
    totalAmount: 198000,
    status: "Confirmed",
    salesOrg: "1000",
    distributionChannel: "10",
    division: "00",
    items: [
      { itemNo: "10", material: "SAP-CLOUD-007", description: "SAP BTP Cloud Credits", quantity: 10, unit: "UNIT", unitPrice: 15000, totalPrice: 150000 },
      { itemNo: "20", material: "SAP-ARCH-008", description: "Solution Architecture Review", quantity: 8, unit: "HR", unitPrice: 6000, totalPrice: 48000 },
    ],
  },
  {
    orderId: "SO-10005",
    customerId: "C005",
    customerName: "Tech Mahindra Ltd",
    orderDate: "2025-06-14",
    deliveryDate: "2025-06-30",
    currency: "INR",
    totalAmount: 34000,
    status: "Pending",
    salesOrg: "1000",
    distributionChannel: "10",
    division: "00",
    items: [
      { itemNo: "10", material: "SAP-TRAIN-009", description: "SD Module End-User Training", quantity: 2, unit: "DAY", unitPrice: 17000, totalPrice: 34000 },
    ],
  },
];

// ═════════════════════════════════════════════════════════════════════════════
//  ROUTES
// ═════════════════════════════════════════════════════════════════════════════

// ── Health Check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    service: "SAP O2C Mock Backend",
    version: "1.0.0",
    status: "Running",
    timestamp: new Date().toISOString(),
    endpoints: [
      "GET    /api/customers",
      "GET    /api/orders",
      "GET    /api/orders/:id",
      "POST   /api/orders",
      "PUT    /api/orders/:id/status",
      "GET    /api/statuses",
      "GET    /api/analytics",
    ],
  });
});

// ── GET /api/customers — KNA1 Customer Master ────────────────────────────────
app.get("/api/customers", (req, res) => {
  res.json({ success: true, count: Customers.length, data: Customers });
});

// ── GET /api/statuses — Available O2C pipeline statuses ──────────────────────
app.get("/api/statuses", (req, res) => {
  res.json({ success: true, data: O2C_STATUSES });
});

// ── GET /api/orders — Fetch all VBAK + VBAP records ──────────────────────────
app.get("/api/orders", (req, res) => {
  const { status, customerId } = req.query;
  let result = [...SalesOrders];

  if (status) result = result.filter((o) => o.status.toLowerCase() === status.toLowerCase());
  if (customerId) result = result.filter((o) => o.customerId === customerId);

  res.json({
    success: true,
    count: result.length,
    data: result,
  });
});

// ── GET /api/orders/:id — Single order detail ─────────────────────────────────
app.get("/api/orders/:id", (req, res) => {
  const order = SalesOrders.find((o) => o.orderId === req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, error: `Order ${req.params.id} not found` });
  }
  res.json({ success: true, data: order });
});

// ── POST /api/orders — VA01: Create a new Sales Order ────────────────────────
app.post("/api/orders", (req, res) => {
  const { customerId, deliveryDate, items } = req.body;

  // ── Validation ──
  if (!customerId || !deliveryDate || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      error: "Required fields: customerId, deliveryDate, items[] (at minimum one item with material, description, quantity, unitPrice)",
    });
  }

  const customer = Customers.find((c) => c.customerId === customerId);
  if (!customer) {
    return res.status(404).json({ success: false, error: `Customer ${customerId} not found` });
  }

  // ── Build order items (VBAP) ──
  const enrichedItems = items.map((item, idx) => {
    const qty = parseFloat(item.quantity) || 1;
    const price = parseFloat(item.unitPrice) || 0;
    return {
      itemNo: String((idx + 1) * 10).padStart(6, "0").slice(-6),
      material: item.material || `MAT-${uuidv4().slice(0, 6).toUpperCase()}`,
      description: item.description || "Unnamed Material",
      quantity: qty,
      unit: item.unit || "EA",
      unitPrice: price,
      totalPrice: parseFloat((qty * price).toFixed(2)),
    };
  });

  const totalAmount = enrichedItems.reduce((sum, i) => sum + i.totalPrice, 0);

  // ── Auto-generate order number (VBAK-VBELN) ──
  const lastId = SalesOrders.length > 0
    ? Math.max(...SalesOrders.map((o) => parseInt(o.orderId.split("-")[1])))
    : 10000;

  const newOrder = {
    orderId: `SO-${lastId + 1}`,
    customerId: customer.customerId,
    customerName: customer.name,
    orderDate: new Date().toISOString().split("T")[0],
    deliveryDate,
    currency: "INR",
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    status: "Pending",
    salesOrg: "1000",
    distributionChannel: "10",
    division: "00",
    items: enrichedItems,
  };

  SalesOrders.push(newOrder);

  res.status(201).json({
    success: true,
    message: `Sales Order ${newOrder.orderId} created successfully`,
    data: newOrder,
  });
});

// ── PUT /api/orders/:id/status — Advance O2C Pipeline Stage ──────────────────
// Simulates: VA02 (Confirm), VL01N (Delivery), VL02N (Ship), VF01 (Invoice), F-28 (Clear)
app.put("/api/orders/:id/status", (req, res) => {
  const orderIdx = SalesOrders.findIndex((o) => o.orderId === req.params.id);

  if (orderIdx === -1) {
    return res.status(404).json({ success: false, error: `Order ${req.params.id} not found` });
  }

  const order = SalesOrders[orderIdx];
  const currentIdx = O2C_STATUSES.indexOf(order.status);

  // Allow explicit status override via body, or auto-advance
  const { status: targetStatus } = req.body;

  let newStatus;
  if (targetStatus) {
    if (!O2C_STATUSES.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Valid values: ${O2C_STATUSES.join(", ")}`,
      });
    }
    newStatus = targetStatus;
  } else {
    if (currentIdx === O2C_STATUSES.length - 1) {
      return res.status(400).json({
        success: false,
        error: `Order ${order.orderId} is already at final status: ${order.status}`,
      });
    }
    newStatus = O2C_STATUSES[currentIdx + 1];
  }

  const previousStatus = order.status;
  SalesOrders[orderIdx] = { ...order, status: newStatus };

  // Simulate SAP transaction log
  const sapTxMap = {
    Confirmed: "VA02",
    "In Delivery": "VL01N",
    Shipped: "VL02N",
    Invoiced: "VF01",
    Delivered: "F-28",
  };

  res.json({
    success: true,
    message: `Order ${order.orderId} advanced from "${previousStatus}" → "${newStatus}"`,
    sapTransaction: sapTxMap[newStatus] || "N/A",
    data: SalesOrders[orderIdx],
  });
});

// ── GET /api/analytics — Dashboard KPIs ──────────────────────────────────────
app.get("/api/analytics", (req, res) => {
  const statusCounts = {};
  O2C_STATUSES.forEach((s) => { statusCounts[s] = 0; });
  SalesOrders.forEach((o) => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });

  const totalRevenue = SalesOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const invoicedRevenue = SalesOrders.filter((o) => ["Invoiced", "Delivered"].includes(o.status))
    .reduce((sum, o) => sum + o.totalAmount, 0);

  res.json({
    success: true,
    data: {
      totalOrders: SalesOrders.length,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      invoicedRevenue: parseFloat(invoicedRevenue.toFixed(2)),
      pendingOrders: statusCounts["Pending"] || 0,
      statusBreakdown: statusCounts,
    },
  });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Endpoint not found" });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║      SAP O2C Mock Backend — Started              ║");
  console.log(`║      Listening on http://localhost:${PORT}          ║`);
  console.log("╚══════════════════════════════════════════════════╝");
  console.log("\n📦 Available Endpoints:");
  console.log("   GET    http://localhost:3000/api/customers");
  console.log("   GET    http://localhost:3000/api/orders");
  console.log("   GET    http://localhost:3000/api/orders/:id");
  console.log("   POST   http://localhost:3000/api/orders");
  console.log("   PUT    http://localhost:3000/api/orders/:id/status");
  console.log("   GET    http://localhost:3000/api/analytics\n");
});
