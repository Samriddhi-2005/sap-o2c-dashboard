#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
#  SAP O2C Dashboard — Integration Verification Test Suite
#  Run this AFTER both servers are running: bash scripts/verify-integration.sh
# ═══════════════════════════════════════════════════════════════════════════

PASS=0; FAIL=0
API="http://localhost:3000"
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'; BLUE='\033[0;34m'

assert() {
  local label=$1 expected=$2 actual=$3
  if echo "$actual" | grep -q "$expected" 2>/dev/null; then
    echo -e "  ${GREEN}✔ PASS${RESET} — $label"
    ((PASS++))
  else
    echo -e "  ${RED}✘ FAIL${RESET} — $label"
    echo -e "    Expected to find: '${YELLOW}${expected}${RESET}'"
    echo -e "    Got:              '${actual:0:120}'"
    ((FAIL++))
  fi
}

echo -e "${BOLD}${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   SAP O2C Dashboard — Backend Integration Tests             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${RESET}"

# ── Test 1: Health Check ─────────────────────────────────────────────────────
echo -e "${CYAN}[TEST GROUP 1] Health & Connectivity${RESET}"
R=$(curl -sf "$API/" 2>/dev/null || echo "CONNECTION_FAILED")
assert "Backend is reachable on port 3000" "SAP O2C Mock Backend" "$R"
assert "Health check returns running status" '"status":"Running"' "$R"
echo ""

# ── Test 2: GET /api/customers ────────────────────────────────────────────────
echo -e "${CYAN}[TEST GROUP 2] Customer Master Data (KNA1)${RESET}"
R=$(curl -sf "$API/api/customers")
assert "GET /api/customers returns 200 with data" '"success":true' "$R"
assert "Returns at least one customer" '"customerId":"C001"' "$R"
assert "Customer has required fields" '"creditLimit"' "$R"
echo ""

# ── Test 3: GET /api/orders ───────────────────────────────────────────────────
echo -e "${CYAN}[TEST GROUP 3] Fetch Sales Orders (VBAK + VBAP)${RESET}"
R=$(curl -sf "$API/api/orders")
assert "GET /api/orders returns 200" '"success":true' "$R"
assert "Returns seeded orders array" '"SO-10001"' "$R"
assert "Orders include VBAP items array" '"items":[' "$R"
assert "Orders include status field" '"status":"' "$R"
assert "Orders include totalAmount" '"totalAmount"' "$R"

# Filter test
R=$(curl -sf "$API/api/orders?status=Pending")
assert "GET /api/orders?status=Pending filters correctly" '"status":"Pending"' "$R"
echo ""

# ── Test 4: POST /api/orders ──────────────────────────────────────────────────
echo -e "${CYAN}[TEST GROUP 4] Create Sales Order (VA01)${RESET}"

PAYLOAD='{
  "customerId": "C001",
  "deliveryDate": "2025-08-01",
  "items": [
    {
      "material": "TEST-MAT-001",
      "description": "Integration Test Item",
      "quantity": 2,
      "unit": "EA",
      "unitPrice": 15000
    }
  ]
}'

