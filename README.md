# Car Rental Project - Technical Documentation

## 1. Project Overview

This project is a full-stack **car rental and driver booking platform** with AI-assisted trip planning and document verification workflows.

### What this project does
- Allows users to browse available cars and place booking requests.
- Supports multiple roles: `user` (renter), `agency` (vehicle owner), `driver`, and `admin`.
- Lets agencies add vehicles with vehicle metadata and location.
- Lets renters book vehicles (with or without driver) and request independent drivers.
- Provides KYC/document verification flows for identity, driving license, and car license.
- Includes an AI assistant (via Ollama) that recommends vehicles based on natural-language user needs.

### Problem it solves
- Centralizes vehicle discovery, booking lifecycle, and role-based operations in one platform.
- Reduces manual matching by offering AI-based recommendation for vehicle selection.
- Adds trust/safety controls through document verification and admin review.

### Type of system
- **Frontend**: Single-page web application (React + Vite).
- **Backend**: REST API (Node.js + Express).
- **Database**: MongoDB via Mongoose ODM.
- **AI integration**: Local Ollama model (`llama3`) for trip planning/recommendations, with server-side Gemini fallback only.
- **External AI verification service**: OCR/fraud scan endpoint at `http://localhost:8000/api/ocr/scan`, with server-side Gemini OCR fallback only.

### Key features
- Authentication and JWT-based authorization.
- Multi-role dashboards with role-specific actions.
- Vehicle CRUD for agencies.
- Booking lifecycle management (`pending`, `confirmed`, `active`, `completed`, etc.).
- Review and rating system for vehicles/users.
- KYC verification pipeline with admin moderation.
- AI trip assistant with recommendation response.

### How users interact
1. Register/login.
2. Browse vehicles or drivers.
3. Submit bookings.
4. Complete KYC where needed.
5. Track and update booking status from dashboard.
6. Use chat assistant for recommendation support.

### High-level workflow
1. User opens frontend and authenticates.
2. Frontend calls backend REST APIs.
3. Backend validates JWT and business rules.
4. Backend persists/retrieves data from MongoDB.
5. For AI features, backend calls local Ollama.
6. For KYC scans, backend forwards uploaded documents to OCR/fraud API.
7. Backend returns JSON responses to frontend.

---

## 2. Technologies Used

### Programming Languages
- **JavaScript (Node.js + React)**  
  Chosen for full-stack consistency (same language in frontend and backend), faster iteration, and rich ecosystem.
- **CSS (Tailwind utility classes + base CSS)**  
  Used for fast UI development and responsive styling.
- **HTML**  
  Vite SPA shell (`index.html`).

### Frameworks and Libraries

#### Backend
- `express`: HTTP routing and middleware composition.
- `mongoose`: schema-based MongoDB modeling and relationships.
- `jsonwebtoken`: token-based auth (JWT issue/verify).
- `bcryptjs`: password hashing.
- `multer`: multipart/form-data upload handling.
- `axios`: outbound HTTP requests (Ollama + OCR/fraud service).
- `cors`: cross-origin access between frontend/backend.
- `dotenv`: runtime env config loading.
- `form-data`: constructs multipart payload to OCR service.
- `nodemon`: development auto-reload.

Cloud fallback support:
- `@google/generative-ai` (Gemini SDK) is used server-side only when local AI/OCR is unavailable or inconclusive.

Installed but currently not used in active code paths:
- `sharp`,
- `tesseract.js`.

#### Frontend
- `react`, `react-dom`: SPA UI framework and renderer.
- `react-router-dom`: client routing/navigation.
- `axios`: API communication.
- `leaflet` + `react-leaflet`: map rendering and coordinate selection.
- `tailwindcss` + `postcss` + `autoprefixer`: utility-first styling pipeline.
- `vite`: dev server and build tool.
- `eslint` and plugins: code quality checks.

