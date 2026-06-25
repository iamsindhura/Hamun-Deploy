"use client";

import React from "react";

export function HeatmapLegend() {
  return (
    <div className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground mt-8">
      <span>Less</span>
      <div className="flex gap-1.5 items-center">
        {/* No Focus */}
        <div className="w-3 h-3 rounded-sm bg-gradient-to-b from-slate-600 to-slate-800 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]" title="No Focus" />
        {/* 1-30 min */}
        <div className="w-3 h-3 rounded-sm bg-gradient-to-b from-slate-400 to-slate-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]" title="1-30 min" />
        {/* 30-60 min */}
        <div className="w-3 h-3 rounded-sm bg-gradient-to-b from-slate-200 to-[#FDE68A] shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)]" title="30-60 min" />
        {/* 1-2 hrs */}
        <div className="w-3 h-3 rounded-sm bg-gradient-to-b from-[#FEF3C7] to-[#FCD34D] shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)]" title="1-2 hrs" />
        {/* 2-4 hrs */}
        <div className="w-3 h-3 rounded-sm bg-gradient-to-b from-[#FDE68A] to-[#F59E0B] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]" title="2-4 hrs" />
        {/* 4+ hrs */}
        <div className="w-3 h-3 rounded-sm bg-gradient-to-b from-[#FCD34D] to-[#D97706] shadow-[0_0_10px_rgba(217,119,6,0.6),inset_0_1px_1px_rgba(255,255,255,0.4)]" title="4+ hrs" />
      </div>
      <span>More</span>
    </div>
  );
}
