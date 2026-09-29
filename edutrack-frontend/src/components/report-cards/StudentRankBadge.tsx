"use client";

import React from "react";

type Props = {
  position: number | null;
  positionLabel?: string;
};

export default function StudentRankBadge({
  position,
  positionLabel,
}: Props) {
  if (!position) {
    return (
      <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-600">
        Unranked
      </span>
    );
  }

  const getStyles = () => {
    switch (position) {
      case 1:
        return "bg-yellow-400 text-black";
      case 2:
        return "bg-gray-300 text-black";
      case 3:
        return "bg-orange-300 text-black";
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="font-semibold text-sm">
        {positionLabel || `${position}th`}
      </span>

      <span
        className={`text-xs px-2 py-1 rounded ${getStyles()}`}
      >
        {position === 1
          ? "1st"
          : position === 2
          ? "2nd"
          : position === 3
          ? "3rd"
          : `${position}th`}
      </span>
    </div>
  );
}