import React from "react";
import { redirect } from "next/navigation";
import { evaluateAdminPageAccess } from "@/lib/page-auth";
import { TemporaryPagePlaceholder } from "@/components/placeholder/TemporaryPagePlaceholder";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const access = await evaluateAdminPageAccess("/admin");

  if (!access.allowed && process.env.NODE_ENV === "production") {
    if (access.status === 401 && access.redirectTo) {
      redirect(access.redirectTo);
    }
    return (
      <main className="min-h-screen bg-[#F6F3EB] text-[#282B2A] flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md border border-[#282B2A]/15 p-8">
          <h1 className="font-serif text-2xl text-[#282B2A]">Access Denied</h1>
          <p className="mt-2 text-sm text-[#282B2A]/75">{access.message}</p>
        </div>
      </main>
    );
  }

  return (
    <TemporaryPagePlaceholder
      title="Admin Console"
      routeLabel="/admin"
      description="Admin moderation and platform analytics UI has been removed for upcoming redesign. All admin security guards and API endpoints remain active."
      contextItems={[
        { label: "Access Control", value: "Verified Admin Session" },
        { label: "Backend APIs", value: "/api/admin/stats, /api/admin/reports, /api/admin/categories" },
      ]}
    />
  );
}
