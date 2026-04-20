# SAP Order-to-Cash (O2C) Dashboard
### Capstone Project — Full-Stack SAP Integration

A complete full-stack simulation of the SAP Order-to-Cash pipeline built with Node.js/Express (mock SAP backend) and React/Vite (dashboard frontend).

---

## 📁 Project Structure

```
sap-o2c-dashboard/
├── backend/
│   ├── server.js          ← Mock SAP OData/REST API (Express)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx                        ← Main dashboard component
│   │   ├── api.js                         ← Centralised API service layer
│   │   ├── index.css                      ← Global styles
│   │   ├── main.jsx                       ← React entry point
│   │   └── components/
│   │       ├── KpiCards.jsx               ← Analytics KPI panel
│   │       ├── NewOrderForm.jsx           ← VA01 Sales Order creation form
│   │       ├── OrderModal.jsx             ← Order detail modal (VBAK + VBAP)
│   │       ├── OrdersTable.jsx            ← Main orders table with actions
│   │       ├── PipelineBar.jsx            ← Six-stage O2C progress bar
│   │       └── StatusBadge.jsx            ← Colour-coded status pill
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── scripts/
│   ├── setup-and-run.sh       ← One-command setup + launch (Mac/Linux)
│   └── verify-integration.sh  ← Full API test suite (curl-based)
├── docs/
│   └── CAPSTONE_REPORT.md     ← 4-5 page project report (paste into Word)
└── README.md
```

---

## 🚀 Quick Start (Recommended)

### Option A — One-command setup (Mac / Linux / Git Bash on Windows)

```bash
# From the project root directory:
bash scripts/setup-and-run.sh
```

This script will:
1. Check Node.js is installed (v18+ required)
2. Install all backend dependencies
3. Install all frontend dependencies
4. Launch both servers concurrently with colour-coded output

### Option B — Manual Setup (Windows CMD / PowerShell)

**Terminal 1 — Start Backend:**
```bash
cd backend
npm install
node server.js
```
You should see:
```
╔══════════════════════════════════════════════════╗
║      SAP O2C Mock Backend — Started              ║
║      Listening on http://localhost:3000          ║
╚══════════════════════════════════════════════════╝
```

**Terminal 2 — Start Frontend:**
```bash
cd frontend
npm install
npm run dev
```
You should see Vite output with: `Local: http://localhost:5173/`

**Open the dashboard:** http://localhost:5173

---

## ✅ Integration Verification (Section 3 — Testing Protocol)

After both servers are running, open a **third terminal** and run:

```bash
bash scripts/verify-integration.sh
```

Or manually run these `curl` commands:

### 1. Health Check
```bash
curl http://localhost:3000/
```
Expected: `{"service":"SAP O2C Mock Backend","status":"Running",...}`

### 2. Fetch All Orders (VBAK + VBAP)
```bash
curl http://localhost:3000/api/orders
```
Expected: JSON array of 5 seeded orders with `items[]` arrays

### 3. Fetch Customers (KNA1)
```bash
curl http://localhost:3000/api/customers
```
Expected: 5 mock Indian IT companies

### 4. Filter Orders by Status
```bash
curl "http://localhost:3000/api/orders?status=Pending"
```
Expected: Only orders with `"status":"Pending"`

### 5. Create a New Sales Order (VA01)
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "C002",
    "deliveryDate": "2025-09-01",
    "items": [
      {
        "material": "SAP-TEST-001",
        "description": "Test Service Item",
        "quantity": 3,
        "unit": "HR",
        "unitPrice": 12000
      }
    ]
  }'
```
Expected: `{"success":true,"message":"Sales Order SO-10006 created...","data":{...}}`

### 6. Advance Order Status (simulate VA02 → VL01N → VF01 → F-28)
```bash
# Replace SO-10005 with any Pending order
curl -X PUT http://localhost:3000/api/orders/SO-10005/status \
  -H "Content-Type: application/json" \
  -d '{}'
```
Expected: `{"success":true,"message":"Order SO-10005 advanced from Pending → Confirmed","sapTransaction":"VA02",...}`

### 7. Get Analytics KPIs
```bash
curl http://localhost:3000/api/analytics
```
Expected: `{"success":true,"data":{"totalOrders":5,"totalRevenue":...}}`

---

## 🌐 Browser Testing Protocol (Network Tab Verification)

1. Open Chrome/Firefox DevTools → **Network** tab
2. Open http://localhost:5173

**Test A — Initial Load:**
- Filter by "Fetch/XHR"
- You should see 3 requests: `/api/orders`, `/api/customers`, `/api/analytics`
- All should return **Status 200**
- Click each to verify JSON payload in the **Response** tab

**Test B — Create New Order:**
- Click **"+ New Order"** button in the header
- Fill the form and click **"Create Order (VA01)"**
- Network tab should show: `POST /api/orders` → **Status 201**
- Response body should include the new `SO-XXXXX` order ID
- The new order should appear at the **bottom of the table** without a page refresh

**Test C — Advance Pipeline Status:**
- Click any action button (e.g., "Confirm Order [VA02]")
- Network tab should show: `PUT /api/orders/SO-XXXXX/status` → **Status 200**
- The pipeline bar in that row should visually advance to the next stage
- The status badge should update to the new status
- A toast notification should appear bottom-right confirming the SAP transaction code

**Test D — KPI Update:**
- After creating an order, the "Total Orders" KPI card should increment
- After advancing an order to "Invoiced", the "Invoiced Revenue" KPI should increase

---

## 🔌 API Reference

| Method | Endpoint | SAP Equivalent | Description |
|--------|----------|----------------|-------------|
| GET | `/` | — | Health check |
| GET | `/api/customers` | KNA1 | All customer master records |
| GET | `/api/orders` | VBAK + VBAP | All orders (optional `?status=` or `?customerId=`) |
| GET | `/api/orders/:id` | VA03 | Single order detail |
| POST | `/api/orders` | VA01 | Create new sales order |
| PUT | `/api/orders/:id/status` | VA02/VL01N/VF01/F-28 | Advance O2C pipeline stage |
| GET | `/api/analytics` | — | KPI summary data |
| GET | `/api/statuses` | — | All valid O2C status values |

---

## 🗺️ O2C Pipeline Stages

| Stage | SAP Transaction | Description |
|-------|----------------|-------------|
| Pending | VA01 | Sales Order created |
| Confirmed | VA02 | Order confirmed, credit check passed |
| In Delivery | VL01N | Outbound delivery document created |
| Shipped | VL02N | Post Goods Issue (PGI) completed |
| Invoiced | VF01 | Billing/Invoice document created |
| Delivered | F-28 | Payment received and cleared |

---

## 📋 Prerequisites

- **Node.js** v18.0.0 or higher → https://nodejs.org
- **npm** v9+ (included with Node.js)
- A modern browser (Chrome / Firefox recommended for DevTools)
- Ports **3000** and **5173** must be free