### AI / LLM Components
- **Model**: `llama3` (served by local Ollama instance).
- **Where used**: backend `POST /api/chat`.
- **Why chosen**:
  - local deployment (privacy and low latency in development),
  - easy local inference through Ollama HTTP API,
  - no external LLM billing requirement for this feature.
- **Integration method**:
  - Backend builds a fleet-context prompt from available vehicles.
  - Sends request to `http://127.0.0.1:11434/api/generate` with `stream: false` and `format: "json"`.
  - Parses structured JSON response and fetches recommended vehicles by IDs.
  - If Ollama fails and `GEMINI_API_KEY` exists in `server/.env`, backend retries server-side with Gemini `gemini-2.5-flash`.
- **Prompt strategy**:
  - role/persona framing (concierge),
  - explicit output contract (strict JSON),
  - recommendation constraints (1-2 cars + savings tip),
  - separation between user-facing text and backend IDs.

### Gemini fallback
- `GEMINI_API_KEY` belongs only in `server/.env`; never expose it through `VITE_*` variables or client code.
- Chat fallback uses `gemini-2.5-flash` after local Ollama fails.
- KYC/OCR fallback uses `gemini-2.5-flash` after the Python OCR service fails or returns `success:false`.
- Local AI remains primary for both chat and OCR workflows.

### Databases
- **MongoDB** selected for:
  - flexible document schema for evolving KYC and booking structures,
  - straightforward relation modeling through ObjectId references in Mongoose.
- **Schema design highlights**:
  - `User`: auth, role, KYC status/data, profile, rating, availability.
  - `Vehicle`: owner relation, listing details, KYC status/doc data, ratings.
  - `Booking`: renter/owner/driver links, temporal fields, status transitions.
  - `Review`: references booking and target user/vehicle.
  - `DriverProfile`: extended driver metadata.

### APIs and Services
- **Internal REST API** (Express) under `/api/*`.
- **Ollama local API** for recommendations.
- **External local OCR/fraud API** for KYC scan decisions.

### Verification and Security
- JWT auth middleware (`Authorization: Bearer <token>`).
- Passwords hashed with bcrypt.
- Role-gated admin endpoints.
- Owner/self authorization checks for delete/update operations.
- KYC status state transitions with AI pre-check + admin review.
- Upload handling via multer with image filtering in shared upload middleware.

---

## 3. System Architecture

### Architectural style
Layered monolith with modular folders:
- API layer (`routes`)
- Business logic layer (`controllers`)
- Data layer (`models`)
- Middleware layer (`middleware`)

Frontend is a separate SPA client that consumes backend APIs.

### Backend structure
- `server.js` initializes app, DB, middleware, route mounts.
- Route files map paths to controllers.
- Controllers implement business rules and side effects.
- Mongoose models encapsulate schema and persistence.

### AI component placement
- AI recommendation logic is encapsulated in `controllers/aiController.js`.
- No direct frontend-to-Ollama call; frontend always talks to backend.

### Data flow and component communication
1. Browser action triggers frontend API call.
2. Backend route executes middleware (auth/upload as needed).
3. Controller validates input and authorization.
4. Controller reads/writes MongoDB.
5. Optional external call to Ollama or OCR service.
6. Backend responds with JSON.
7. Frontend updates UI state.

### Request flow example (booking request)
1. User clicks booking in `VehicleDetails`.
2. Frontend sends `POST /api/bookings` with JWT.
3. Backend `protect` middleware validates token.
4. `bookingController.createBooking` checks date overlap (for vehicles).
5. Booking record is created with initial status.
6. JSON confirmation is returned to frontend.

---

## 4. Folder Structure (Full Explanation)

Source-focused tree (excluding `node_modules`):

