"use client";

import React from "react";
import { 
  Brain, 
  FileText, 
  HelpCircle, 
  CheckCircle2, 
  Zap, 
  AlertTriangle, 
  ListChecks, 
  Lightbulb, 
  ChevronRight,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AiAnalysisCardProps {
  initialAnalysis?: any;
  onRegenerate?: () => void;
  isGenerating?: boolean;
}

export function AiAnalysisCard({ initialAnalysis, onRegenerate, isGenerating }: AiAnalysisCardProps) {
  const analysis = initialAnalysis;

  if (!analysis) {
    return (
      <div className="bg-gradient-to-b from-white to-gray-50/50 rounded-2xl p-6 border border-[#E5E7EB] shadow-sm relative overflow-hidden flex flex-col items-center text-center">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-100/50 rounded-full blur-3xl pointer-events-none" />
        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4 text-purple-600">
          <Brain className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-foreground text-sm">Daily AI Briefing</h4>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed mb-1">
          No AI Briefing generated yet.
        </p>
        <p className="text-[10px] text-muted-foreground/80 italic">
          Generate Today's Journal to view your analysis.
        </p>
      </div>
    );
  }

  // Determine score color
  let scoreColor = "text-purple-600";
  let scoreBg = "bg-purple-100";
  let scoreBorder = "border-purple-200";
  
  if (analysis.score >= 80) {
    scoreColor = "text-green-600";
    scoreBg = "bg-green-100";
    scoreBorder = "border-green-200";
  } else if (analysis.score < 50) {
    scoreColor = "text-amber-600";
    scoreBg = "bg-amber-100";
    scoreBorder = "border-amber-200";
  }

  // Detect if the response is in the legacy format
  const isLegacy = !analysis.reason && !analysis.evidence && !analysis.strengths && !analysis.areasToImprove && !analysis.tomorrowActionPlan && !analysis.suggestedFocus;

  if (isLegacy) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm flex flex-col overflow-hidden relative">
        {/* Score Header */}
        <div className={cn("p-6 pb-5 border-b text-center relative", scoreBg, scoreBorder)}>
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-foreground/70 flex items-center justify-center gap-1.5">
            <Brain className="w-4 h-4" /> Today's Progress
          </h3>
          <div className={cn("text-5xl font-black mb-1", scoreColor)}>
            {analysis.score}
            <span className="text-xl font-semibold opacity-50 ml-1">/100</span>
          </div>
          <p className={cn("text-sm font-bold", scoreColor)}>{analysis.label || "Daily Check-in"}</p>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[600px] custom-scrollbar p-5 space-y-6">
          {/* Executive Summary */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              Executive Summary
            </h4>
            <p className="text-sm text-foreground leading-relaxed">
              {analysis.executiveSummary || analysis.summary}
            </p>
          </div>

          {/* Bullet Points */}
          {analysis.bulletPoints && analysis.bulletPoints.length > 0 && (
            <div className="pt-4 border-t border-border/50">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                 Insights
              </h4>
              <ul className="space-y-3">
                {analysis.bulletPoints.map((bp: any, i: number) => (
                  <li key={i} className="flex items-start gap-3 p-3 bg-gray-50/50 rounded-xl border border-border">
                    <span className="text-base leading-none mt-0.5 shrink-0">{bp.icon}</span>
                    <span className="text-xs text-foreground leading-relaxed">{bp.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendation */}
          {analysis.recommendation && (
            <div className="pt-4 border-t border-border/50">
              <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl p-4 border border-purple-200/50">
                <h4 className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Target className="w-4 h-4" /> Recommended Next Step
                </h4>
                <p className="text-sm font-medium text-purple-950 dark:text-purple-100 leading-relaxed">
                  {analysis.recommendation}
                </p>
              </div>
            </div>
          )}
        </div>

        {onRegenerate && (
          <div className="p-4 border-t border-border/50 bg-gray-50/50">
            <button
              onClick={onRegenerate}
              disabled={isGenerating}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all",
                isGenerating 
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-purple-100 text-purple-700 hover:bg-purple-200"
              )}
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                  Analyzing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Regenerate Analysis
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Redesigned Structured Renderer
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm flex flex-col overflow-hidden relative">
      {/* Score Header */}
      <div className={cn("p-6 pb-5 border-b text-center relative", scoreBg, scoreBorder)}>
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
        <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-foreground/70 flex items-center justify-center gap-1.5">
          <Brain className="w-4 h-4" /> Today's Progress
        </h3>
        <div className={cn("text-5xl font-black mb-1", scoreColor)}>
          {analysis.score}
          <span className="text-xl font-semibold opacity-50 ml-1">/100</span>
        </div>
        <p className={cn("text-sm font-bold", scoreColor)}>{analysis.label || "Daily Check-in"}</p>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[600px] custom-scrollbar p-5 space-y-6">
        
        {/* Executive Summary */}
        <div className="bg-slate-50/70 border-l-4 border-slate-400 rounded-r-xl p-4 space-y-1 shadow-sm">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-slate-500" /> Executive Summary
          </h4>
          <p className="text-xs text-slate-800 leading-relaxed font-medium">
            {analysis.executiveSummary}
          </p>
        </div>

        {/* Why This Score? */}
        {analysis.reason && (
          <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-4 space-y-1.5 shadow-sm">
            <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-indigo-500" /> Why This Score?
            </h4>
            <p className="text-xs text-indigo-900 leading-relaxed">
              {analysis.reason}
            </p>
          </div>
        )}

        {/* Evidence */}
        {analysis.evidence && analysis.evidence.length > 0 && (
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Evidence From Today
            </h4>
            <ul className="space-y-2">
              {analysis.evidence.map((ev: string, i: number) => (
                <li key={i} className="flex items-start gap-2.5 p-2.5 bg-gray-50/45 rounded-lg border border-gray-100 text-xs text-foreground leading-relaxed">
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span>{ev}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Strengths */}
        {analysis.strengths && analysis.strengths.length > 0 && (
          <div className="bg-emerald-50/30 border border-emerald-100/70 rounded-xl p-4 space-y-2.5 shadow-sm">
            <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-500" /> Strengths
            </h4>
            <ul className="space-y-2">
              {analysis.strengths.map((str: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-xs text-emerald-950 leading-relaxed font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Areas to Improve */}
        {analysis.areasToImprove && analysis.areasToImprove.length > 0 && (
          <div className="bg-amber-50/40 border border-amber-100/60 rounded-xl p-4 space-y-2.5 shadow-sm">
            <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Areas to Improve
            </h4>
            <ul className="space-y-2">
              {analysis.areasToImprove.map((area: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-xs text-amber-950 leading-relaxed">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tomorrow's Action Plan */}
        {analysis.tomorrowActionPlan && analysis.tomorrowActionPlan.length > 0 && (
          <div className="bg-purple-50/30 border border-purple-100/70 rounded-xl p-4 space-y-2.5 shadow-sm">
            <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
              <ListChecks className="w-4 h-4 text-purple-500" /> Tomorrow's Action Plan
            </h4>
            <ul className="space-y-2">
              {analysis.tomorrowActionPlan.map((act: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-xs text-purple-950 leading-relaxed font-medium">
                  <ChevronRight className="w-3.5 h-3.5 text-purple-500 mt-0.5 shrink-0" />
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggested Focus */}
        {analysis.suggestedFocus && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100/80 rounded-xl p-4 shadow-sm">
            <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <Lightbulb className="w-4 h-4 text-amber-500 animate-pulse" /> Suggested Focus
            </h4>
            <p className="text-xs font-bold text-purple-950 leading-relaxed">
              {analysis.suggestedFocus}
            </p>
          </div>
        )}
      </div>

      {onRegenerate && (
        <div className="p-4 border-t border-border/50 bg-gray-50/50">
          <button
            onClick={onRegenerate}
            disabled={isGenerating}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all",
              isGenerating 
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-purple-100 text-purple-700 hover:bg-purple-200"
            )}
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                Analyzing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Regenerate Analysis
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
