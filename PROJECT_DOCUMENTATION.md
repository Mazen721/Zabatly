# Zabatly (زبطلي) — Complete Project Documentation

> **Last updated:** 2026-06-14
> **Project Name:** Zabatly ("زبطلي", Egyptian Arabic for "fix it for me")
> **Tagline:** AI-driven smart transportation rental platform that handles everything for you.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Brand & Product Identity](#2-brand--product-identity)
3. [Technology Stack](#3-technology-stack)
4. [System Architecture](#4-system-architecture)
5. [Complete Folder Structure](#5-complete-folder-structure)
6. [Environment Configuration](#6-environment-configuration)
7. [Database Models (Full Schema Details)](#7-database-models-full-schema-details)
8. [Server — Entry Point & Middleware](#8-server--entry-point--middleware)
9. [Server — Controllers (Every Function)](#9-server--controllers-every-function)
10. [Server — Routes (Complete API Reference)](#10-server--routes-complete-api-reference)
11. [Server — Utilities](#11-server--utilities)
12. [Python OCR Service](#12-python-ocr-service)
13. [Client — Configuration & Build](#13-client--configuration--build)
14. [Client — Application Shell (App.jsx)](#14-client--application-shell-appjsx)
15. [Client — Pages (Every Screen)](#15-client--pages-every-screen)
16. [Client — Components](#16-client--components)
17. [Client — Internationalization (i18n)](#17-client--internationalization-i18n)
18. [Client — Design System (Tailwind)](#18-client--design-system-tailwind)
19. [Mobile App (React Native / Expo)](#19-mobile-app-react-native--expo)
20. [Design System Specification](#20-design-system-specification)
21. [Data Flow & Key Algorithms](#21-data-flow--key-algorithms)
22. [Deployment & Hosting](#22-deployment--hosting)
23. [Installation Guide](#23-installation-guide)
24. [Running the Project](#24-running-the-project)
25. [API Endpoint Quick Reference](#25-api-endpoint-quick-reference)
26. [Common Errors & Fixes](#26-common-errors--fixes)
27. [Future Improvements](#27-future-improvements)
28. [Developer Notes](#28-developer-notes)

---

## 1. Project Overview

### What Zabatly Does
A full-stack **car rental and driver booking platform** with AI-assisted trip planning and document verification workflows. It has three distinct surfaces:

| Surface | Tech | Status |
|---------|------|--------|
| **Web Client** | React 19 + Vite + Tailwind CSS | Production-ready |
| **REST API** | Node.js + Express 5 + MongoDB | Production-ready |
| **Mobile App** | React Native + Expo SDK 56 | In development |
| **OCR Service** | Python + FastAPI + Gemini | Operational |

### Problem It Solves
- Centralizes vehicle discovery, booking lifecycle, and role-based operations in one platform.
- Reduces manual matching by offering AI-based recommendation for vehicle selection.
- Adds trust/safety controls through OCR document verification and admin review.

### Key Features
1. **Multi-role system:** `user` (renter), `agency` (vehicle owner/host), `driver` (freelance), `admin`
2. **Vehicle CRUD** for agencies with image uploads to Cloudinary
3. **Booking lifecycle:** `pending` → `confirmed` → `active` → `completed` (with `cancelled` and `expired`)
4. **Dual booking types:** Vehicle bookings (with dates) and standalone driver bookings
5. **Payment system:** Vodafone Cash, InstaPay, Card — with proof uploads and admin confirmation
6. **KYC verification pipeline:** National ID, Passport, Driving License, Car License — with AI OCR + admin moderation
7. **AI trip assistant:** Local Ollama (llama3) primary, Gemini cloud fallback
8. **Review and rating system** for vehicles and users
9. **Notification system** (in-app)
10. **Driver marketplace** with availability status, daily rates, and booking
11. **Saved vehicles** (favorites/wishlist)
12. **Contact form** with admin notification
13. **Bilingual support** (English/Arabic with RTL)
14. **Public user profiles** with privacy controls
15. **Booking expiration** (automatic cleanup of past-due bookings)
16. **Reverse geocoding** via OpenStreetMap Nominatim
17. **Upgrade to Host** — renters can become vehicle owners

### User Roles

| Role | Capabilities |
|------|-------------|
| `user` (renter) | Browse vehicles, book vehicles/drivers, submit KYC, leave reviews, save vehicles, upgrade to host |
| `agency` (host) | All renter capabilities + list vehicles, manage fleet, accept/decline bookings, upload car licenses |
| `driver` | Accept/decline driver bookings, manage availability/status, complete rides |
| `admin` | Full platform overview, KYC moderation queue, payment confirmation, user/vehicle/booking management, contact messages, KYC audit logs |

### High-Level Workflow
1. User opens frontend and authenticates (JWT).
2. Frontend calls backend REST APIs.
3. Backend validates JWT and business rules.
4. Backend persists/retrieves data from MongoDB via Mongoose.
5. For AI features, backend calls local Ollama first, then Gemini fallback.
6. For KYC scans, backend forwards uploaded documents to Python OCR service, then Gemini fallback.
7. Images are stored on Cloudinary via `multer-storage-cloudinary`.
8. Backend returns JSON responses to frontend.

---

## 2. Brand & Product Identity

### Brand Name
**Zabatly** (زبطلي) — Egyptian Arabic for "fix it for me" / "sort it out for me"

### Brand Personality
**Reliable, Friendly, Confident.**
- Reliable: always delivers, no surprises, trustworthy.
- Friendly: warm, approachable, never cold or corporate.
- Confident: knows what it's doing. No hedging, no clutter.

### Design References
- **Airbnb**: warm browsing experience, discovery-oriented, trust-building
- **Revolut**: modern, slick, confident UI, premium feel
- **WhatsApp**: effortless, familiar, "just works" simplicity

### Anti-References
- No boring/generic startup templates
- No childish/cartoonish interfaces
- No government/bureaucratic UI
- No ride-hailing clones (not Uber/Careem skin)

### Target Market
Egyptian and Arab market. Users range from students and young professionals to families and business travelers. Mobile-first, familiar patterns, zero friction.

---

## 3. Technology Stack

### Backend
| Library | Version | Purpose |
|---------|---------|---------|
| `express` | ^5.2.1 | HTTP routing and middleware |
| `mongoose` | ^9.1.6 | MongoDB ODM |
| `jsonwebtoken` | ^9.0.3 | JWT auth tokens (30-day expiry) |
| `bcryptjs` | ^3.0.3 | Password hashing (salt factor 10) |
| `multer` | ^2.1.1 | Multipart file upload handling |
| `multer-storage-cloudinary` | ^4.0.0 | Direct-to-Cloudinary storage |
| `cloudinary` | ^2.10.0 | Cloud image hosting |
| `axios` | ^1.14.0 | Outbound HTTP (Ollama, OCR, geocode) |
| `cors` | ^2.8.6 | Cross-origin access |
| `dotenv` | ^17.3.1 | Environment config loading |
| `form-data` | ^4.0.5 | Multipart payload builder |
| `@google/generative-ai` | ^0.24.1 | Gemini SDK (server-only fallback) |
| `nodemon` | ^3.1.11 | Dev server auto-reload |

### Frontend
| Library | Version | Purpose |
|---------|---------|---------|
| `react` | ^19.2.0 | SPA UI framework |
| `react-dom` | ^19.2.0 | DOM renderer |
| `react-router-dom` | ^7.13.0 | Client-side routing |
| `axios` | ^1.13.5 | API communication |
| `leaflet` | ^1.9.4 | Map rendering |
| `react-leaflet` | ^5.0.0 | React Leaflet wrapper |
| `i18next` | ^26.3.0 | Internationalization framework |
| `react-i18next` | ^17.0.8 | React i18n bindings |
| `i18next-browser-languagedetector` | ^8.2.1 | Auto-detect browser language |
| `vite` | ^7.3.1 | Dev server and build tool |
| `tailwindcss` | ^3.4.17 | Utility-first CSS |

### Mobile
| Library | Version | Purpose |
|---------|---------|---------|
| `expo` | ~56.0.3 | React Native framework |
| `expo-router` | ~56.2.5 | File-based routing |
| `react-native` | 0.85.3 | Mobile framework |
| `react-native-reanimated` | ^4.3.1 | Animations |
| `@react-native-async-storage/async-storage` | 2.2.0 | Local storage |
| `@expo-google-fonts/manrope` | ^0.4.2 | Brand font |
| `@expo-google-fonts/cairo` | ^0.4.2 | Arabic font |
| `expo-image` | ~56.0.8 | Optimized image component |
| `expo-image-picker` | ^56.0.12 | Camera/gallery access |

### Python OCR Service
| Library | Version | Purpose |
|---------|---------|---------|
| `fastapi` | 0.115.12 | API framework |
| `uvicorn` | 0.34.2 | ASGI server |
| `python-multipart` | 0.0.20 | File upload handling |
| `opencv-python-headless` | 4.11.0.86 | Image preprocessing |
| `numpy` | 2.2.6 | Numeric operations |
| `requests` | 2.32.3 | HTTP client |
| `pydantic` | 2.11.3 | Data validation |

### AI / LLM Components
- **Primary:** `llama3` served by local Ollama at `http://127.0.0.1:11434/api/generate`
- **Chat fallback:** `gemini-3.1-flash-lite` via Google Generative AI SDK
- **OCR fallback:** `gemini-3.5-flash` via Google Generative AI SDK (vision)
- **Prompt strategy:** Role/persona framing (concierge), strict JSON output contract, fleet context injection, recommendation constraints (1-2 cars + savings tip)

### Database
- **MongoDB** via Mongoose ODM
- Default connection: `mongodb://127.0.0.1:27017/car_rental_project`
- Fail-fast on connection error (`process.exit(1)`)

### External Services
| Service | Purpose | Endpoint |
|---------|---------|----------|
| Cloudinary | Image/document cloud storage | Via SDK |
| Ollama | Local LLM inference | `http://127.0.0.1:11434` |
| Python OCR | Document scanning | `http://localhost:8000/api/ocr/scan` |
| Nominatim (OSM) | Reverse geocoding | `https://nominatim.openstreetmap.org/reverse` |
| Google Gemini | AI fallback (chat + OCR) | Via SDK |
| Railway | Backend hosting | `https://zabatly-production.up.railway.app` |
| Vercel | Frontend hosting | Via vercel.json |

---

## 4. System Architecture

### Architectural Style
Layered monolith with modular folders:
- **API layer** (`routes/`) — URL mapping
- **Business logic layer** (`controllers/`) — Request handling
- **Data layer** (`models/`) — MongoDB schemas
- **Middleware layer** (`middleware/`) — Cross-cutting concerns
- **Utilities layer** (`utils/`) — Shared helpers

Frontend is a separate SPA that consumes backend APIs.

### Component Communication

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  React SPA  │────▶│  Express API │────▶│   MongoDB   │
│  (Vite)     │◀────│  (REST)      │◀────│  (Mongoose) │
└─────────────┘     └──────┬───────┘     └─────────────┘
                           │
                    ┌──────┼──────┐
                    ▼      ▼      ▼
              ┌─────────┐ ┌────────┐ ┌──────────┐
              │ Ollama  │ │ Python │ │ Cloudinary│
              │ (LLM)   │ │ OCR    │ │ (Images) │
              └─────────┘ └────────┘ └──────────┘
                    │          │
                    ▼          ▼
              ┌─────────────────────┐
              │ Gemini (Fallback)   │
              └─────────────────────┘
```

### Dashboard Shell Architecture
All authenticated product surfaces share a consistent shell:
- Fixed 224px Midnight Navy sidebar on desktop
- Slide-in overlay on mobile
- Context strip for live status
- Sand-tinted content area

---

## 5. Complete Folder Structure

```
car-rental-project/
├── .gitignore
├── package.json                    # Root dev deps (tailwindcss, postcss, autoprefixer)
├── package-lock.json
├── README.md                       # Technical documentation
├── PRODUCT.md                      # Product specification & brand identity
├── DESIGN.md                       # Full design system specification
├── PROJECT_DOCUMENTATION.md        # This file
├── Images/                         # Project assets
├── Logo/                           # Brand logo files
│
├── client/                         # React SPA (Vite)
│   ├── .env                        # VITE_API_URL
│   ├── .env.example
│   ├── .gitignore
│   ├── index.html                  # SPA mount point (#root)
│   ├── package.json                # Frontend dependencies
│   ├── vite.config.js              # Vite + React plugin
│   ├── tailwind.config.js          # Custom design tokens
│   ├── postcss.config.js           # Tailwind + Autoprefixer
│   ├── eslint.config.js            # Lint rules
│   ├── vercel.json                 # SPA rewrite rule for Vercel
│   ├── dist/                       # Production build output
│   ├── public/
│   │   └── vite.svg
│   └── src/
│       ├── main.jsx                # App bootstrap (StrictMode + LanguageProvider)
│       ├── App.jsx                 # Router, Navbar, Routes, AppShell
│       ├── App.css                 # Legacy template CSS
│       ├── index.css               # Tailwind directives + global styles
│       ├── i18n.js                 # i18next configuration (15 namespaces × 2 languages)
│       ├── config/
│       │   └── api.js              # API base URL (Railway production default)
│       ├── context/
│       │   └── LanguageProvider.jsx # Language context + RTL management
│       ├── data/
│       │   └── egyptLocations.js   # Egyptian governorate/city data
│       ├── locales/
│       │   ├── en/                 # English translations (15 JSON files)
│       │   │   ├── common.json, landing.json, auth.json, explore.json,
│       │   │   ├── vehicle.json, drivers.json, payment.json, booking.json,
│       │   │   ├── profile.json, dashboard.json, admin.json, addVehicle.json,
│       │   │   ├── ai.json, contact.json, about.json
│       │   └── ar/                 # Arabic translations (15 JSON files)
│       ├── utils/                  # (empty directory)
│       ├── assets/
│       │   └── react.svg
│       ├── components/
│       │   ├── AiChat.jsx          # Floating AI chat widget
│       │   ├── CarLicenseUpload.jsx # Car license KYC upload
│       │   ├── Hero.jsx            # AI trip planner hero section
│       │   ├── LanguageSwitcher.jsx # EN/AR language toggle
│       │   ├── PaymentProofLink.jsx # Payment proof display component
│       │   └── dashboard/
│       │       ├── DashboardShell.jsx   # Shared sidebar + layout
│       │       ├── RenterDashboard.jsx  # Renter booking management
│       │       ├── OwnerDashboard.jsx   # Agency fleet + booking management
│       │       └── DriverDashboard.jsx  # Driver availability + ride management
│       └── pages/
│           ├── Landing.jsx          # Marketing landing page
│           ├── Home.jsx             # Vehicle explore/browse page
│           ├── Login.jsx            # Login form
│           ├── Register.jsx         # Registration with role selection
│           ├── Dashboard.jsx        # Role-based dashboard router
│           ├── AdminDashboard.jsx   # Admin moderation panel
│           ├── Profile.jsx          # User profile + KYC + settings
│           ├── AddVehicle.jsx       # Vehicle listing form + map
│           ├── VehicleDetails.jsx   # Vehicle detail + booking flow
│           ├── Drivers.jsx          # Driver marketplace
│           ├── PaymentPage.jsx      # Payment selection + proof upload
│           ├── BookingSuccess.jsx   # Post-booking confirmation
│           ├── AIAssistant.jsx      # Full-page AI chat
│           ├── UserPublicProfile.jsx # Public user profile view
│           ├── ContactUs.jsx        # Contact form
│           └── AboutUs.jsx          # About page
│
├── server/                         # Node.js REST API
│   ├── .env                        # Runtime secrets
│   ├── .env.example                # Template with all required keys
│   ├── .npmrc                      # npm config
│   ├── package.json                # Backend dependencies
│   ├── nodemon.json                # Ignores uploads dir
│   ├── server.js                   # Entry point (Express app bootstrap)
│   ├── config/
│   │   ├── db.js                   # MongoDB connection (fail-fast)
│   │   └── cloudinary.js           # Cloudinary v2 config
│   ├── middleware/
│   │   ├── authMiddleware.js       # JWT verify + user injection
│   │   ├── kycMiddleware.js        # Require verified KYC status
│   │   └── uploadMiddleware.js     # Cloudinary multer (4 uploaders)
│   ├── models/
│   │   ├── User.js                 # User (auth, KYC, driver, profile)
│   │   ├── vehicle.js              # Vehicle (listing, KYC, ratings)
│   │   ├── booking.js              # Booking (lifecycle, handshake)
│   │   ├── Review.js               # Review (author, target, rating)
│   │   ├── DriverProfile.js        # Driver professional profile
│   │   ├── DriverRequest.js        # Standalone driver ride requests
│   │   ├── Payment.js              # Payment records
│   │   ├── Notification.js         # In-app notifications
│   │   ├── ContactMessage.js       # Contact form submissions
│   │   ├── KycAttempt.js           # KYC retry tracking (24h TTL)
│   │   └── KycAuditLog.js          # Full KYC audit trail
│   ├── controllers/
│   │   ├── authController.js       # Register + Login
│   │   ├── vehicleController.js    # Vehicle CRUD
│   │   ├── bookingController.js    # Booking lifecycle
│   │   ├── reviewController.js     # Reviews + rating recalculation
│   │   ├── kycController.js        # Document verification pipeline
│   │   ├── aiController.js         # AI chat/recommendations
│   │   ├── driverController.js     # Driver profile CRUD
│   │   ├── driverRequestController.js # Driver ride request lifecycle
│   │   ├── geocodeController.js    # Reverse geocoding
│   │   ├── notificationController.js # Notification management
│   │   ├── paymentController.js    # Payment lifecycle
│   │   └── userController.js       # Profile updates
│   ├── routes/
│   │   ├── auth.js                 # POST register/login
│   │   ├── users.js                # Profile, drivers, KYC, saved vehicles, upgrade
│   │   ├── vehicles.js             # Vehicle CRUD + toggle
│   │   ├── bookings.js             # Booking CRUD + availability + finish
│   │   ├── payments.js             # Payment CRUD + admin status
│   │   ├── reviews.js              # Review CRUD
│   │   ├── adminRoutes.js          # Admin pending/overview/review/kyc-logs
│   │   ├── drivers.js              # Driver profile endpoints
│   │   ├── driverRequests.js       # Driver ride request lifecycle
│   │   ├── notifications.js        # Notification CRUD
│   │   ├── geocode.js              # Reverse geocode
│   │   ├── contact.js              # Contact form
│   │   └── ai.js                   # AI chat endpoint
│   ├── utils/
│   │   ├── bookingExpiration.js    # Auto-expire/complete past-due bookings
│   │   ├── egyptianIdValidator.js  # 14-digit NID validation
│   │   ├── geminiFallback.js       # Gemini SDK wrappers
│   │   └── notificationHelper.js   # createNotification helper
│   ├── services/                   # (empty)
│   ├── uploads/                    # (legacy, now Cloudinary)
│   └── ocr_service/               # Python OCR microservice
│       ├── main.py                 # FastAPI app
│       ├── ocr_engine.py           # OCR logic
│       ├── preprocessing.py        # Image preprocessing
│       ├── fraud_detector.py       # Fraud detection
│       ├── validators.py           # Document validators
│       ├── schemas.py              # Pydantic models
│       ├── requirements.txt        # Python dependencies
│       ├── test_ocr.py             # Test suite
│       └── test_national_id.jpg    # Test fixture
│
└── mobile/                         # React Native Expo App
    ├── .gitignore
    ├── app.json                    # Expo config (Zabatly, portrait, com.mazen721.mobile)
    ├── eas.json                    # EAS Build profiles (dev APK, preview APK, production)
    ├── package.json                # Mobile dependencies
    ├── tsconfig.json               # TypeScript config
    ├── eslint.config.js            # ESLint config
    ├── AGENTS.md / CLAUDE.md       # AI agent instructions
    ├── LICENSE                     # MIT License
    ├── android/                    # Native Android project
    ├── assets/                     # App icons, splash screens
    ├── scripts/                    # Project scripts
    └── src/
        ├── api/
        │   └── client.js           # Axios API client with auth
        ├── app/
        │   ├── _layout.jsx         # Root layout (fonts, auth)
        │   ├── index.jsx           # Entry screen
        │   ├── auth/               # Login/Register screens
        │   ├── onboarding/         # Onboarding flow
        │   └── tabs/               # Tab-based navigation
        ├── components/
        │   ├── VehicleCard.jsx     # Vehicle card component
        │   ├── VehicleSkeleton.jsx # Loading skeleton
        │   ├── BookingCard.jsx     # Booking card component
        │   ├── StatusBadge.jsx     # Status indicator
        │   └── ui/                 # Shared UI primitives
        ├── constants/              # App constants
        ├── context/
        │   └── AuthContext.jsx     # Auth state management
        ├── hooks/                  # Custom hooks
        ├── theme/
        │   ├── colors.js           # Color palette (matches Tailwind)
        │   ├── typography.js       # Font styles (Manrope + Cairo)
        │   ├── shadows.js          # Shadow definitions
        │   └── spacing.js          # Spacing scale
        └── utils/                  # Utility functions
```

---

## 6. Environment Configuration

### Server `.env` Keys

| Key | Required | Default | Description |
|-----|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Runtime mode |
| `PORT` | No | `5000` | Server listening port |
| `MONGO_URI` | **Yes** | — | MongoDB connection string |
| `JWT_SECRET` | **Yes** | — | JWT signing secret |
| `GEMINI_API_KEY` | No | — | Google AI Studio key (cloud fallback for chat + OCR) |
| `CLOUDINARY_CLOUD_NAME` | **Yes** | — | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | **Yes** | — | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | **Yes** | — | Cloudinary API secret |

### Client `.env` Keys

| Key | Required | Default | Description |
|-----|----------|---------|-------------|
| `VITE_API_URL` | No | `https://zabatly-production.up.railway.app` | Backend API base URL |

---

## 7. Database Models (Full Schema Details)

### 7.1 User (`models/User.js`)

```javascript
{
  // === Auth ===
  name:           { String, required },
  email:          { String, required, unique },
  password:       { String, required },      // bcrypt hashed
  role:           { String, enum: ['user', 'agency', 'driver', 'admin'], default: 'user' },
  phone:          { String, default: '' },
  is_verified:    { Boolean, default: false }, // legacy email/phone verification

  // === KYC / Identity ===
  kyc_status:     { String, enum: ['unsubmitted','pending','manual_review','verified','rejected'], default: 'unsubmitted' },
  identity_document: {
    doc_type:       { String, enum: ['national_id','passport', null], default: null },
    document_number:{ String, default: null },
    document_url:   { String, default: '' },
    extracted_data: { Mixed, default: {} },    // Raw OCR JSON
    verified_at:    { Date, default: null }
  },
  driving_license: {
    license_number: { String, default: null },
    document_url:   { String, default: '' },
    extracted_data: { Mixed, default: {} },
    status:         { String, enum: ['unsubmitted','pending','manual_review','verified','rejected'], default: 'unsubmitted' },
    is_verified:    { Boolean, default: false },
    verified_at:    { Date, default: null }
  },

  // === Driver Fields ===
  isAvailable:      { Boolean, default: true },
  driverStatus:     { String, enum: ['online','busy','offline'], default: 'online' },
  dailyRate:        { Number, default: 200 },
  currentRide:      { ObjectId ref: 'Booking', default: null },
  currentLocation:  { String, default: '' },
  coveredAreas:     [{ String }],
  availability:     { String, default: '' },
  drivingExperience:{ String, default: '' },
  vehicleTypes:     [{ String }],
  licenseInfo:      { String, default: '' },
  languagesSpoken:  [{ String }],
  contactDetails:   { String, default: '' },

  // === Profile ===
  profilePicture:   { String, default: '' },
  profilePhoto:     { String, default: '' },
  age:              { Number },
  dateOfBirth:      { Date },
  gender:           { String, enum: ['','male','female','other','prefer_not_to_say'], default: '' },
  city:             { String, default: '' },
  nationality:      { String, default: '' },
  preferredLanguage:{ String, default: 'English' },
  emergencyContact: {
    name:   { String, default: '' },
    phone:  { String, default: '' },
    relation:{ String, default: '' }
  },
  rating:           { Number, default: 0 },
  numReviews:       { Number, default: 0 },
  savedVehicles:    [{ ObjectId ref: 'Vehicle' }]
}
// timestamps: true (createdAt, updatedAt)
```

### 7.2 Vehicle (`models/vehicle.js`)

```javascript
{
  owner:         { ObjectId ref: 'User', required },
  make:          { String, required },
  model:         { String, required },
  year:          { Number, required },
  type:          { String, required, enum: ['sedan','suv','luxury','minibus'] },
  capacity:      { Number, required },
  price_per_day: { Number, required },
  transmission:  { String, required, enum: ['automatic','manual'] },
  fuel:          { String, required, enum: ['petrol','diesel','electric','hybrid'] },
  ac:            { Boolean, required },
  description:   { String, required },
  governorate:   { String, default: '' },
  city:          { String, default: '' },
  address:       { String, required },
  location:      { lat: Number (required), lng: Number (required) },
  has_driver:    { Boolean, default: false },
  driver_cost:   { Number, default: 0 },
  images:        { [String], required },    // Cloudinary URLs
  isAvailable:   { Boolean, default: true },
  isActive:      { Boolean, default: true },
  isDeleted:     { Boolean, default: false }, // Soft delete

  // === Vehicle KYC ===
  kyc_status:    { String, enum: ['unsubmitted','pending','manual_review','verified','rejected'], default: 'unsubmitted' },
  car_license: {
    plate_number:   { String, default: null },
    chassis_number: { String, default: null },
    document_url:   { String, default: '' },
    extracted_data: { Mixed, default: {} },
    verified_at:    { Date, default: null }
  },

  // === Ratings ===
  rating:      { Number, default: 0 },
  numReviews:  { Number, default: 0 }
}
// timestamps: true
```

### 7.3 Booking (`models/booking.js`)

```javascript
{
  vehicle:        { ObjectId ref: 'Vehicle' },          // Optional (null for driver-only bookings)
  renter:         { ObjectId ref: 'User', required },
  owner:          { ObjectId ref: 'User' },              // Vehicle owner
  driver:         { ObjectId ref: 'User' },              // Freelance driver

  startDate:      { Date, default: Date.now },
  endDate:        { Date },
  rentalPrice:    { Number, default: 0 },
  serviceFee:     { Number, default: 0 },
  totalPrice:     { Number, default: 0 },
  paymentStatus:  { String, enum: ['unpaid','paid'], default: 'unpaid' },
  status:         { String, enum: ['pending','confirmed','active','completed','cancelled','expired'], default: 'pending' },

  withDriver:     { Boolean, default: false },
  routeDescription: { String },

  // === Handshake ===
  renterFinished: { Boolean, default: false },
  driverFinished: { Boolean, default: false },

  createdAt:      { Date, default: Date.now }
}
```

### 7.4 Review (`models/Review.js`)

```javascript
{
  author:           { ObjectId ref: 'User', required },
  targetUser:       { ObjectId ref: 'User' },         // Review of a person
  targetVehicle:    { ObjectId ref: 'Vehicle' },       // Review of a vehicle
  bookingReference: { ObjectId ref: 'Booking', required },
  rating:           { Number, required, min: 1, max: 5 },
  comment:          { String, default: '' }
}
// timestamps: true
```

### 7.5 DriverProfile (`models/DriverProfile.js`)

```javascript
{
  user:              { ObjectId ref: 'User', required },
  license_type:      { String, enum: ['private','professional','heavy_truck','bus'], required },
  years_experience:  { Number, required },
  hourly_rate:       { Number, required },
  city:              { String, required },
  license_document:  { String },     // URL
  is_active:         { Boolean, default: true },
  rating:            { Number, default: 5.0 }
}
// timestamps: true
```

### 7.6 DriverRequest (`models/DriverRequest.js`)

```javascript
{
  riderId:     { ObjectId ref: 'User', required },
  driverId:    { ObjectId ref: 'User', required },
  pickup:      { String, required },
  dropoff:     { String, required },
  scheduledAt: { Date, required },
  price:       { Number, required },
  status:      { String, enum: ['pending','accepted','rejected','completed','cancelled'], default: 'pending' },
  notes:       { String, default: '' },
  createdAt:   { Date, default: Date.now }
}
```

### 7.7 Payment (`models/Payment.js`)

```javascript
{
  bookingId: { ObjectId ref: 'Booking', required, unique },
  userId:    { ObjectId ref: 'User', required },
  amount:    { Number, required },
  method:    { String, enum: ['vodafone_cash','instapay','card'], required },
  status:    { String, enum: ['pending','confirmed','failed'], default: 'pending' },
  proofUrl:  { String, default: null },
  createdAt: { Date, default: Date.now }
}
```

### 7.8 Notification (`models/Notification.js`)

```javascript
{
  userId:    { ObjectId ref: 'User', required },
  message:   { String, required },
  type:      { String, enum: [
    'booking_confirmed', 'booking_cancelled', 'booking_completed',
    'kyc_approved', 'kyc_rejected', 'payment_confirmed',
    'new_booking_request', 'driver_request'
  ], required },
  isRead:    { Boolean, default: false },
  createdAt: { Date, default: Date.now }
}
```

### 7.9 ContactMessage (`models/ContactMessage.js`)

```javascript
{
  name:      { String, required, trim },
  email:     { String, required, trim },
  phone:     { String, trim, default: '' },
  subject:   { String, required, trim },
  message:   { String, required, trim },
  isRead:    { Boolean, default: false },
  createdAt: { Date, default: Date.now }
}
```

### 7.10 KycAttempt (`models/KycAttempt.js`)

```javascript
{
  userId:    { ObjectId ref: 'User', required, index },
  doc_type:  { String, required, enum: ['national_id','passport','driver_license','car_license'] },
  result:    { String, required, enum: ['verified','rejected','pending','manual_review','error'] },
  createdAt: { Date, default: Date.now, expires: 86400 }  // TTL: auto-delete after 24h
}
// Compound index: { userId: 1, doc_type: 1, createdAt: 1 }
```

### 7.11 KycAuditLog (`models/KycAuditLog.js`)

```javascript
{
  userId:              { ObjectId ref: 'User', required, index },
  doc_type:            { String, required },
  provider:            { String, enum: ['python_ocr','gemini'], default: 'python_ocr' },
  confidence_score:    { Number, default: null },
  result:              { String, enum: ['verified','rejected','pending','manual_review','error'], required },
  risk_level:          { String, enum: ['CLEAN','MEDIUM_RISK','HIGH_RISK'], default: 'CLEAN' },
  fraud_flags:         { [String], default: [] },
  validation_errors:   { [String], default: [] },
  ip_address:          { String, default: '' },
  user_agent:          { String, default: '' },
  document_number_hash:{ String, default: null },   // SHA-256 hash for privacy
  quality_score:       { Number, default: null }
}
// timestamps: true
// Indexes: { createdAt: -1 }, { userId: 1, createdAt: -1 }, { result: 1, createdAt: -1 }
```

---

## 8. Server — Entry Point & Middleware

### `server.js` — Application Bootstrap
1. Loads environment variables via `dotenv.config()`
2. Connects to MongoDB via `connectDB()`
3. Applies middleware: `cors()`, `express.json()`
4. Mounts 13 route modules under `/api/*`
5. Starts Express on `PORT` (default 5000)
6. On startup, runs `releaseExpiredBookings()` + `scheduleNextBookingExpiry()`
7. Sets 60-second interval for expired booking cleanup

### Route Mount Order
```
/api/admin     → adminRoutes.js
/api/auth      → auth.js
/api/users     → users.js
/api/vehicles  → vehicles.js
/api/bookings  → bookings.js
/api/payments  → payments.js
/api/reviews   → reviews.js
/api/notifications → notifications.js
/api/driver-requests → driverRequests.js
/api/geocode   → geocode.js
/api/contact   → contact.js
/api/chat      → ai.js
```

### `authMiddleware.js` — JWT Protection
- Extracts Bearer token from `Authorization` header
- Verifies token with `JWT_SECRET`
- Loads full user (minus password) into `req.user`
- Returns 401 on invalid/missing token

### `kycMiddleware.js` — KYC Gate
- Checks `req.user.kyc_status === 'verified'`
- Returns 403 if not verified
- Applied to: vehicle creation, booking creation, booking status updates, finish ride

### `uploadMiddleware.js` — Cloudinary Uploads
Four pre-configured uploaders using `multer-storage-cloudinary`:

| Uploader | Folder | Field | Max |
|----------|--------|-------|-----|
| `uploadVehicleImages` | `zabatly/vehicles` | `images` | 10 files |
| `uploadProfilePhoto` | `zabatly/profiles` | `profilePhoto` | 1 file |
| `uploadKycDocument` | `zabatly/kyc` | `file` | 1 file |
| `uploadPaymentProof` | `zabatly/payments` | `paymentProof` | 1 file |

Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

---

## 9. Server — Controllers (Every Function)

### 9.1 `authController.js`

**`registerUser(req, res)`** — `POST /api/auth/register`
- Accepts: name, email, password, role, phone, age, dateOfBirth, gender, city, nationality, preferredLanguage, emergencyContact, driver-specific fields
- Normalizes email to lowercase
- **Master Admin Lock:** Only `mazen@admin.com` with password `12345` can be `admin`; any other admin role request is downgraded to `user`
- **Password policy** (non-admin): ≥8 chars, 1 uppercase, 1 symbol
- Hashes password with bcrypt (salt 10)
- Returns full `publicUserPayload` with JWT token (30-day expiry)

**`loginUser(req, res)`** — `POST /api/auth/login`
- Case-insensitive email lookup
- bcrypt password comparison
- Returns `publicUserPayload` with fresh JWT

### 9.2 `vehicleController.js`

**`getVehicles(req, res)`** — `GET /api/vehicles`
- Filters by `?type=` regex
- Excludes deleted/inactive unless `?ownerView=true`
- Runs `releaseExpiredBookings()` first
- Populates owner (name, email, verified, photo, age, rating)

**`getVehicleById(req, res)`** — `GET /api/vehicles/:id`
- Single vehicle lookup with owner population
- Runs `releaseExpiredBookings()` first

**`createVehicle(req, res)`** — `POST /api/vehicles`
- Requires auth + verified KYC + image upload
- Supports `primaryIndex` to reorder uploaded images
- Parses all fields from multipart form data
- Handles boolean coercion for `ac`, `has_driver`
- Default location: Egypt center (26.8206, 30.8025)

**`softDeleteVehicle(req, res)`** — `DELETE /api/vehicles/:id`
- Sets `isDeleted: true`, `isActive: false`
- Owner-only authorization

**`toggleVehicleActive(req, res)`** — `PUT /api/vehicles/:id/toggle-active`
- Toggles `isActive` boolean
- Owner-only authorization

**`updateVehicle(req, res)`** — `PUT /api/vehicles/:id`
- Whitelist of allowed fields
- Supports adding new images (merged, capped at 10)
- Owner-only authorization

### 9.3 `bookingController.js`

**`createBooking(req, res)`** — `POST /api/bookings`
- Dual booking support: vehicle booking OR standalone driver booking
- Requires `paymentMethod` (vodafone_cash, instapay, card)
- Vehicle bookings: overlap check, date validation, can't book own car
- Driver bookings: status check (must be online, no current ride), can't be a driver booking another driver
- Card payments auto-confirm (status: `confirmed`, paymentStatus: `paid`)
- Creates Payment record automatically
- Updates driver availability on booking
- Sends notifications to owner/driver
- Schedules next booking expiry check

**`checkVehicleAvailability(req, res)`** — `GET /api/bookings/availability`
- Returns all reserved date ranges for a vehicle
- Optional conflict check for specific date range
- Public endpoint (no auth required)

**`getMyBookings(req, res)`** — `GET /api/bookings`
- Returns bookings where user is renter, owner, or driver
- Populates vehicle, renter, owner, driver
- Attaches payment info to each booking
- Sorted by newest first

**`updateBookingStatus(req, res)`** — `PUT /api/bookings/:id`
- Status transitions with role-based authorization:
  - `active`: Owner (vehicle) or Driver (driver-only) — verifies driving license
  - `confirmed`: Sets booking to confirmed
  - `renterFinished`: Only renter can request completion
  - `completed`: Owner (vehicle) or Driver (driver-only) — releases vehicle/driver
  - `cancelled`: Any party (renter/owner/driver) — paid bookings can't be declined by owner
- Updates vehicle availability and driver status accordingly
- Sends appropriate notifications

**`finishRide(req, res)`** — `PUT /api/bookings/finish/:id`
- Handshake completion: both renter and driver must mark finished
- When both finish → status becomes `completed`
- Releases vehicle and driver resources

### 9.4 `kycController.js` (835 lines — the most complex controller)

**`verifyDocument(req, res)`** — `POST /api/users/kyc/verify`

Full pipeline:
1. **File handling:** If Cloudinary URL, downloads to temp file for OCR processing
2. **Validation:** Checks doc_type, vehicleId for car_license
3. **Retry limit:** Max 3 attempts per doc_type per 24 hours (via KycAttempt)
4. **Python OCR call:** Sends file to `http://localhost:8000/api/ocr/scan`
5. **Gemini fallback:** If Python OCR fails/returns false, tries Gemini vision
6. **Retry on inconclusive:** Focused re-read prompt if extraction is poor
7. **Server-side validation:**
   - National ID: 14-digit format check
   - Required field validation per doc type
   - Arabic-Indic digit normalization
8. **Document expiry check:** Rejects expired documents (except National ID)
9. **Egyptian NID checksum validation** (for Gemini results)
10. **Duplicate detection:** Cross-references existing documents in DB
11. **Confidence scoring:** % of expected fields extracted
12. **Status determination:**
    - `HIGH_RISK` or invalid → `rejected`
    - `CLEAN` and valid → `verified`
    - Checksum-only failure → `manual_review`
    - Low confidence (<80%) → `manual_review`
    - Otherwise → `pending`
13. **Document preservation:** Only keeps image for pending/manual_review
14. **MongoDB update:** Saves to appropriate user/vehicle field
15. **Audit logging:** Full KycAuditLog with SHA-256 document hash, IP, user-agent
16. **Notifications:** kyc_approved / kyc_rejected
17. **Actionable error messages:** Photo quality tips based on fraud flags

**OCR Prompts:**
- `buildGeminiOcrPrompt(docType)` — Full field schema for each doc type
- `buildFocusedGeminiOcrPrompt(docType)` — Retry prompt focused on visible text

**Supported document types and their required fields:**

| Doc Type | Required Fields |
|----------|----------------|
| `national_id` | national_id_number |
| `passport` | document_number |
| `driver_license` | license_number |
| `car_license` | plate_number, chassis_number |

### 9.5 `aiController.js`

**`getTripPlan(req, res)`** — `POST /api/chat`
- Loads available vehicles (limit 30)
- Builds fleet context string
- Constructs concierge prompt with instructions to:
  - Ask clarifying questions if request is vague
  - Recommend 1-2 best matches with brief justification
  - Never show raw IDs to user
  - Return strict JSON: `{ reply, savings_tip, recommended_ids }`
- Calls Ollama first (`llama3`, stream: false, format: json)
- Falls back to Gemini (`gemini-3.1-flash-lite`) if Ollama fails
- Resolves recommended IDs to full vehicle documents
- Returns: `{ reply, vehicles, savings_tip }`

### 9.6 `reviewController.js`

**`createReview(req, res)`** — `POST /api/reviews`
- Only renter of the booking can review
- Must match the correct vehicle if reviewing a vehicle
- Booking must be completed/expired or past end date
- Prevents duplicate reviews (same author + booking + target)
- After creation: recalculates average rating for target vehicle and/or target user

**`getVehicleReviews(req, res)`** — `GET /api/reviews/vehicle/:vehicleId`
- Returns all reviews for a vehicle, populates author name and photo

### 9.7 `driverController.js`

**`updateDriverProfile(req, res)`** — `POST /api/drivers`
- Create or update DriverProfile
- Auto-upgrades user role to `driver` on first profile creation

**`getDrivers(req, res)`** — `GET /api/drivers`
- Optional city filter (regex)
- Populates user name, photo, phone

### 9.8 `driverRequestController.js`

**`createDriverRequest`** — `POST /api/driver-requests`
- Renter creates ride request to a specific driver
- Validates: driverId, pickup, dropoff, scheduledAt, price
- Can't request self

**`getMyRequests`** — `GET /api/driver-requests/my`
- For riders: their sent requests
- For drivers: their received requests

**`updateRequestStatus`** — `PATCH /api/driver-requests/:id/status`
- Driver accepts or rejects (only pending requests)
- Requires verified driving license to accept

**`cancelRequest`** — `PATCH /api/driver-requests/:id/cancel`
- Rider cancels pending request

**`completeRequest`** — `PATCH /api/driver-requests/:id/complete`
- Driver marks accepted request as completed

### 9.9 `paymentController.js`

**`createPayment`** — `POST /api/payments`
- Links payment to a booking (one-to-one)
- Only renter can create
- Supports proof file upload

**`getMyPayments`** — `GET /api/payments/my`
- Returns all payments for logged-in user

**`updatePaymentStatus`** — `PATCH /api/payments/:id/status`
- Admin only: set confirmed or failed
- On confirm: updates booking paymentStatus to `paid` and status to `confirmed`

**`getPaymentByBooking`** — `GET /api/payments/booking/:bookingId`
- Renter, owner, or admin can view

**`createPaymentForBooking`** (internal helper)
- Called by bookingController after booking creation

**`attachPaymentsToBookings`** (internal helper)
- Bulk-attaches payment records to booking arrays

### 9.10 `userController.js`

**`updateProfile(req, res)`** — `PUT /api/users/profile`
- Updates: age, dateOfBirth, gender, phone, city, nationality, preferredLanguage, emergencyContact
- Handles profile photo upload/removal
- Driver-specific fields: currentLocation, coveredAreas, availability, drivingExperience, vehicleTypes, licenseInfo, languagesSpoken, contactDetails

### 9.11 `notificationController.js`

- `getMyNotifications` — GET all (sorted newest first)
- `markAsRead` — PATCH single notification
- `markAllAsRead` — PATCH all unread
- `getUnreadCount` — GET unread count

### 9.12 `geocodeController.js`

**`reverseGeocode`** — `GET /api/geocode/reverse`
- Calls Nominatim (OpenStreetMap) for lat/lng → address
- Formats address from components (road, neighbourhood, city, state, country)
- English language preference, 10s timeout

---

## 10. Server — Routes (Complete API Reference)

### Auth (`/api/auth`)
| Method | Endpoint | Auth | Body/Query | Controller |
|--------|----------|------|------------|------------|
| POST | `/register` | No | name, email, password, role, ...profile fields | `registerUser` |
| POST | `/login` | No | email, password | `loginUser` |

### Users (`/api/users`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/profile` | Yes | Fresh user profile from DB |
| GET | `/drivers` | No | All freelance drivers (with filters: location, area, availability, search) |
| PUT | `/driver-settings` | Yes | Update driver availability, status, dailyRate |
| PUT | `/profile` | Yes | Update profile + photo (multipart) |
| GET | `/saved-vehicles` | Yes | Get saved/favorite vehicles |
| PUT | `/saved-vehicles/:vehicleId` | Yes | Toggle saved vehicle |
| GET | `/:id/public` | No* | Public user profile + vehicles + rental count |
| POST | `/upgrade-to-host` | Yes | Upgrade renter to agency role |
| POST | `/kyc/verify` | Yes | Upload document for KYC (multipart) |
| DELETE | `/:id` | Yes | Delete own account |

*Public profiles show limited info; sensitive fields visible only to users with a booking relationship.

### Vehicles (`/api/vehicles`)
| Method | Endpoint | Auth | Middleware | Description |
|--------|----------|------|-----------|-------------|
| GET | `/` | No | — | List all vehicles |
| GET | `/:id` | No | — | Get single vehicle |
| POST | `/` | Yes | KYC + upload | Create vehicle |
| PUT | `/:id/toggle-active` | Yes | — | Toggle active/inactive |
| PUT | `/:id` | Yes | upload | Update vehicle |
| DELETE | `/:id` | Yes | — | Soft-delete vehicle |

### Bookings (`/api/bookings`)
| Method | Endpoint | Auth | Middleware | Description |
|--------|----------|------|-----------|-------------|
| GET | `/availability` | No | — | Check vehicle date conflicts |
| POST | `/` | Yes | upload + KYC | Create booking |
| GET | `/` | Yes | — | Get my bookings |
| PUT | `/finish/:id` | Yes | KYC | Handshake finish ride |
| PUT | `/:id` | Yes | KYC | Update booking status |

### Payments (`/api/payments`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Yes | Create payment with proof |
| GET | `/my` | Yes | Get my payments |
| GET | `/booking/:bookingId` | Yes | Get payment for booking |
| PATCH | `/:id/status` | Admin | Confirm/fail payment |

### Reviews (`/api/reviews`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Yes | Create review |
| GET | `/vehicle/:vehicleId` | No | Get vehicle reviews |

### Notifications (`/api/notifications`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | Get my notifications |
| GET | `/unread-count` | Yes | Get unread count |
| PATCH | `/read-all` | Yes | Mark all as read |
| PATCH | `/:id/read` | Yes | Mark single as read |

### Driver Requests (`/api/driver-requests`)
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/` | Yes | user | Create driver request |
| GET | `/my` | Yes | any | Get my requests |
| PATCH | `/:id/status` | Yes | driver | Accept/reject |
| PATCH | `/:id/cancel` | Yes | user | Cancel request |
| PATCH | `/:id/complete` | Yes | driver | Complete request |

### Admin (`/api/admin`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/pending` | Admin | Pending KYC documents (identity + licenses + vehicles) |
| GET | `/overview` | Admin | Full platform stats + all records |
| PUT | `/review` | Admin | Approve/reject KYC document |
| GET | `/kyc-logs` | Admin | Paginated KYC audit logs with filters |

### Other
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/chat` | No | AI chat recommendation |
| GET | `/api/geocode/reverse` | No | Reverse geocode lat/lng |
| POST | `/api/contact` | No | Submit contact form |
| GET | `/api/contact` | No | Get all contact messages |
| PATCH | `/api/contact/:id/read` | No | Mark message as read |
| DELETE | `/api/contact/:id` | No | Delete contact message |

---

## 11. Server — Utilities

### `bookingExpiration.js`
- **Blocking statuses:** `['pending', 'confirmed', 'active']`
- **`releaseExpiredBookings(now)`:** Finds bookings past `endDate` with blocking status. Active → `completed`, pending/confirmed → `expired`. Releases vehicles and drivers.
- **`scheduleNextBookingExpiry()`:** Sets a timer for the nearest upcoming booking end, then auto-releases.
- Called on server startup, every 60 seconds, and after booking mutations.

### `egyptianIdValidator.js`
Full Egyptian National ID (14-digit) validation:
- **Length check:** Exactly 14 digits
- **Century digit:** Must be `2` (1900s) or `3` (2000s)
- **Date of birth:** Extracted from digits 2-7, validated as real date
- **Governorate code:** Digits 8-9 must match known Egyptian governorate codes (28 valid codes)
- **Checksum:** Luhn-variant with weights `[2,7,6,5,4,3,2,7,6,5,4,3,2]`
- **DOB cross-check:** Compares NID-embedded DOB with OCR-extracted DOB

### `geminiFallback.js`
- **Models:** `CHAT_MODEL = 'gemini-3.1-flash-lite'`, `OCR_MODEL = 'gemini-3.5-flash'`
- **`generateGeminiJson(model, prompt)`:** Text-only generation with JSON response MIME type
- **`generateGeminiVisionJson(model, prompt, filePath, mimeType)`:** Vision model with inline image data (base64)
- **`stripJsonMarkdown(text)`:** Strips ```json fences
- **`extractJsonObject(text)`:** Extracts first complete JSON object
- Warns on images >4MB

### `notificationHelper.js`
- Simple `createNotification(userId, message, type)` factory

---

## 12. Python OCR Service

Located at `server/ocr_service/`. A standalone FastAPI microservice.

### Files
| File | Purpose | Size |
|------|---------|------|
| `main.py` | FastAPI app with `/api/ocr/scan` endpoint | 18.5 KB |
| `ocr_engine.py` | Core OCR logic (text extraction) | 14.7 KB |
| `preprocessing.py` | Image preprocessing (rotation, contrast, etc.) | 14.0 KB |
| `fraud_detector.py` | Fraud detection logic | 9.3 KB |
| `validators.py` | Document field validators | 13.1 KB |
| `schemas.py` | Pydantic response models | 5.6 KB |
| `test_ocr.py` | Test suite | 6.2 KB |
| `requirements.txt` | Python dependencies | 140 B |

### Dependencies
- FastAPI + Uvicorn for HTTP
- OpenCV (headless) for image processing
- NumPy for numeric operations
- Pydantic for data validation

### Endpoint
`POST /api/ocr/scan` — accepts multipart with `file` (image) and `doc_type` (string)

### Response Schema
```json
{
  "success": true,
  "detected_doc_type": "national_id | passport | driver_license | car_license | unknown",
  "fields": { /* extracted field values */ },
  "fraud_report": {
    "risk_level": "CLEAN | MEDIUM_RISK | HIGH_RISK",
    "flags": [],
    "recommendation": ""
  },
  "validation": {
    "is_valid": true,
    "errors": []
  }
}
```

---

## 13. Client — Configuration & Build

### `client/package.json`
- **Scripts:** `dev` (Vite), `build` (Vite build), `lint` (ESLint), `preview` (Vite preview)
- **Type:** ES modules (`"type": "module"`)

### `client/vite.config.js`
- Uses `@vitejs/plugin-react`

### `client/postcss.config.js`
- Tailwind CSS + Autoprefixer

### `client/vercel.json`
- SPA rewrite: all routes → `/index.html`

### `client/.env`
- `VITE_API_URL` — defaults to Railway production URL

### `client/src/config/api.js`
```javascript
export const API = import.meta.env.VITE_API_URL || 'https://zabatly-production.up.railway.app';
```

---

## 14. Client — Application Shell (App.jsx)

### Structure
- `App` → `BrowserRouter` → `AppShell`
- `AppShell` determines which chrome to show based on route:
  - Landing, Auth, Dashboard, Static pages → no navbar
  - AI assistant page → no floating chat
  - Other pages → Navbar + floating AiChat widget

### Navbar Component
- Sticky, glassmorphic (backdrop-blur)
- Logo: "Zabatly" (Manrope) + "زبطلي" (Cairo)
- Links: Browse Cars, Drivers, AI Assistant, Dashboard
- Auth state from `localStorage.userInfo`
- Agency users see "List Vehicle" CTA
- Profile picture avatar with name
- Language switcher (EN/AR)

### Route Table
| Path | Component | Description |
|------|-----------|-------------|
| `/` | `Landing` | Marketing page |
| `/explore` | `Home` | Vehicle browse |
| `/login` | `Login` | Login form |
| `/register` | `Register` | Registration |
| `/drivers` | `Drivers` | Driver marketplace |
| `/contact` | `ContactUs` | Contact form |
| `/about` | `AboutUs` | About page |
| `/ai-assistant` | `AIAssistant` | Full-page AI chat |
| `/dashboard` | `Dashboard` | Role-based dashboard |
| `/add-vehicle` | `AddVehicle` | Vehicle listing form |
| `/admin` | `AdminDashboard` | Admin panel |
| `/vehicles/:id` | `VehicleDetails` | Vehicle detail |
| `/vehicle/:id` | `VehicleDetails` | Alternate URL |
| `/payment` | `PaymentPage` | Payment flow |
| `/booking-success` | `BookingSuccess` | Confirmation |
| `/profile` | `Profile` | User settings |
| `/user/:id` | `UserPublicProfile` | Public profile |
| `/verify-identity` | Redirect → `/profile` | Legacy redirect |
| `*` | 404 page | Not found |

---

## 15. Client — Pages (Every Screen)

### `Landing.jsx` (31.4 KB)
- Full marketing landing page with editorial sections
- Circular Arabic badge with rotating SVG text
- Hero section with CTA buttons
- Features showcase, testimonials, call-to-action sections
- Role-aware navigation (different CTAs for logged-in users)

### `Home.jsx` (21.5 KB)
- Vehicle explore/browse page
- Filter sidebar: search, vehicle type, transmission, fuel, price range, driver availability
- Vehicle card grid with image carousels
- "Recommended" badge on top-rated vehicles
- "Rented" overlay on unavailable vehicles
- Save/favorite vehicle toggle
- Skeleton loading states

### `Login.jsx` (5.9 KB)
- Split layout: brand image + form
- Email/password inputs
- Error display (inline banner)
- Redirect after login

### `Register.jsx` (24.8 KB)
- Split layout: brand image + form
- Role selector (Renter / Vehicle Host / Driver) with pill buttons
- Full registration fields based on selected role
- Driver-specific fields (experience, covered areas, vehicle types, etc.)
- Password strength validation

### `Dashboard.jsx` (1.7 KB)
- Role-based router component
- Renders: `RenterDashboard`, `OwnerDashboard`, `DriverDashboard`, or redirects to `/admin`
- Wrapped in `DashboardShell`

### `AdminDashboard.jsx` (36.7 KB)
- Full admin panel with tabbed navigation:
  - **Overview:** Platform stats (users, vehicles, bookings, revenue)
  - **Users:** User list with role filters, KYC status
  - **Vehicles:** All vehicles with owner info, status
  - **Bookings:** All bookings with status, payments
  - **KYC Queue:** Pending/manual_review documents with approve/reject actions
  - **KYC Logs:** Paginated audit log viewer with filters
  - **Contact Messages:** Inbox with read/delete
  - **Payments:** Payment list with admin confirmation
- Metric strips for key numbers
- Data tables for all entities

### `Profile.jsx` (57.1 KB — largest page)
- **Account section:** Photo upload/remove, personal details, driver-specific settings
- **Verification section:** KYC document upload for National ID, Passport, Driving License, Car License
- **Driver settings:** Availability toggle, daily rate, status management
- **Emergency contact:** Name, phone, relation
- **Become a Host:** Banner for renters to upgrade to agency
- **Danger Zone:** Account deletion with confirmation
- Full form validation and inline error messages

### `AddVehicle.jsx` (26.1 KB)
- Multi-section form: vehicle details, pricing, location
- Image upload grid with primary image selection
- Leaflet map for coordinate selection
- Reverse geocoding for address auto-fill
- Governorate/city dropdowns (Egyptian locations data)
- Car license upload step after vehicle creation

### `VehicleDetails.jsx` (38.4 KB)
- Image gallery with prev/next navigation
- Vehicle specs display
- Owner info with link to public profile
- **Booking card:** Date picker, driver toggle, price breakdown, payment method selection
- Availability checker (real-time conflict detection)
- KYC verification prompts before booking
- Review list with star ratings

### `Drivers.jsx` (26.0 KB)
- Driver marketplace with search and filters
- Driver cards with availability status, rating, daily rate
- Location and covered areas display
- Booking flow for standalone driver rides
- Status badges (online/busy/offline)

### `PaymentPage.jsx` (28.0 KB)
- Payment method selection (Vodafone Cash, InstaPay, Card)
- Payment proof upload for mobile money
- Booking summary display
- Price breakdown (rental + service fee + total)

### `BookingSuccess.jsx` (7.1 KB)
- Post-booking confirmation screen
- Booking details summary
- Navigation links to dashboard

### `AIAssistant.jsx` (0.9 KB)
- Full-page wrapper for the AiChat component

### `UserPublicProfile.jsx` (12.4 KB)
- Public profile view with avatar, rating, verification badge
- Listed vehicles (for agencies)
- Total rentals count
- Contact info (visible only to related parties)

### `ContactUs.jsx` (13.9 KB)
- Contact form with name, email, phone, subject, message
- Success confirmation message
- Form validation

### `AboutUs.jsx` (14.6 KB)
- Company story and mission
- Team/features showcase

---

## 16. Client — Components

### `AiChat.jsx` (15.9 KB)
- Floating chat widget (bottom-right corner)
- 48×48 FAB button to toggle
- Chat panel: 384px wide, 480px tall
- Message history with user/assistant bubbles
- Vehicle recommendation cards with links
- Savings tips display
- "Thinking..." loading state
- Conversation history sent with each message
- Calls `POST /api/chat`

### `CarLicenseUpload.jsx` (7.1 KB)
- Document upload component for car license KYC
- File selection and preview
- Calls `/api/users/kyc/verify` with doc_type and vehicleId

### `Hero.jsx` (4.5 KB)
- AI trip planner hero section
- Chat input with instant recommendation

### `LanguageSwitcher.jsx` (1.5 KB)
- EN/AR toggle button
- Updates i18n language and document direction

### `PaymentProofLink.jsx` (2.2 KB)
- Displays payment proof image with expandable view

### Dashboard Components

**`DashboardShell.jsx`** (9.2 KB)
- Shared sidebar + content layout
- 224px fixed Midnight Navy sidebar on desktop
- Mobile hamburger menu with slide-in overlay
- Navigation items with icons
- Active route highlighting
- Unread notification badge counter
- Logout button

**`RenterDashboard.jsx`** (25.7 KB)
- My bookings list with status filters
- Booking cards: vehicle info, dates, status badge, actions
- Actions: Cancel, Finish Ride, Review
- Active booking highlight

**`OwnerDashboard.jsx`** (50.6 KB — largest component)
- Fleet management: vehicle list with status, actions
- Pending booking requests with Accept/Decline
- Active bookings management
- Revenue metrics
- Vehicle toggle active/deactivate
- Payment status tracking

**`DriverDashboard.jsx`** (30.0 KB)
- Availability toggle (online/offline/busy)
- Incoming ride requests
- Active rides management
- Completed rides history
- Daily rate setting
- Driver request management

---

## 17. Client — Internationalization (i18n)

### Setup
- **Framework:** i18next + react-i18next
- **Detection:** Browser language → localStorage (`zabatly_lang`)
- **Languages:** English (en), Arabic (ar)
- **Fallback:** English

### Namespaces (15 per language)
| Namespace | Scope |
|-----------|-------|
| `common` | Navigation, shared UI, errors, 404 |
| `landing` | Landing page |
| `auth` | Login/Register |
| `explore` | Vehicle browse page |
| `vehicle` | Vehicle details |
| `drivers` | Driver marketplace |
| `payment` | Payment page |
| `booking` | Booking flows |
| `profile` | Profile/settings |
| `dashboard` | Dashboard pages |
| `admin` | Admin panel |
| `addVehicle` | Add vehicle form |
| `ai` | AI assistant |
| `contact` | Contact page |
| `about` | About page |

### RTL Support
- `LanguageProvider` context sets `document.documentElement.dir` to `rtl` for Arabic
- Language normalized: `ar-EG`, `ar-SA` → `ar`

---

## 18. Client — Design System (Tailwind)

### Custom Color Palette

**Primary (Navy):**
`#eef2f7` → `#0f1623` (11 shades, 50-950)

**Signal (Amber):**
`#fdf8ed` → `#3e1b09` (11 shades, 50-950)

**Sand (Warm Neutrals):**
`#faf8f5` → `#2c2723` (11 shades, 50-950)

### Typography
- **Font family:** `Manrope` (Latin), `Cairo` (Arabic)
- **Display:** clamp(2.25rem → 4rem), weight 800
- **Headline:** clamp(1.5rem → 2.25rem), weight 700
- **Title:** 1.25rem, weight 600
- **Body:** 1rem, weight 400
- **Label:** 0.8125rem, weight 500

### Border Radius
- `subtle`: 6px (buttons, badges)
- `soft`: 10px (cards, panels)

### Animations
- `chat-fade-up`: 300ms entry animation for chat messages
- `cursor-blink`: 800ms cursor animation
- `out-quart`: cubic-bezier(0.25, 1, 0.5, 1)
- `out-expo`: cubic-bezier(0.16, 1, 0.3, 1)

---

## 19. Mobile App (React Native / Expo)

### Configuration
- **App name:** Zabatly
- **Package:** `com.mazen721.mobile`
- **SDK:** Expo 56
- **Orientation:** Portrait only
- **Background:** `#0f1623` (Midnight Navy Deep)
- **Typed routes:** Enabled
- **React Compiler:** Enabled

### EAS Build Profiles
| Profile | Distribution | Android Type |
|---------|-------------|-------------|
| `development` | Internal | APK (dev client) |
| `preview` | Internal | APK |
| `production` | Default | AAB |

### Architecture
- **Routing:** Expo Router (file-based)
- **Auth:** Context-based (AuthContext.jsx)
- **API:** Axios client with token injection
- **Theme:** Custom token files matching web design system
  - `colors.js` — Full palette matching Tailwind config
  - `typography.js` — Manrope + Cairo styles
  - `shadows.js` — Platform-specific shadows
  - `spacing.js` — Spacing scale

### Screens
- Root layout with font loading
- Auth flow (login/register)
- Onboarding flow
- Tab-based navigation
- Vehicle cards, booking cards, status badges

---

## 20. Design System Specification

(See DESIGN.md for the complete 487-line design specification)

### Key Rules
1. **Committed Navy Rule:** Midnight Navy appears on every screen's primary action
2. **Warm Neutral Rule:** No pure grays; all neutrals warm-tinted toward sand/amber
3. **Selection Rule:** Text selection uses primary-200 background
4. **Status Tint Rule:** Status via background-tinted pills only
5. **No-Shout Rule:** Uppercase only for filter headings, spec labels, sidebar dividers
6. **Cairo-Only Rule:** All Arabic text uses Cairo, never Manrope
7. **Tabular-Nums Rule:** All numeric values in data contexts use tabular-nums
8. **Flat-at-Rest Rule:** No shadows at rest; shadows only as state response
9. **Three-Layer Rule:** Sidebar (navy) → Context strip (linen) → Content (cream)

### Component Specifications
- **Buttons:** 6px radius (subtle), never pill-shaped
- **Vehicle Cards:** 10px radius, 4:3 image, hover lift
- **Dashboard Shell:** 224px fixed sidebar, hamburger on mobile
- **Data Tables:** Flat rows, warm linen headers, no card wrappers
- **Status Badges:** Tinted pills (green/amber/navy/sand/red)
- **Chat Widget:** 48px FAB, 384×480 panel, shadow-lg

---

## 21. Data Flow & Key Algorithms

### Booking Overlap Prevention
- For vehicle bookings: checks existing bookings with `status ∈ [pending, confirmed, active]` in overlapping date windows
- For driver bookings: checks driver's existing reservations in the same way
- Returns 409 with conflict details

### Booking Expiration System
- Runs on startup, every 60 seconds, and after mutations
- Active bookings past end date → `completed`
- Pending/confirmed bookings past end date → `expired`
- Releases vehicle availability and driver status
- Smart scheduling: sets timer for next upcoming expiry

### Booking Completion Handshake
- Both renter and driver/owner must signal completion
- `finishRide` endpoint tracks `renterFinished` and `driverFinished`
- Final transition only when both flags are true

### Aggregate Rating Recalculation
- After each review: query all reviews for target, compute average, update target's `rating` and `numReviews`

### KYC Decision Matrix

| Fraud Risk | Validation | Checksum | Confidence | Result |
|-----------|-----------|----------|------------|--------|
| HIGH_RISK | — | — | — | `rejected` |
| — | invalid | — | — | `rejected` |
| — | — | fail only | — | `manual_review` |
| CLEAN | valid | — | ≥80% | `verified` |
| — | — | — | <80% | `manual_review` |
| Otherwise | — | — | — | `pending` |

### AI Recommendation Flow
1. User sends query → backend loads fleet (30 vehicles max)
2. Build prompt with fleet context + conversation history
3. Ollama (primary) or Gemini (fallback) returns structured JSON
4. Backend resolves recommended IDs to full vehicle documents
5. Frontend displays reply text + vehicle cards + savings tip

### Duplicate Document Detection
- National ID/Passport: cross-references `identity_document.document_number` across all users
- Driver License: cross-references `driving_license.license_number`
- Car License: cross-references `car_license.plate_number` across all vehicles
- Uses both exact match and flexible regex (ignoring spaces/dashes)

---

## 22. Deployment & Hosting

### Backend (Railway)
- **URL:** `https://zabatly-production.up.railway.app`
- Node.js server deployed to Railway
- MongoDB Atlas or Railway-hosted DB
- Environment variables set in Railway dashboard

### Frontend (Vercel)
- Vite build output deployed to Vercel
- SPA rewrite configured in `vercel.json`
- `VITE_API_URL` points to Railway backend

### Mobile (EAS Build)
- Development APK for internal testing
- Preview APK for staging
- Production AAB for Play Store

---

## 23. Installation Guide

### Prerequisites
- Node.js 18+ (20 LTS preferred)
- MongoDB (local or Atlas)
- Ollama (for AI chat)
- Python 3.8+ (for OCR service)

### Steps

```bash
# 1. Clone
git clone <repo-url>
cd car-rental-project

# 2. Root dependencies
npm install

# 3. Backend
cd server
npm install
copy .env.example .env
# Edit .env with real values

# 4. Frontend
cd ../client
npm install

# 5. Mobile (optional)
cd ../mobile
npm install

# 6. Python OCR (optional)
cd ../server/ocr_service
pip install -r requirements.txt

# 7. Ollama
ollama pull llama3
ollama serve

# 8. Start services
# Terminal 1: MongoDB (mongod)
# Terminal 2: cd server && npm run dev
# Terminal 3: cd client && npm run dev
# Terminal 4: cd server/ocr_service && uvicorn main:app --port 8000
```

---

## 24. Running the Project

### Start Order
1. MongoDB
2. Ollama (`ollama serve`)
3. OCR service (if KYC needed)
4. Backend (`server/` → `npm run dev`)
5. Frontend (`client/` → `npm run dev`)

### Default Ports
| Service | Port | URL |
|---------|------|-----|
| Backend | 5000 | http://localhost:5000 |
| Frontend | 5173 | http://localhost:5173 |
| MongoDB | 27017 | mongodb://127.0.0.1:27017 |
| Ollama | 11434 | http://127.0.0.1:11434 |
| OCR Service | 8000 | http://localhost:8000 |

### Admin Access
- Register with email `mazen@admin.com` and password `12345`
- This is the only way to create an admin account (Master Admin Lock)

---

## 25. API Endpoint Quick Reference

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Users
- `GET /api/users/profile` (auth)
- `GET /api/users/drivers`
- `PUT /api/users/driver-settings` (auth)
- `PUT /api/users/profile` (auth, multipart)
- `GET /api/users/saved-vehicles` (auth)
- `PUT /api/users/saved-vehicles/:vehicleId` (auth)
- `GET /api/users/:id/public`
- `POST /api/users/upgrade-to-host` (auth)
- `POST /api/users/kyc/verify` (auth, multipart)
- `DELETE /api/users/:id` (auth)

### Vehicles
- `GET /api/vehicles`
- `GET /api/vehicles/:id`
- `POST /api/vehicles` (auth, KYC, multipart)
- `PUT /api/vehicles/:id/toggle-active` (auth)
- `PUT /api/vehicles/:id` (auth, multipart)
- `DELETE /api/vehicles/:id` (auth)

### Bookings
- `GET /api/bookings/availability`
- `POST /api/bookings` (auth, KYC, multipart)
- `GET /api/bookings` (auth)
- `PUT /api/bookings/finish/:id` (auth, KYC)
- `PUT /api/bookings/:id` (auth, KYC)

### Payments
- `POST /api/payments` (auth, multipart)
- `GET /api/payments/my` (auth)
- `GET /api/payments/booking/:bookingId` (auth)
- `PATCH /api/payments/:id/status` (admin)

### Reviews
- `POST /api/reviews` (auth)
- `GET /api/reviews/vehicle/:vehicleId`

### Notifications
- `GET /api/notifications` (auth)
- `GET /api/notifications/unread-count` (auth)
- `PATCH /api/notifications/read-all` (auth)
- `PATCH /api/notifications/:id/read` (auth)

### Driver Requests
- `POST /api/driver-requests` (auth, user)
- `GET /api/driver-requests/my` (auth)
- `PATCH /api/driver-requests/:id/status` (auth, driver)
- `PATCH /api/driver-requests/:id/cancel` (auth, user)
- `PATCH /api/driver-requests/:id/complete` (auth, driver)

### Admin
- `GET /api/admin/pending` (admin)
- `GET /api/admin/overview` (admin)
- `PUT /api/admin/review` (admin)
- `GET /api/admin/kyc-logs` (admin)

### Other
- `POST /api/chat`
- `GET /api/geocode/reverse`
- `POST /api/contact`
- `GET /api/contact`
- `PATCH /api/contact/:id/read`
- `DELETE /api/contact/:id`

---

## 26. Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `MongoNetworkError` | MongoDB not running | Start MongoDB service, check `MONGO_URI` |
| `Invalid token` / 401 | Expired or missing JWT | Re-login, check `Authorization: Bearer <token>` |
| AI chat: Ollama unavailable | Ollama not running | `ollama serve`, verify `ollama list` has llama3 |
| KYC: service unavailable | OCR service down | Start Python OCR at port 8000, or ensure `GEMINI_API_KEY` |
| CORS errors | Backend not running or wrong URL | Check `VITE_API_URL` matches backend |
| Image upload fails | Wrong MIME type | Only JPEG, PNG, WebP allowed |
| Admin page inaccessible | Not admin role | Login as `mazen@admin.com` |
| 429 Too Many Requests | KYC retry limit (3/day) | Wait 24 hours or clear KycAttempt records |
| Vehicle creation fails | Missing KYC verification | Complete identity verification first |
| Booking 409 Conflict | Date overlap | Choose different dates |
| Driver can't go online | Active reservation exists | Complete current ride first |
| Password too weak | Policy violation | 8+ chars, 1 uppercase, 1 symbol |

---

## 27. Future Improvements

### Performance
- Add API pagination/filtering/sorting for large datasets
- Database indexes for date and availability queries
- Incremental rating updates instead of full recalculation

### Scalability
- Dedicated microservices for AI and KYC
- Message queue for long-running verification
- Object storage (S3) for production uploads

### Architecture
- Service/repository layers to reduce controller complexity
- Centralize API client with interceptors
- OpenAPI specification and request validation

### Security
- Secure vault for secrets
- Rate limiting, helmet, input sanitization
- Refresh tokens and token revocation
- Stricter upload constraints (file size limits)

### Features
- Real-time updates (WebSocket/SSE)
- Push notifications (mobile)
- SMS/email verification
- Payment gateway integration
- Multi-currency support
- Advanced search and filtering

### Maintainability
- Automated tests (unit + integration + e2e)
- Remove unused dependencies
- TypeScript migration

---

## 28. Developer Notes

1. **Model casing:** Keep consistent (`vehicle.js` vs `Vehicle` imports) to avoid cross-platform issues
2. **Secrets:** Never commit `server/.env` with real values
3. **API URL:** Use `VITE_API_URL` env var, don't hardcode
4. **Role changes:** Update both backend enums and frontend conditionals
5. **Booking logic:** Test overlap checks and status transitions end-to-end
6. **KYC changes:** Verify both automated OCR decision and admin moderation paths
7. **Unused code:** Some legacy components exist (Hero.jsx used in landing, CarLicenseUpload.jsx integrated in Profile.jsx)
8. **Cloudinary:** All uploads go directly to Cloudinary; the local `uploads/` folder is legacy
9. **Gemini models:** Chat uses `gemini-3.1-flash-lite` (fast, cheap), OCR uses `gemini-3.5-flash` (vision-capable)
10. **Password policy:** Admin bypass exists for `mazen@admin.com`
11. **Mobile app:** Still in active development; shares the same backend API
12. **i18n:** All user-facing strings should use translation keys, not hardcoded text

---

> **This document was generated from a complete source-level analysis of every file in the Zabatly project.**
