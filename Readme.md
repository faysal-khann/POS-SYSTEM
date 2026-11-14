
# POS System

A multi-branch retail Point-of-Sale and business management app. A React Native (Expo) mobile client talks to a REST API backed by Microsoft SQL Server.

It covers counter sales (barcode scan, discounts, split payments, held and draft sales, receipts, returns, cashier shift close-out), customer loyalty, products, suppliers, purchases, per-branch inventory, expenses, and role-based access across companies and branches.

## Documentation

All project documents live in [`docs/`](docs/):

| Document | What it covers |
| --- | --- |
| [POS_System_PRD.docx](docs/POS_System_PRD.docx) | Product Requirements Document (v1.2): goals, roles, functional requirements per module with Implemented / Partial / Planned status, data model, API list, risks |
| [POS_System_Project_Overview.docx](docs/POS_System_Project_Overview.docx) | Project overview (v1.1): purpose, objectives, stack, architecture, modules, data model summary. Written before the POS, returns, shift, loyalty and expense modules were added, so it is older than the PRD |

> Note: PRD v1.2 describes the ASP.NET Core 8 version of the backend. The `Backend/` folder in this repository is the FastAPI version. The modules and endpoints are the same; only the technology stack sections differ.

## Repository layout

```
Pos_systems/
├── Backend/            FastAPI REST API
│   ├── app/
│   │   ├── main.py         app entry point, router registration, /uploads static mount
│   │   ├── database.py     SQLAlchemy engine and session (SQL Server via pyodbc)
│   │   ├── models/         SQLAlchemy models
│   │   ├── schemas/        Pydantic request/response schemas
│   │   └── routers/        one router per API area (19 routers)
│   └── uploads/            uploaded product and company images
├── Frontend/           React Native (Expo) mobile app
│   └── src/
│       ├── app/            Expo Router screens: login and (tabs) modules
│       ├── components/     shared UI (cards, rows, side menu, charts)
│       ├── services/       one Axios module per API area
│       ├── hooks/, utils/  helpers (receipts, barcode, WhatsApp share)
│       └── config/api.ts   API base URL
└── docs/               PRD and project overview
```

## Tech stack

| Layer | Technology |
| --- | --- |
| Mobile app | Expo 57, React Native 0.86, React 19, Expo Router, TypeScript, NativeWind (Tailwind), Axios |
| Device features | expo-camera (barcode scan), expo-print (receipts), expo-sharing, expo-secure-store, expo-image-picker |
| Backend | Python, FastAPI, SQLAlchemy, Pydantic, python-jose (JWT), passlib/bcrypt |
| Database | Microsoft SQL Server, connected through pyodbc with ODBC Driver 17 |

## Modules

| Module | Screens (`Frontend/src/app/(tabs)`) | API routers |
| --- | --- | --- |
| Point of Sale | `pos` (new sale, held sales, drafts, returns, sales history, cashier shift) | sales, sale_returns, cashier_shifts |
| Products | `products` (catalog, categories, brands, units, barcode labels, price update, bulk price update, scan) | products, categories, brands, units |
| Inventory | `inventory` (current stock) | stock |
| Purchases | `purchases` | purchases |
| Suppliers | `suppliers` | suppliers |
| Customers and loyalty | `customers` | customers, loyalty |
| Expenses | `expenses` | expenses |
| Users, roles, permissions | `users` | users, roles, permissions, auth |
| Settings | `settings` (company info, branches) | companies, branches |

## Getting started

### Prerequisites

- Python 3.13 (the committed bytecode is 3.13) and pip
- Microsoft SQL Server with the `POS_SYSTEM` database created from the schema script
- [ODBC Driver 17 for SQL Server](https://learn.microsoft.com/sql/connect/odbc/download-odbc-driver-for-sql-server)
- Node.js and npm
- Android Studio emulator, a physical Android device, or Expo Go

### 1. Backend

```bash
cd Backend
python -m venv .venv
# Windows: .venv\Scripts\activate      macOS/Linux: source .venv/bin/activate
pip install fastapi "uvicorn[standard]" sqlalchemy pyodbc pydantic python-dotenv "python-jose[cryptography]" passlib bcrypt python-multipart
```

Create `Backend/.env`:

```env
DB_SERVER=localhost\SQLEXPRESS
DB_NAME=POS_SYSTEM
JWT_SECRET_KEY=change-me-to-a-long-random-string
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440
```

The connection uses Windows trusted authentication (`trusted_connection=yes`), so no database password is stored.

Run the API:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Health check: `http://localhost:8000/`
- Interactive docs: `http://localhost:8000/docs`
- Uploaded images are served from `/uploads`

### 2. Frontend

```bash
cd Frontend
npm install
```

Set the API address in `Frontend/src/config/api.ts`:

```ts
export const API_URL = "http://<your-computer-LAN-IP>:8000";
```

Use your computer's LAN address, not `localhost`, when running on a phone or emulator. To test through a public tunnel, put the tunnel URL there instead.

Start the app:

```bash
npx expo start          # Expo dev server
npm run android         # build and run on an Android device or emulator
```

`expo-dev-client` is installed, so camera barcode scanning and printing need a development build (`npm run android`), not Expo Go alone.

### 3. Builds

`Frontend/eas.json` defines `development`, `preview` (APK) and `production` EAS Build profiles:

```bash
npx eas build --profile preview --platform android
```

## Sign-in flow

1. The app looks up the company from the username or email.
2. The user signs in against that company; the API returns a JWT (24 hours by default) with the user's role, branch and permission keys.
3. The side menu shows only the modules the user's permission keys allow.

Seeded roles: Super Admin, Manager, Sales Executive, Cashier, Store Keeper, Accountant.

## Known gaps

- No API router checks the JWT: login issues a token, but endpoints are open to anyone who can reach the API, and permission keys are enforced only in the app menu. Add token and permission checks before exposing the API publicly.
- `JWT_SECRET_KEY` falls back to a built-in development value if it is not set. Always set it in `.env`.
- CORS allows all origins.
- `Frontend/src/config/api.ts` has the API address hardcoded; switch it per environment before building.
- Not built yet: tax and VAT settings, invoice templates, backup and restore, activity log screen, reports and dashboard, purchase returns, supplier and customer ledgers.

See the PRD in `docs/` for the full list with status per requirement.

## License

The Expo starter files in `Frontend/` are under the MIT license (see `Frontend/LICENSE`).
