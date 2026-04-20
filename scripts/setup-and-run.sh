#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
#  SAP O2C Dashboard — Master Setup & Run Script
#  Run this from the project root:  bash scripts/setup-and-run.sh
# ═══════════════════════════════════════════════════════════════════════════

set -e   # Exit on any error

# ── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

echo -e "${BOLD}${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║       SAP Order-to-Cash Dashboard — Project Setup           ║"
echo "║       Capstone Project · Full-Stack SAP Integration         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${RESET}"

# ── Pre-flight: Check Node.js ────────────────────────────────────────────────
echo -e "${CYAN}[1/4] Checking prerequisites...${RESET}"
if ! command -v node &>/dev/null; then
  echo -e "${RED}ERROR: Node.js is not installed.${RESET}"
  echo "  Please install Node.js (v18 or higher) from https://nodejs.org"
  exit 1
fi

NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VER" -lt 18 ]; then
  echo -e "${YELLOW}WARNING: Node.js v18+ recommended. Current: $(node -v)${RESET}"
fi

echo -e "  ${GREEN}✔ Node.js $(node -v) found${RESET}"
echo -e "  ${GREEN}✔ npm $(npm -v) found${RESET}"

# ── Install Backend Dependencies ─────────────────────────────────────────────
echo ""
echo -e "${CYAN}[2/4] Installing backend dependencies...${RESET}"
cd "$(dirname "$0")/../backend"
npm install --silent
echo -e "  ${GREEN}✔ Backend packages installed (express, cors, uuid)${RESET}"

# ── Install Frontend Dependencies ────────────────────────────────────────────
echo ""
echo -e "${CYAN}[3/4] Installing frontend dependencies...${RESET}"
cd "../frontend"
npm install --silent
echo -e "  ${GREEN}✔ Frontend packages installed (react, vite, axios)${RESET}"

# ── Launch Both Servers ───────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}[4/4] Starting both servers concurrently...${RESET}"
cd ".."

echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════════════════╗"
echo -e "║  🚀 Launching SAP O2C Dashboard                             ║"
echo -e "║                                                              ║"
echo -e "║  Backend API:   http://localhost:3000                        ║"
echo -e "║  Frontend UI:   http://localhost:5173                        ║"
echo -e "║                                                              ║"
echo -e "║  Press Ctrl+C to stop both servers                          ║"
echo -e "╚══════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# ── Run Backend in background, Frontend in foreground ───────────────────────
(
  cd backend
  echo -e "${BLUE}[BACKEND]${RESET} Starting Express server on port 3000..."
  node server.js 2>&1 | sed 's/^/\033[0;34m[BACKEND] \033[0m/'
) &
BACKEND_PID=$!

sleep 1  # Give backend a moment to start

(
  cd frontend
  echo -e "${YELLOW}[FRONTEND]${RESET} Starting Vite dev server on port 5173..."
  npm run dev 2>&1 | sed 's/^/\033[0;33m[FRONTEND]\033[0m /'
) &
FRONTEND_PID=$!

# ── Graceful shutdown on Ctrl+C ──────────────────────────────────────────────
trap "echo ''; echo -e '${RED}Stopping servers...${RESET}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

# Wait for both
wait $BACKEND_PID $FRONTEND_PID
