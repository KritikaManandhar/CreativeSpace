import React from "react";
import { Loader2 } from "lucide-react";

export function LoadingSpinner({
  className = "w-6 h-6 text-violet-500",
}: {
  className?: string;
}) {
  return <Loader2 className={`animate-spin ${className}`} />;
}

export function LoadingState({
  title = "Loading CreativeSpace...",
  description = "Fetching the latest projects and assets.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="w-12 h-12 rounded-2xl bg-violet-950/60 flex items-center justify-center mb-4">
        <LoadingSpinner className="w-6 h-6 text-violet-400" />
      </div>
      <h3 className="text-base font-medium text-white">{title}</h3>
      <p className="text-xs text-slate-400 mt-1">{description}</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 animate-pulse">
      <div className="h-40 bg-slate-800 rounded-lg w-full" />
      <div className="h-4 bg-slate-800 rounded w-3/4" />
      <div className="h-3 bg-slate-800 rounded w-1/2" />
      <div className="flex justify-between pt-2">
        <div className="h-5 bg-slate-800 rounded-full w-20" />
        <div className="h-5 bg-slate-800 rounded-full w-16" />
      </div>
    </div>
  );
}
