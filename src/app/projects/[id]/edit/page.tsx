import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { evaluateProjectEditPageAccess } from "@/lib/page-auth";
import { TemporaryPagePlaceholder } from "@/components/placeholder/TemporaryPagePlaceholder";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit Creative Work — CreativeSpace 2.0",
  description:
    "Modify previously published creative work, media attachments, taxonomy tags, and publishing visibility on CreativeSpace.",
};

interface PageProps {
  params: {
    id: string;
  };
}

export default async function Page({ params }: PageProps) {
  const access = await evaluateProjectEditPageAccess(params.id);

  if (!access.allowed) {
    if (access.status === 401 && access.redirectTo) {
      redirect(access.redirectTo);
    }
    if (access.status === 404) {
      notFound();
    }
    return (
      <main className="min-h-screen bg-[#F6F3EB] flex items-center justify-center px-4 py-16 text-[#282B2A]">
        <div className="max-w-md w-full rounded-3xl bg-[#FAF8F3] border border-[#203B35]/15 p-8 shadow-sm text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-700 border border-rose-200">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="font-serif text-2xl font-normal text-[#203B35]">
            Access Denied
          </h1>
          <p className="text-sm text-[#5D635F] leading-relaxed">
            {access.message}
          </p>
          <div className="pt-2">
            <Link
              href={`/projects/${params.id}`}
              className="inline-flex items-center gap-2 rounded-full bg-[#203B35] px-5 py-2.5 text-xs font-semibold text-[#FAF8F3] hover:bg-[#162A26] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to Project</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <TemporaryPagePlaceholder
      title="Edit Project"
      routeLabel="/projects/[id]/edit"
      description="Old project settings and edit UI has been removed for upcoming redesign. Owner authorization guard and PATCH/DELETE logic remain preserved."
      contextItems={[
        { label: "Access Control", value: "Owner Verified via evaluateProjectEditPageAccess" },
        { label: "Extracted Logic", value: "src/lib/features/project-edit.ts" },
      ]}
    />
  );
}
