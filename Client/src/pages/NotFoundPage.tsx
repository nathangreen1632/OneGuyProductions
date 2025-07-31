import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage(): React.ReactElement {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--theme-bg)] text-[var(--theme-text)] px-6 text-center">
      <h1 className="text-6xl font-bold text-red-500 mb-4">404 Not Found</h1>
      <p className="text-lg text-gray-400 mb-8">
        The page you're looking for doesn’t exist. Please verify the link or return to the homepage.
      </p>
      <Link
        to="/"
        className="text-sm px-5 py-2 rounded bg-[var(--theme-button)] hover:bg-[var(--theme-hover)] text-white transition focus:ring-2 focus:ring-[var(--theme-focus)]"
      >
        Return to Home
      </Link>
    </div>
  );
}
