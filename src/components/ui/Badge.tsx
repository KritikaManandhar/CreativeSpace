import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ProjectStatus, Visibility, CollaboratorRole, VersionStatus } from "@prisma/client";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "status" | "visibility" | "role" | "version";
  status?: ProjectStatus;
  visibility?: Visibility;
  role?: CollaboratorRole | string;
  versionStatus?: VersionStatus;
}

export function Badge({
  className,
  variant = "default",
  status,
  visibility,
  role,
  versionStatus,
  children,
  ...props
}: BadgeProps) {
  let colorStyles = "bg-slate-800 text-slate-300 border-slate-700";

  if (variant === "status" && status) {
    switch (status) {
      case "Idea":
        colorStyles = "bg-amber-950/60 text-amber-300 border-amber-800/60";
        break;
      case "InProgress":
        colorStyles = "bg-blue-950/60 text-blue-300 border-blue-800/60";
        break;
      case "InReview":
        colorStyles = "bg-purple-950/60 text-purple-300 border-purple-800/60";
        break;
      case "Completed":
        colorStyles = "bg-emerald-950/60 text-emerald-300 border-emerald-800/60";
        break;
    }
  } else if (variant === "visibility" && visibility) {
    switch (visibility) {
      case "Private":
        colorStyles = "bg-slate-900 text-slate-400 border-slate-700";
        break;
      case "CollaboratorsOnly":
        colorStyles = "bg-indigo-950/60 text-indigo-300 border-indigo-800/60";
        break;
      case "Public":
        colorStyles = "bg-emerald-950/60 text-emerald-300 border-emerald-800/60";
        break;
    }
  } else if (variant === "role" && role) {
    switch (role) {
      case "Owner":
        colorStyles = "bg-violet-950/60 text-violet-300 border-violet-800/60";
        break;
      case "Collaborator":
        colorStyles = "bg-cyan-950/60 text-cyan-300 border-cyan-800/60";
        break;
      case "ClientReviewer":
        colorStyles = "bg-amber-950/60 text-amber-300 border-amber-800/60";
        break;
    }
  } else if (variant === "version" && versionStatus) {
    switch (versionStatus) {
      case "Draft":
        colorStyles = "bg-slate-900 text-slate-400 border-slate-700";
        break;
      case "Approved":
        colorStyles = "bg-emerald-950/60 text-emerald-300 border-emerald-800/60";
        break;
      case "Final":
        colorStyles = "bg-purple-950/60 text-purple-300 border-purple-800/60";
        break;
      case "Rejected":
        colorStyles = "bg-rose-950/60 text-rose-300 border-rose-800/60";
        break;
    }
  }

  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide transition-colors",
          colorStyles,
          className
        )
      )}
      {...props}
    >
      {children || status || visibility || role || versionStatus}
    </span>
  );
}
