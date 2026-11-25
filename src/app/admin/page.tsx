import React from "react";
import { redirect } from "next/navigation";
import { evaluateAdminPageAccess } from "@/lib/page-auth";
import { ErrorState } from "@/components/ui/ErrorState";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const access = await evaluateAdminPageAccess("/admin");

  if (!access.allowed) {
    if (access.status === 401 && access.redirectTo) {
      redirect(access.redirectTo);
    }
    return (
      <div className="flex-1 max-w-md mx-auto py-24 px-4">
        <ErrorState
          title="Access Denied"
          message={access.message}
        />
      </div>
    );
  }

  return <AdminDashboardClient />;
}
