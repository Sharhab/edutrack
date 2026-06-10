"use client";

import React from "react";

type Props = {
  onClick: () => void;
  loading?: boolean;
};

export default function DownloadPdfButton({
  onClick,
  loading,
}: Props) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? "Generating..." : "Download PDF"}
    </button>
  );
}