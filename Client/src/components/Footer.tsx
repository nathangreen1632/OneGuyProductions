import React from "react";

export default function Footer(): React.ReactElement {
  const currentYear: number = new Date().getFullYear();

  return (
    <footer className="bg-[var(--theme-bg)] border-t border-[var(--theme-border-red)] py-4 text-center text-sm text-[var(--theme-text)]">
      © {currentYear} One Guy Productions. All rights reserved.
    </footer>
  );
}