```text
car-rental-project/
  package.json
  package-lock.json
  README.md
  client/
    .gitignore
    README.md
    index.html
    package.json
    package-lock.json
    vite.config.js
    eslint.config.js
    tailwind.config.js
    postcss.config.js
    public/
      vite.svg
    src/
      main.jsx
      App.jsx
      App.css
      index.css
      assets/
        react.svg
      components/
        AiChat.jsx
        CarLicenseUpload.jsx
        Hero.jsx
      pages/
        Landing.jsx
        Home.jsx
        Login.jsx
        Register.jsx
        Drivers.jsx
        Dashboard.jsx
        Profile.jsx
        AddVehicle.jsx
        VehicleDetails.jsx
        AdminDashboard.jsx
  server/
    .env
    package.json
    package-lock.json
    nodemon.json
    server.js
    config/
      db.js
    controllers/
      authController.js
      vehicleController.js
      bookingController.js
      reviewController.js
      kycController.js
      aiController.js
      driverController.js
    middleware/
      authMiddleware.js
      kycMiddleware.js
      uploadMiddleware.js
    models/
      User.js
      vehicle.js
      booking.js
      Review.js
      DriverProfile.js
    routes/
      auth.js
      users.js
      vehicles.js
      bookings.js
      reviews.js
      adminRoutes.js
      drivers.js
      ai.js
    uploads/ (runtime-created; served statically)
```

### Folder responsibilities
- `/client`: all frontend app code and build config.
- `/client/src/components`: reusable UI pieces.
- `/client/src/pages`: route-level screens and workflows.
- `/server`: backend API and business logic.
- `/server/config`: infrastructure config (DB connection).
- `/server/controllers`: endpoint business logic implementation.
- `/server/models`: MongoDB schemas and relations.
- `/server/routes`: API endpoint definitions.
- `/server/middleware`: auth/KYC/upload cross-cutting logic.
- `/server/uploads`: uploaded images/docs storage (runtime data).

---

## 5. File-by-File Explanation

### Root files
- `package.json`: root dev tooling deps (`tailwindcss`, `postcss`, `autoprefixer`), no scripts.
- `package-lock.json`: lockfile for root packages.
- `README.md`: this project documentation.

### Frontend config and shell
- `client/index.html`: SPA mount point (`#root`) and script loader.
- `client/package.json`: frontend scripts (`dev`, `build`, `lint`, `preview`) and dependencies.
- `client/package-lock.json`: lockfile for frontend packages.
- `client/vite.config.js`: Vite + React plugin config.
- `client/eslint.config.js`: lint rules for React Hooks/Fast Refresh and JS quality.
- `client/tailwind.config.js`: Tailwind content scan paths.
- `client/postcss.config.js`: Tailwind + Autoprefixer setup.
- `client/.gitignore`: ignores build/artifacts.
- `client/README.md`: default template-level README (not project-specific).

### Frontend app/core
- `client/src/main.jsx`: app bootstrap (`ReactDOM.createRoot` + `<App />`).
- `client/src/App.jsx`: global layout, route table, navbar auth logic, persistent AI chat widget.
- `client/src/index.css`: Tailwind directives.
- `client/src/App.css`: template CSS (largely non-critical/legacy).
- `client/src/assets/react.svg`, `client/public/vite.svg`: template assets.

### Frontend components
- `client/src/components/AiChat.jsx`
  - Floating chat panel.
  - Calls backend `POST /api/chat`.
  - Displays assistant reply and recommended vehicle cards/links.
- `client/src/components/CarLicenseUpload.jsx`
  - Upload component for car license verification.
  - Sends file + metadata for KYC verification.
  - Present but not currently mounted in main route flow.
- `client/src/components/Hero.jsx`
  - AI trip planner hero section.
  - Also calls chat endpoint.
  - Present but not currently wired into active route tree.

### Frontend pages
- `client/src/pages/Landing.jsx`
  - Marketing entry page with role-aware CTA buttons.
- `client/src/pages/Home.jsx`
  - Vehicle list/explore page.
  - Fetches available vehicles and supports local filtering.
- `client/src/pages/Login.jsx`
  - Login form, calls `/api/auth/login`, stores `userInfo` in `localStorage`.
