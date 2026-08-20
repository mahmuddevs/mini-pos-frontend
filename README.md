# 📦 iClassic IT - Inventory & Sales Management System (ERP)

[Live Url](https://iclassic-minierp.netlify.app)

<!-- REPLACE THE LINK ABOVE WITH YOUR ACTUAL PRODUCTION DEPLOYMENT URL -->

Welcome to the frontend repository of the **iClassic IT Inventory & Sales Management System**. This is a premium, real-time Enterprise Resource Planning (ERP) dashboard built for managing stocks, executing Point of Sale (POS) checkouts, and facilitating team communications.

---

## 🚀 Key Features

### 🛒 Real-time Point of Sale (POS) Checkout

- **Live Product Catalog**: Searchable product grid filtering dynamically by database categories, complete with low-stock warnings and out-of-stock lockouts.
- **Interactive Checkout Cart**: Incremental quantity adjusters capped by database stock ceilings, live subtotal calculations, and balance-due change computing.
- **Thermal Invoice Receipts**: Formats paper receipt layouts dynamically and calls the system print dialog in 1 click.

### 💬 Global Workspace Chat

- **WebSocket Integration**: Fully responsive real-time chat utilizing `socket.io-client`.
- **Stateful Session Fallback**: Authenticates socket connections using the Express app's dual-token authorization flow (relying on `refreshToken` verification if the short-lived access token is expired).
- **Unread Message Notifications**: Compares user session records via local storage to display bouncy unread badge count circles over closed chat icons.

### 👥 User Administration & Settings

- **Role Assignment Controls**: Modifies user credentials (e.g. Employee, Manager, Admin) and displays instant alerts on unchanged submissions.
- **Granular Permission Checkpoints**: Private routes and buttons dynamically locked according to backend security claims.

---

## 🛠️ Technology Stack

- **Core**: React 19 (compiled with the experimental React Compiler plugin for optimized re-render performance), TypeScript
- **State Management**: Redux Toolkit (auth slices, theme tracking)
- **Routing**: React Router v7 (utilizing `useMatches` hierarchy handlers for dynamic page title matching)
- **Styling**: Tailwind CSS v4, Vanilla CSS
- **Icons**: Phosphor Icons (React wrapper library)
- **Queries**: TanStack React Query (server state synchronization)
- **Toasts**: Sonner (minimalistic notifications engine)

---

## ⚙️ Environment Variables

Create a `.env` file in the root of the `frontend/` directory and set the target backend URL:

```env
# URL pointing to the Node.js API / Socket.io server
VITE_API_BACKEND_URL=http://localhost:3000
```

---

## 💻 Getting Started

To run the frontend project locally:

### 1. Install Dependencies

```bash
# Using npm
npm install

# Or using bun
bun install
```

### 2. Launch Development Client

```bash
# Using npm
npm run dev

# Or using bun
bun run dev
```

The application will launch and be accessible at [http://localhost:5173](http://localhost:5173).

### 3. Compile Production Bundle

```bash
# Using npm
npm run build

# Or using bun
bun run build
```

This runs the TypeScript check and triggers Vite's rollup builder to package static production assets into the `dist/` directory.
