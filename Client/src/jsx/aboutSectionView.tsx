import React from 'react';
import { Link } from 'react-router-dom';

export default function AboutSectionView(): React.ReactElement {
  return (
    <section className="max-w-3xl mx-auto px-6 py-15 text-[var(--theme-text)] space-y-16">
      <div>
        <h2 className="text-4xl font-bold text-[var(--theme-accent)] text-center mb-4">
          How One Guy Productions Was Born
        </h2>

        <p className="text-base leading-relaxed text-[var(--theme-text)]/80 mb-4 sm:text-left">
          One Guy Productions began with a simple conviction: one disciplined builder, using the right tools and a clear plan, can ship what usually takes a committee. After more than a decade in enterprise tech—owning renewal pipelines, partnering with engineering, legal, and product, and translating customer needs into scoped work—I saw how momentum dies when accountability is diffused. I wanted a model where the person gathering the requirements is the same person writing the code.
        </p>

        <p className="text-base leading-relaxed text-[var(--theme-text)]/80 mb-4 sm:text-left">
          The idea crystallized as I moved from observing roadmaps to implementing them. Instead of producing decks about solutions, I started delivering them: small, focused releases, measured by real outcomes. The goal wasn’t just to “build an app,” but to remove friction with polish and precision—fast load times, consistent UI, typed APIs, and behavior that’s reliable under pressure.
        </p>

        <p className="text-base leading-relaxed text-[var(--theme-text)]/80 mb-4 sm:text-left">
          That approach shaped everything I ship:{' '}
          <a
            href="https://www.careergistpro.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[var(--theme-border-red)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/50 rounded-sm"
          >
            CareerGistPRO
          </a>{' '}
          (job discovery with analytics and social sharing),{' '}
          <a
            href="https://www.leaseclaritypro.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[var(--theme-border-red)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/50 rounded-sm"
          >
            LeaseClarityPRO
          </a>{' '}
          (AI-assisted lease analysis and tenant-rights context),{' '}
          <a
            href="https://www.cvitaepro.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[var(--theme-border-red)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/50 rounded-sm"
          >
            CVitaePRO
          </a>{' '}
          (resume generation and clean exports),{' '}
          <a
            href="https://www.pydatapro.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[var(--theme-border-red)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/50 rounded-sm"
          >
            PyDataPRO
          </a>{' '}
          (data-driven career tooling), and more. Under the hood: React + TypeScript, Node/Express, PostgreSQL, Python/FastAPI where it fits, OpenAI + LangChain when AI adds leverage, with security and trust baked in (HttpOnly JWT cookies, OTP via Resend, reCAPTCHA Enterprise).
        </p>

        <p className="text-base leading-relaxed text-[var(--theme-text)]/80 sm:text-left">
          One Guy Productions is about autonomy, clarity, and impact. No bureaucracy, no handoffs, no performative process—just a direct line to the person accountable for results. Scope tightly, ship iteratively, measure honestly, and improve continuously. Code that works, shipped sooner than expected, and easy to maintain after it lands.
        </p>
      </div>

      <div className="flex flex-col items-center space-y-8">
        <img
          src="/me2.webp"
          alt="Nathan - One Guy Productions"
          className="w-48 h-48 rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_4px_var(--theme-shadow)]"
        />

        <h1 className="text-4xl font-bold text-[var(--theme-accent)]">Hey, I’m Nathan</h1>

        <p className="text-base leading-relaxed text-[var(--theme-text)]/80 mb-4 sm:text-left">
          I’m a full-stack engineer with an 16-year foundation in enterprise tech sales, renewals, and customer strategy. I managed multimillion-dollar renewal pipelines, forecasted risk, and partnered daily with engineering, legal, and product to turn customer feedback into scoped work that actually shipped. That cross-functional vantage point taught me how reliability, clarity, and speed drive outcomes—not just in deals, but in software. After a decade and a half of sitting between customers and delivery, I made the leap to building the tools myself.
        </p>

        <p className="text-base leading-relaxed text-[var(--theme-text)]/80 mb-4 sm:text-left">
          Today I design and ship end-to-end products that move fast, feel smooth, and solve real problems. I focus on performance (tight bundles, responsive UI), design consistency (Tailwind-driven systems, accessible patterns), and code that’s easy to maintain and trust (typed APIs, graceful error handling, clear separation of concerns). My stack spans React + TypeScript on the frontend, Node/Express and PostgreSQL on the backend, with Python/FastAPI where it fits. I build with OpenAI and LangChain when AI adds real leverage, not buzzwords.
        </p>

        <br />

        <p className="text-base leading-relaxed text-[var(--theme-text)]/80 mb-4 sm:text-left">
          My stack includes:
        </p>

        <div className="space-y-4 text-left">
          <dl className="border-l-1 border-[var(--theme-accent)] pl-4 grid gap-y-2 text-[var(--theme-text)]/80 text-sm sm:text-base">
            <div className="grid sm:grid-cols-[auto_1fr] gap-2">
              <dt className="font-semibold text-[var(--theme-text)] italic">Full-stack:</dt>
              <span className="text-[var(--theme-text)]/60">
                <dd>JavaScript/TypeScript, React, Next.js, Node.js, Express, Python (FastAPI), SQL (PostgreSQL), Sequelize</dd>
              </span>
            </div>

            <div className="grid sm:grid-cols-[auto_1fr] gap-2">
              <dt className="font-semibold text-[var(--theme-text)] italic">Frontend:</dt>
              <span className="text-[var(--theme-text)]/60">
                <dd>Vite, Zustand, Redux, TailwindCSS v4, Framer Motion, lucide-react, Open Graph/SSR</dd>
              </span>
            </div>

            <div className="grid sm:grid-cols-[auto_1fr] gap-2">
              <dt className="font-semibold text-[var(--theme-text)] italic">Backend & AI:</dt>
              <span className="text-[var(--theme-text)]/60">
                <dd>OpenAI SDK, LangChain, spaCy v3, Redis, JWT, bcrypt</dd>
              </span>
            </div>

            <div className="grid sm:grid-cols-[auto_1fr] gap-2">
              <dt className="font-semibold text-[var(--theme-text)] italic">Security & Auth:</dt>
              <span className="text-[var(--theme-text)]/60">
                <dd>HttpOnly JWT cookies, OTP, reCAPTCHA Enterprise v3, API rate limiting</dd>
              </span>
            </div>

            <div className="grid sm:grid-cols-[auto_1fr] gap-2">
              <dt className="font-semibold text-[var(--theme-text)] italic">DevOps & Data:</dt>
              <span className="text-[var(--theme-text)]/60">
                <dd>PostgreSQL, PgAdmin, Render, Supabase, Railway, monorepo tooling (concurrently, nodemon)</dd>
              </span>
            </div>

            <div className="grid sm:grid-cols-[auto_1fr] gap-2">
              <dt className="font-semibold text-[var(--theme-text)] italic">Also exploring:</dt>
              <span className="text-[var(--theme-text)]/60">
                <dd>Swift, React Native, Expo, and Vue.js</dd>
              </span>
            </div>
          </dl>
        </div>

        <Link
          to="/order"
          className="inline-block mt-8 bg-[var(--theme-button)] hover:bg-[var(--theme-hover)] text-[var(--theme-text-white)] px-6 py-3 rounded shadow focus:ring-2 focus:ring-[var(--theme-focus)]"
        >
          Start Your Project →
        </Link>
      </div>
    </section>
  );
}