- `client/src/pages/Register.jsx`
  - Registration form with role selection, calls `/api/auth/register`.
- `client/src/pages/Drivers.jsx`
  - Driver marketplace view.
  - Creates driver booking requests via `/api/bookings`.
- `client/src/pages/Dashboard.jsx`
  - Multi-role operations center (renter/agency/driver/admin links).
  - Booking state update actions and agency inventory controls.
- `client/src/pages/Profile.jsx`
  - User profile updates, image upload, KYC document submission, account deletion.
- `client/src/pages/AddVehicle.jsx`
  - Vehicle onboarding form, map coordinate selection.
  - Step 1 creates vehicle with image upload.
  - Step 2 submits car-license document for verification.
- `client/src/pages/VehicleDetails.jsx`
  - Vehicle detail view, reviews fetch, booking creation flow.
  - Enforces frontend KYC/license checks before some booking actions.
- `client/src/pages/AdminDashboard.jsx`
  - Admin moderation queue for pending KYC docs.
  - Approve/reject actions call admin review endpoint.

### Backend runtime/config
- `server/server.js`
  - Loads env, connects DB, applies middleware, mounts routes, serves `/uploads`.
- `server/package.json`
  - Backend scripts and dependencies.
- `server/package-lock.json`
  - Lockfile.
- `server/nodemon.json`
  - Ignores upload directory to avoid restart noise.
- `server/.env`
  - Environment values (port, DB URI, JWT secret, API keys).  
  - Should not be committed with real secrets in production.
- `server/config/db.js`
  - Handles MongoDB connection and fail-fast behavior.

### Backend middleware
- `server/middleware/authMiddleware.js`
  - Verifies JWT and loads current user into request context.
- `server/middleware/kycMiddleware.js`
  - Enforces verified KYC status when applied.
- `server/middleware/uploadMiddleware.js`
  - Shared multer storage and image filter.

### Backend models
- `server/models/User.js`
  - User identity/auth fields, role, KYC fields, rating and availability data.
- `server/models/vehicle.js`
  - Vehicle listing schema, owner relation, pricing/capabilities, KYC + ratings.
- `server/models/booking.js`
  - Booking relations, status enum, dates, handshake completion flags.
- `server/models/Review.js`
  - Review model tying author + booking to target user/vehicle.
- `server/models/DriverProfile.js`
  - Extra driver-specific profile metadata.

### Backend controllers
- `server/controllers/authController.js`
  - Register/login logic, password hashing, JWT generation, role constraints.
- `server/controllers/vehicleController.js`
  - Alternative vehicle controller functions (not primary route path in current wiring).
- `server/controllers/bookingController.js`
  - Creates bookings, fetches user bookings, updates status, finish-ride synchronization.
- `server/controllers/reviewController.js`
  - Creates reviews and recalculates aggregate ratings.
- `server/controllers/kycController.js`
  - File verification pipeline with OCR/fraud API and KYC status updates.
- `server/controllers/aiController.js`
  - Builds recommendation prompt, calls Ollama, returns suggestions.
- `server/controllers/driverController.js`
  - Driver profile create/update and driver search/list.

### Backend routes
- `server/routes/auth.js`: `/api/auth/*`.
- `server/routes/users.js`: profile, drivers list, driver settings, KYC verify, delete.
- `server/routes/vehicles.js`: list/get/create/delete vehicles.
- `server/routes/bookings.js`: booking create/list/status/finish endpoints.
- `server/routes/reviews.js`: create/list reviews.
- `server/routes/adminRoutes.js`: admin moderation endpoints.
- `server/routes/drivers.js`: dedicated driver profile endpoints.
- `server/routes/ai.js`: AI chat endpoint.

---

## 6. Data Flow

