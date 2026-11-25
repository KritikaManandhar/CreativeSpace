import React from "react";
import { redirect } from "next/navigation";
import { evaluateProtectedPageAccess } from "@/lib/page-auth";
import { TemporaryPagePlaceholder } from "@/components/placeholder/TemporaryPagePlaceholder";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const access = await evaluateProtectedPageAccess("/dashboard");
  if (!access.allowed) {
    redirect(access.redirectTo);
  }

  return (
    <TemporaryPagePlaceholder
      title="Creator Dashboard"
      routeLabel="/dashboard"
      description="Old workspace, invitations, connections, and notifications UI has been removed for upcoming redesign. Protected session verification and API logic remain intact."
      contextItems={[
        { label: "Session Guard", value: "Authenticated" },
        { label: "Extracted Logic", value: "src/lib/features/workspace.ts, invitations.ts, connections.ts" },
      ]}
    />
  );
}
