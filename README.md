# One Guy Productions

**One Guy Productions** is the official brand platform and production-grade customer/admin portal built by a solo full-stack developer using the **PERN stack** (PostgreSQL, Express.js, React, Node.js) with TypeScript across the stack.

Every project is handcrafted with a focus on performance, usability, and individuality — proving that one developer can deliver systems that rival large teams.

---
![One Guy Productions Logo](https://www.oneguyproductions.com/brand-banner.webp)

## 🌐 Live Site
🔗 [https://oneguyproductions.com](https://oneguyproductions.com)

---

## 🧱 Tech Stack

### Backend (`/Server`)
- **Node.js + Express** — Modular REST API with service/controller architecture
- **PostgreSQL + Sequelize ORM** — Relational database with migrations and models
- **Resend Email API** — Secure, styled transactional emails
- **reCAPTCHA Enterprise v3** — Abuse protection with scoring
- **Bcrypt** — Password hashing
- **JWT (HttpOnly Cookies)** — Secure authentication tokens
- **PDFKit / ReportLab** — PDF generation for invoices
- **Custom Middleware** — Auth guards, admin guards, OTP checks
- **Dotenv v17** — Environment configuration
- **Rate Limiting & Validation** — OTP and form security

### Frontend (`/Client`)
- **React (Vite + TypeScript)** — Fast, modular frontend
- **TailwindCSS v4** — Custom dark/light themes via CSS variables
- **Zustand** — Global state management
- **React Router v6** — Routing with secured route guards
- **Lucide-react** — Icon library
- **Mobile-First Design** — Responsive layouts
- **Component-Based UI** — JSX-only view files for strict SoC

---

## 📁 Project Structure

```
OneGuyProductions/
├── Client/               # React + Vite frontend
│   ├── components/       # Reusable UI logic
│   ├── jsx/              # Presentation layer only
│   ├── pages/            
│   ├── routes/           
│   ├── store/            # Zustand stores
│   ├── helpers/          
│   ├── modals/           
│   ├── types/            
│   └── main.tsx / App.tsx
├── Server/               # Node.js + Express backend
│   ├── controllers/      
│   ├── services/         
│   ├── routes/           
│   ├── models/           
│   ├── middleware/       
│   ├── config/           
│   ├── utils/            
│   └── server.ts / app.ts
└── package.json          # Root monorepo manager
```

---

## Key Features

### Customer Portal
- Place, view, and cancel orders (72-hour window)
- Thread-based communication with admins
- Download PDF invoices
- Real-time unread message tracking

### Admin Portal
- Search, filter, and assign orders
- Send updates (optionally requiring customer response)
- Update order statuses
- View unread counts

### Shared
- OTP-based authentication & password reset
- reCAPTCHA Enterprise protection
- Secure JWT sessions
- Bcrypt password hashing

---

## Setup & Installation

### Prerequisites
- Node.js v22+
- PostgreSQL v14+
- npm or yarn
- Resend account
- Google Cloud reCAPTCHA Enterprise project

### Steps
```bash
    git clone <repo-url>
    cd OneGuyProductions
    npm install
```

Create `.env` in `Server/` with variables (replace with your own):
```
DATABASE_URL=postgres://user:pass@localhost:5432/db
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=90m
BCRYPT_SALT_ROUNDS=10
RECAPTCHA_PROJECT_ID=...
RECAPTCHA_SITE_KEY=...
RECAPTCHA_SECRET=...
RECAPTCHA_MIN_SCORE=0.5
RESEND_API_KEY=...
RESEND_FROM_EMAIL=noreply@example.com
RESEND_ORDER_RECEIVER_EMAIL=orders@example.com
RESEND_CONTACT_RECEIVER_EMAIL=contact@example.com
```

Run migrations:
```bash
    npm run migrate
```

Run dev mode:
```bash
    npm run dev
```

Build for prod:
```bash
    npm run build
    npm start
```

---

## Deployment
Optimized for **Render.com**:
- Single service for both frontend & backend
- PostgreSQL hosted on managed service
- Root `package.json` handles scripts

---

## License
Private License — All rights reserved © One Guy Productions.
Reproduction, distribution, or commercial use without written consent is prohibited.

---

## 📬 Contact
[Contact Page](https://oneguyproductions.com/contact)

> *"One person. One vision. One Guy Productions."*