### Standard API flow
1. User performs action in React UI.
2. UI builds request (JSON or multipart/form-data).
3. Backend route receives request.
4. Middleware runs (auth/upload where configured).
5. Controller validates business rules.
6. Controller accesses MongoDB via Mongoose.
7. Optional outbound service call:
   - Ollama for recommendations,
   - OCR/fraud API for KYC.
8. Controller writes updates and returns response.
9. Frontend updates local state/UI and may refresh lists.

### KYC flow
1. User uploads identity/license/car-license document.
2. Backend forwards image + metadata to OCR/fraud service.
3. Service returns extraction/fraud assessment.
4. Backend maps result to `verified` / `pending` / `rejected`.
5. User/vehicle KYC fields are updated.
6. Admin can review pending items and finalize status.

### AI recommendation flow
1. User sends natural language query in chat widget.
2. Backend loads available vehicles.
3. Prompt is built with fleet snapshot + strict JSON format instructions.
4. Ollama returns structured recommendation.
5. Backend resolves recommended IDs to vehicle docs.
6. Frontend displays response text + matched vehicle cards.

---

## 7. Key Algorithms / Logic

### Booking overlap prevention
- For vehicle bookings, the backend checks for existing bookings in overlapping date windows before creating new entries.
- Prevents double allocation for confirmed windows.

### Booking completion handshake
- Both renter and driver can mark ride completion.
- Final transition to `completed` occurs only when completion conditions are met; then resource availability resets.

### Aggregate rating recalculation
- After each new review, system recomputes average rating and review count for targeted user/vehicle.
- Keeps cached aggregate fields current for listing pages.

### KYC decision mapping
- OCR/fraud response is translated into platform statuses:
  - `rejected` on high fraud/invalidity,
  - `verified` on clean valid results,
  - otherwise `pending` for admin/manual review.

### AI recommendation formatting contract
- Prompt enforces JSON output keys (`reply`, `savings_tip`, `recommended_ids`) to simplify parsing and prevent brittle text extraction.

---

## 8. Dependencies

### Root (`/package.json`)
- `tailwindcss`, `postcss`, `autoprefixer`: base styling build toolchain at workspace level.

### Backend (`/server/package.json`)
- `express`: API server.
- `mongoose`: MongoDB ODM.
- `jsonwebtoken`: JWT auth tokens.
- `bcryptjs`: password hashing.
- `multer`: uploads.
- `axios`: external HTTP calls.
- `form-data`: multipart request builder.
- `cors`: cross-origin requests.
- `dotenv`: env loading.
- `nodemon`: dev server reload.
- `@google/generative-ai`: server-only Gemini fallback for chat and OCR.
- `sharp`, `tesseract.js`: installed for potential AI/image extensions (currently not central in live request path).

### Frontend (`/client/package.json`)
- `react`, `react-dom`: SPA rendering.
- `react-router-dom`: route navigation.
- `axios`: API calls.
- `leaflet`, `react-leaflet`: map and coordinate selection.
- Dev tooling: `vite`, `@vitejs/plugin-react`, `eslint` suite, `tailwindcss`, `postcss`, `autoprefixer`.

### Environment configs
Current backend env keys used by runtime:
- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `NODE_ENV` (optional behavior toggle)
- `GEMINI_API_KEY` (optional cloud fallback for chat and OCR)

---

## 9. Environment Setup

### System requirements
- OS: Windows/macOS/Linux.
- Node.js: 18+ recommended (20 LTS preferred).
- npm: comes with Node.js.
- MongoDB: local server (default config references localhost).
- Ollama: required for AI chat endpoint.
- Optional: Python OCR service at port `8000` for KYC verification endpoint.

### Runtime services required
- Backend API: `localhost:5000` (default).
- Frontend dev server: `localhost:5173` (Vite default).
- MongoDB: `mongodb://127.0.0.1:27017`.
- Ollama API: `127.0.0.1:11434`.
- OCR/fraud API: `localhost:8000`.

### GPU requirements
- Not strictly required for project startup.
- Ollama model performance improves with GPU.
- CPU-only mode works but may be slower.

