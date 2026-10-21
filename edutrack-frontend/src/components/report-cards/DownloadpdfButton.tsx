
"use client";

import { useState } from "react";

type DownloadPdfButtonProps = {
  onClick?: () => void;
  className?: string;
  label?: string;
};

export default function DownloadPdfButton({
  onClick,
  className = "",
  label = "Save / Download PDF",
}: DownloadPdfButtonProps) {
  const [opening, setOpening] = useState(false);

  const handleClick = () => {
    if (opening) return;

    setOpening(true);

    try {
      if (onClick) {
        onClick();
      } else {
        window.print();
      }
    } catch (error) {
      console.error("Unable to open print dialog:", error);
      setOpening(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={[
        "inline-flex min-h-11 items-center justify-center gap-2",
        "rounded-lg bg-cyan-600 px-4 py-2",
        "text-sm font-semibold text-white shadow-sm",
        "transition-colors hover:bg-cyan-700",
        "focus:outline-none focus:ring-2 focus:ring-cyan-500",
        "focus:ring-offset-2 disabled:cursor-wait",
        "disabled:opacity-70 print:hidden",
        className,
      ].join(" ")}
      disabled={opening}
      aria-label={label}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 9V2h12v7" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <path d="M6 14h12v8H6z" />
      </svg>

      <span>{opening ? "Opening print..." : label}</span>
    </button>
  );
}
