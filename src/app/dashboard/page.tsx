import React from "react";
import { redirect } from "next/navigation";
import { evaluateProtectedPageAccess } from "@/lib/page-auth";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const access = await evaluateProtectedPageAccess("/dashboard");
  if (!access.allowed) {
    redirect(access.redirectTo);
  }

  return <DashboardClient />;
}