---

## 10. Installation Guide

### 1) Clone repository
```bash
git clone <your-repo-url>
cd car-rental-project
```

### 2) Install root dependencies
```bash
npm install
```

### 3) Install backend dependencies
```bash
cd server
npm install
```

### 4) Install frontend dependencies
```bash
cd ../client
npm install
```

### 5) Configure backend environment
Copy the template and fill in your secrets (never commit `server/.env`):

```bash
cd server
copy .env.example .env
```

Edit `server/.env` — required keys:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/car_rental_project
JWT_SECRET=<replace-with-strong-random-secret>
GEMINI_API_KEY=<your-key-from-google-ai-studio>
```
`GEMINI_API_KEY` is required only for cloud fallback. Without it, local Ollama chat and the local Python OCR service still remain the primary paths.

### 6) Setup MongoDB
- Ensure MongoDB service is running.
- Confirm connection string in `MONGO_URI` is reachable.

### 7) Setup Ollama + model
```bash
ollama pull llama3
ollama serve
```

### 8) (Optional but recommended) Start OCR/fraud service
If KYC verification endpoint is expected to work, run the Python OCR service so backend can reach:
`http://localhost:8000/api/ocr/scan`.

### 9) Start backend
```bash
cd server
npm run dev
```

### 10) Start frontend
```bash
cd ../client
npm run dev
```

---

## 11. Running the Project

### Start order
1. MongoDB
2. Ollama (`ollama serve`)
3. OCR service (if KYC required)
4. Backend (`server`)
5. Frontend (`client`)

