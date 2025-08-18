import { Link } from 'react-router-dom';
import type { ReactElement } from 'react';

export default function AboutSectionView(): ReactElement {
  return (
    <section className="max-w-3xl mx-auto px-6 py-15 text-[var(--theme-text)] space-y-16">
      <div>
        <h2 className="text-4xl font-bold text-[var(--theme-accent)] mb-4 text-center">
          How One Guy Productions Was Born
        </h2>
        <p className="text-base leading-relaxed text-[var(--theme-text)]/80 mb-4 text-center sm:text-left">
          One Guy Productions started as a simple conviction: that a single, disciplined developer — armed with the right tools and vision — could build what normally takes a full team. I wanted to challenge the notion that meaningful software requires a committee.
        </p>
        <p className="text-base leading-relaxed text-[var(--theme-text)]/80 mb-4 text-center sm:text-left">
          The idea took shape as I transitioned from observing product roadmaps to writing them in code. I didn’t just want to build apps — I wanted to solve problems with polish and precision, shipping faster and smarter than bloated pipelines ever could.
        </p>
        <p className="text-base leading-relaxed text-[var(--theme-text)]/80 text-center sm:text-left">
          Every product under the One Guy Productions name — from resume engines to AI lease readers — is built with the same spirit: autonomy, clarity, and impact. No fluff. No bureaucracy. Just code that works.
        </p>
      </div>

      <div className="flex flex-col items-center space-y-8 text-center">
        <img
          src="/me.webp"
          alt="Nathan - One Guy Productions"
          className="w-48 h-48 rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--theme-focus)]/30 shadow-[0_4px_14px_4px_var(--theme-shadow)]"
        />

        <h1 className="text-4xl font-bold text-[var(--theme-accent)]">Hey, I’m Nathan</h1>

        <p className="text-lg leading-relaxed text-[var(--theme-text)]/80 max-w-xl">
          I’m a full-stack engineer with a background in tech sales, renewals, and customer strategy. After 11 years in the enterprise world — managing $MM pipelines and working cross-functionally with engineering, legal, and product — I made a leap.
        </p>
        <p className="text-lg leading-relaxed text-[var(--theme-text)]/80 max-w-xl">
          Today, I build tools that move fast, feel smooth, and actually solve problems. I care deeply about performance, design consistency, and writing code that’s easy to scale and even easier to trust.
        </p>

        <div className="space-y-4 text-left">
          <blockquote className="border-l-4 border-[var(--theme-accent)] pl-4 italic text-[var(--theme-text)]/60">
            • Full-stack: JavaScript/TypeScript, React, Next.js, Node.js, Express, Python (FastAPI), SQL (PostgreSQL), Sequelize<br />
            • Frontend: Vite, Zustand, TailwindCSS v4, Framer Motion, lucide-react, Open Graph/SSR<br />
            • Backend & AI: OpenAI SDK, LangChain, spaCy v3, Redis, JWT, bcrypt<br />
            • Security & Auth: HttpOnly JWT cookies, OTP (Resend), reCAPTCHA Enterprise v3, rate limiting<br />
            • DevOps & Data: PostgreSQL, PgAdmin, Render, Supabase, Railway, monorepo tooling (concurrently, nodemon)<br />
            • Creator of: CVitaePRO, LeaseClarityPRO, CareerGistPRO, PyDataPRO<br />
            • Also exploring: Swift
          </blockquote>

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
