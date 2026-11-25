import React from "react";
import { redirect } from "next/navigation";
import { evaluateProtectedPageAccess } from "@/lib/page-auth";
import { TemporaryPagePlaceholder } from "@/components/placeholder/TemporaryPagePlaceholder";

export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
  const access = await evaluateProtectedPageAccess("/settings/profile");
  if (!access.allowed) {
    redirect(access.redirectTo);
  }

  return (
    <TemporaryPagePlaceholder
      title="Profile Settings"
      routeLabel="/settings/profile"
      description="Old profile settings UI has been removed for upcoming redesign. Authentication guard and social privacy update logic remain preserved."
      contextItems={[
        { label: "Session Guard", value: "Authenticated" },
        { label: "Extracted Logic", value: "src/lib/features/profile-settings.ts" },
      ]}
    />
  );
}