### Verify backend health
- Open [http://localhost:5000](http://localhost:5000)
- Expected text: API running / DB connected message.

### Verify frontend
- Open [http://localhost:5173](http://localhost:5173)
- Register a user and perform login.

### Verify key workflows
- Vehicle browsing: `/explore`.
- Booking: open vehicle details and submit booking.
- Driver booking: `/drivers`.
- Profile/KYC upload: `/profile`.
- AI chat recommendations: chat widget on any main route.
- Admin moderation: login as admin role and open `/admin`.

### Verify AI fallback behavior
- Chat with Ollama running: backend logs `AI chat provider used: ollama`.
- Stop Ollama, then chat again with `GEMINI_API_KEY` set: backend logs `AI chat provider used: gemini` and uses `gemini-2.5-flash`.
- Upload KYC with Python OCR running: backend logs `KYC OCR provider used: python_ocr`.
- Stop the OCR service, then upload a clear ID/license with `GEMINI_API_KEY` set: backend logs `KYC OCR provider used: gemini` and uses `gemini-2.5-flash`.
- Use an invalid or missing `GEMINI_API_KEY`: local paths still work; fallback returns a graceful service-down/retry response when local AI is unavailable.

---

## 12. Example Usage

### Auth - Register
`POST /api/auth/register`

Request:
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "secure123",
  "role": "user"
}
```

Response (example):
```json
{
  "_id": "661...",
  "name": "Alice",
  "email": "alice@example.com",
  "role": "user",
  "token": "<jwt-token>"
}
```

### Auth - Login
`POST /api/auth/login`

Request:
```json
{
  "email": "alice@example.com",
  "password": "secure123"
}
```

### Vehicles - List
`GET /api/vehicles`

Response (example):
```json
[
  {
    "_id": "v1",
    "make": "Toyota",
    "model": "Corolla",
    "price_per_day": 900,
    "isAvailable": true
  }
]
```

### Booking - Create
`POST /api/bookings` (Bearer token required)

Request:
```json
{
  "vehicle": "v1",
  "renter": "u1",
  "owner": "u2",
  "startDate": "2026-04-10T08:00:00.000Z",
  "endDate": "2026-04-12T20:00:00.000Z",
  "withDriver": false,
  "totalPrice": 1800
}
```

### AI Chat
`POST /api/chat`

Request:
```json
{
  "message": "I need an affordable 5-seat car for 2 days in Alexandria."
}
```

Response (example):
```json
{
  "reply": "I recommend two practical options for your trip...",
  "savings_tip": "Choose a compact sedan without driver to reduce cost.",
  "recommended": [
    {
      "_id": "v1",
      "make": "Nissan",
      "model": "Sunny"
    }
  ]
}
```

---

## 13. Common Errors and Fixes

- **`MongoNetworkError` or DB connect failure**  
  Check MongoDB service is running and `MONGO_URI` is correct.

- **`Invalid token` / unauthorized responses**  
  Ensure frontend sends `Authorization: Bearer <token>` and token exists in `localStorage.userInfo`.

- **AI chat error: Ollama unavailable**  
  Run `ollama serve` and verify model exists (`ollama list`, `ollama pull llama3`).

- **KYC upload returns service unavailable**  
  OCR/fraud service at `localhost:8000` is down or endpoint mismatch; start service and re-test.

- **CORS issues in browser**  
  Confirm backend is running and frontend points to the same host/port expected by hardcoded API URLs.

- **Image upload fails**  
  Verify file type and multipart form field names (`image`, `file`) per endpoint expectations.

- **Admin page inaccessible**  
  Ensure authenticated user role is `admin` and JWT is valid.

---

## 14. Future Improvements

### Performance
- Add API pagination/filtering/sorting for vehicles/bookings/reviews.
- Introduce query indexes for date and availability-heavy reads.
- Replace repeated full aggregate scans with incremental rating updates.

### Scalability
- Split AI and KYC integrations into dedicated service modules.
- Add message queue for long-running verification operations.
- Move upload storage to object storage (S3-compatible) for production scale.

### Architecture
- Introduce service/repository layers to reduce controller complexity.
- Centralize API client on frontend and remove hardcoded base URLs.
- Add OpenAPI specification and request validation middleware.

### Security
- Move secrets to secure vault and rotate exposed development secrets.
- Add rate limiting, helmet, input sanitization, and stricter upload constraints.
- Consider refresh tokens and token revocation strategy.

### Maintainability
- Add automated tests (unit + integration + e2e).
- Remove unused dependencies and dead components.
- Add `.env.example` and root-level contributor docs.

---

## 15. Developer Notes

- Keep model names and import casing consistent (`vehicle.js` vs `Vehicle` imports) to avoid cross-platform case issues.
- Treat `server/.env` as local-only; never commit real secrets.
- Prefer centralized constants for API base URL (`VITE_API_BASE_URL`) and endpoint paths.
- Before adding new roles or statuses, update both backend enums and frontend conditional rendering.
- For booking logic changes, test overlap checks and status transitions end-to-end.
- For KYC updates, verify both automated OCR decision and admin moderation paths.
- Existing code contains some legacy/unused assets/components; evaluate before refactoring or removing.

---

## Appendix: API Endpoint Quick Reference

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Users
- `GET /api/users/profile` (auth)
- `GET /api/users/drivers`
- `PUT /api/users/driver-settings` (auth)
- `PUT /api/users/profile` (auth, multipart)
- `POST /api/users/kyc/verify` (auth, multipart)
- `DELETE /api/users/:id` (auth)

### Vehicles
- `GET /api/vehicles`
- `GET /api/vehicles/:id`
- `POST /api/vehicles` (auth, multipart)
- `DELETE /api/vehicles/:id` (auth)

### Bookings
- `POST /api/bookings` (auth)
- `GET /api/bookings` (auth)
- `PUT /api/bookings/:id` (auth)
- `PUT /api/bookings/finish/:id` (auth)

### Reviews
- `POST /api/reviews` (auth)
- `GET /api/reviews/vehicle/:vehicleId`

### Admin
- `GET /api/admin/pending` (auth, admin)
- `PUT /api/admin/review` (auth, admin)

### AI
- `POST /api/chat`
