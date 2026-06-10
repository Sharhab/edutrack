"use client";

import React from "react";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="px-3 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
    >
      Print
    </button>
  );
}