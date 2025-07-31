# One Guy Productions

**One Guy Productions** is the official brand platform built by a solo full-stack developer to showcase custom-built software products and design services. Every project is handcrafted with a focus on performance, usability, and individuality — proving that one developer can deliver production-grade systems that rival large teams.

---
![One Guy Productions Logo](https://www.oneguyproductions.com/brand-banner.webp)

## 🌐 Live Site

🔗 [https://oneguyproductions.com](https://oneguyproductions.com)

---

## 🧱 Tech Stack

This is a full **PERN monorepo** (PostgreSQL, Express, React, Node.js) with modern tooling for scalable development and deployment:

### 📦 Backend (`/Server`)
- **Node.js + Express** — Modular REST API with service/controller architecture
- **PostgreSQL** — Relational database with Sequelize ORM
- **Resend Email API** — Secure, styled email delivery for contact and order forms
- **reCAPTCHA v3** — Abuse protection via action-based scoring
- **Dotenv v17** — Secure environment variable injection and logging
- **Rate Limiting + Validation** — For OTP/password reset and form protection

### 🖥 Frontend (`/Client`)
- **Vite + React + TypeScript** — Lightning-fast bundling and development
- **TailwindCSS v4** — Fully custom dark theme with CSS variables (`--theme-*`)
- **Zustand** — Global state management (auth, form, modal state)
- **React-Router v6** — SPA routing with secured route guards
- **Component-Based UI** — Reusable layouts for modals, buttons, forms, charts
- **Mobile-First Design** — Fully responsive layout using Tailwind breakpoints

---

## 🛠️ Features

### 🧑‍💻 Brand Portfolio Website
- Custom homepage, About section, and Brand Story
- Real-time form validation for Contact and Order requests
- Integrated dynamic theming (auto dark/light detection)
- SEO-optimized pages with Open Graph metadata for social sharing

### ✉️ Dynamic Contact & Order Forms
- Secured with **Google reCAPTCHA v3**
- Emails delivered via **Resend**
- Backend validation with fallback handling and toast feedback

### 🧠 AI + Product Integration (coming soon)
- GPT-powered chatbot (LeaseClarityPRO-style)
- Resume builder (CVitaePRO)
- Career analytics (CareerGistPRO)
- Cross-app unified dashboard and user account system

---

## 📁 Project Structure

```
OneGuyProductions/
├── Client/               # Frontend (React + Vite + Tailwind)
│   ├── components/       # Reusable UI components
│   ├── pages/            # Route-level views
│   ├── store/            # Zustand stores
│   └── types/            # Local TS types
├── Server/               # Backend (Node.js + Express + PostgreSQL)
│   ├── controllers/      # Route logic handlers
│   ├── services/         # Business logic & external APIs
│   ├── routes/           # Express routers
│   └── models/           # Sequelize models
├── .env                  # Server environment variables (not committed)
├── package.json          # Root script manager for monorepo
└── README.md             # You’re here
```

---

## 🔐 License

This repository is protected under a **Private License**.

> ⚠️ You may not reproduce, distribute, or commercially use any portion of this codebase, in part or in whole, without **express written consent and compensation** from the author.

All rights reserved © One Guy Productions.

---

## 📬 Contact

Interested in working together or need custom software?

➡️ [Visit the Contact Page](https://oneguyproductions.com/contact)

---

> *"One person. One vision. One Guy Productions."*