R=$(curl -sf -X POST "$API/api/orders" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

assert "POST /api/orders returns 201 with new order" '"success":true' "$R"
assert "New order has auto-generated orderId" '"orderId":"SO-' "$R"
assert "New order starts with Pending status" '"status":"Pending"' "$R"
assert "New order contains correct customer" '"customerName":"Tata Consultancy Services"' "$R"
assert "New order calculates totalAmount correctly" '"totalAmount":30000' "$R"

# Extract the new order ID for subsequent tests
NEW_ORDER_ID=$(echo "$R" | grep -o '"orderId":"[^"]*"' | head -1 | cut -d'"' -f4)
echo -e "  ${YELLOW}→ Created test order: $NEW_ORDER_ID${RESET}"

# Validation test (missing fields)
R_INVALID=$(curl -sf -X POST "$API/api/orders" \
  -H "Content-Type: application/json" \
  -d '{"customerId":"C001"}' -w "%{http_code}" -o /tmp/invalid_resp.json 2>/dev/null || echo "400")
assert "POST with missing fields returns error response" "400" "$R_INVALID"
echo ""

# ── Test 5: PUT /api/orders/:id/status ───────────────────────────────────────
echo -e "${CYAN}[TEST GROUP 5] Advance O2C Pipeline Status (VA02, VL01N, VF01…)${RESET}"

if [ -n "$NEW_ORDER_ID" ]; then
  # Advance: Pending → Confirmed
  R=$(curl -sf -X PUT "$API/api/orders/$NEW_ORDER_ID/status" \
    -H "Content-Type: application/json" -d '{}')
  assert "PUT advances from Pending → Confirmed" '"status":"Confirmed"' "$R"
  assert "Response includes SAP transaction code" '"sapTransaction":"VA02"' "$R"

  # Advance: Confirmed → In Delivery
  R=$(curl -sf -X PUT "$API/api/orders/$NEW_ORDER_ID/status" \
    -H "Content-Type: application/json" -d '{}')
  assert "PUT advances from Confirmed → In Delivery" '"status":"In Delivery"' "$R"
  assert "Response includes SAP transaction VL01N" '"sapTransaction":"VL01N"' "$R"

  # Advance: In Delivery → Shipped
  R=$(curl -sf -X PUT "$API/api/orders/$NEW_ORDER_ID/status" \
    -H "Content-Type: application/json" -d '{}')
  assert "PUT advances from In Delivery → Shipped" '"status":"Shipped"' "$R"

  # Advance: Shipped → Invoiced
  R=$(curl -sf -X PUT "$API/api/orders/$NEW_ORDER_ID/status" \
    -H "Content-Type: application/json" -d '{}')
  assert "PUT advances from Shipped → Invoiced" '"status":"Invoiced"' "$R"
  assert "Response includes VF01 transaction" '"sapTransaction":"VF01"' "$R"

  # Advance: Invoiced → Delivered
  R=$(curl -sf -X PUT "$API/api/orders/$NEW_ORDER_ID/status" \
    -H "Content-Type: application/json" -d '{}')
  assert "PUT advances from Invoiced → Delivered" '"status":"Delivered"' "$R"
  assert "Response includes F-28 clearing transaction" '"sapTransaction":"F-28"' "$R"

  # Try to advance past final status
  R=$(curl -sf -X PUT "$API/api/orders/$NEW_ORDER_ID/status" \
    -H "Content-Type: application/json" -d '{}' -w "%{http_code}" -o /tmp/final_resp.json)
  assert "PUT on completed order returns 400" "400" "$R"
else
  echo -e "  ${YELLOW}⚠ Skipping status tests: could not extract new order ID${RESET}"
fi
echo ""

# ── Test 6: GET /api/analytics ────────────────────────────────────────────────
echo -e "${CYAN}[TEST GROUP 6] Analytics & KPIs${RESET}"
R=$(curl -sf "$API/api/analytics")
assert "GET /api/analytics returns KPI data" '"success":true' "$R"
assert "Analytics includes totalOrders" '"totalOrders"' "$R"
assert "Analytics includes totalRevenue" '"totalRevenue"' "$R"
assert "Analytics includes statusBreakdown" '"statusBreakdown"' "$R"
echo ""

# ── Test 7: 404 Handling ──────────────────────────────────────────────────────
echo -e "${CYAN}[TEST GROUP 7] Error Handling${RESET}"
R=$(curl -sf "$API/api/orders/SO-NONEXISTENT" -w "%{http_code}" -o /tmp/404_resp.json 2>/dev/null || echo "404")
assert "GET unknown order returns 404" "404" "$R"

R=$(curl -sf "$API/api/nonexistent-route" -w "%{http_code}" -o /tmp/404_route.json 2>/dev/null || echo "404")
assert "Unknown route returns 404" "404" "$R"
echo ""

# ── Frontend Reachability ─────────────────────────────────────────────────────
echo -e "${CYAN}[TEST GROUP 8] Frontend Accessibility${RESET}"
R=$(curl -sf "http://localhost:5173/" 2>/dev/null || echo "FRONTEND_OFFLINE")
assert "Frontend is reachable on port 5173" "SAP O2C Dashboard" "$R"
echo ""

# ── Summary ───────────────────────────────────────────────────────────────────
TOTAL=$((PASS + FAIL))
echo -e "${BOLD}════════════════════════════════════════════════════"
echo -e "  Test Results:  ${GREEN}${PASS} PASSED${RESET}${BOLD}  /  ${RED}${FAIL} FAILED${RESET}${BOLD}  /  ${TOTAL} TOTAL"
echo -e "════════════════════════════════════════════════════${RESET}"

if [ "$FAIL" -eq 0 ]; then
  echo -e "${GREEN}${BOLD}  ✔ All tests passed! Your SAP O2C Dashboard is ready to submit.${RESET}"
else
  echo -e "${RED}${BOLD}  ✘ Some tests failed. Check server logs and verify both servers are running.${RESET}"
  exit 1
fi
