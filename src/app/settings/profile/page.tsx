import React from "react";
import { redirect } from "next/navigation";
import { evaluateProtectedPageAccess } from "@/lib/page-auth";
import { ProfileSettingsClient } from "@/components/settings/ProfileSettingsClient";

export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
  const access = await evaluateProtectedPageAccess("/settings/profile");
  if (!access.allowed) {
    redirect(access.redirectTo);
  }

  return <ProfileSettingsClient />;
}
