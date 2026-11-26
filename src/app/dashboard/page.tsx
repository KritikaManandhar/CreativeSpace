import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { evaluateProtectedPageAccess } from "@/lib/page-auth";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export const metadata: Metadata = {
  title: "Creator Dashboard — Private Workspace | CreativeSpace",
  description:
    "Personal atelier workspace for managing your CreativeSpace projects, services, bookings, posts, and collaborative spaces.",
};

export const dynamic = "force-dynamic";

interface DashboardPageProps {
  searchParams?: {
    preview?: string;
  };
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const isPreview = searchParams?.preview === "true";
  const access = await evaluateProtectedPageAccess("/dashboard").catch(() => null);

  // In production, enforce authentication redirect; in development allow local preview
  if (!access?.allowed && !isPreview && process.env.NODE_ENV === "production") {
    redirect(access?.redirectTo || "/login?callbackUrl=%2Fdashboard");
  }

  const currentUser = access?.allowed ? access.user : null;

  return <DashboardClient currentUser={currentUser} />;
}
