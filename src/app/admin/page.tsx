"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  Users,
  FolderKanban,
  FileBox,
  HardDrive,
  CheckCircle2,
  XCircle,
  Plus,
  AlertTriangle,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin");
    } else if (status === "authenticated" && !session?.user?.isAdmin) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  const fetchAdminData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [statsRes, reportsRes, catsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/reports"),
        fetch("/api/admin/categories"),
      ]);

      const statsData = await statsRes.json();
      const reportsData = await reportsRes.json();
      const catsData = await catsRes.json();

      if (statsData.success) setStats(statsData.data);
      if (reportsData.success) setReports(reportsData.data || []);
      if (catsData.success) setCategories(catsData.data || []);
    } catch (e) {
      setError("Failed to load admin data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.isAdmin) {
      fetchAdminData();
    }
  }, [session]);

  const handleResolveReport = async (reportId: string, resolution: "Resolved" | "Dismissed") => {
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: resolution }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchAdminData();
      }
    } catch (e) {
      alert("Error resolving report");
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNewCategoryName("");
        await fetchAdminData();
      } else {
        alert(data.error?.message || "Failed to create category");
      }
    } catch (e) {
      alert("Error creating category");
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <LoadingSpinner className="w-10 h-10 text-amber-500" />
      </div>
    );
  }

  if (!session?.user?.isAdmin) {
    return (
      <div className="flex-1 max-w-md mx-auto py-24 px-4">
        <ErrorState
          title="Access Denied"
          message="You do not have administrative privileges to access this area."
        />
      </div>
    );
  }

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-8 border-b border-slate-800 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Platform Administration
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-amber-400" />
            Admin & Governance Console
          </h1>
        </div>
      </div>

      {/* Metrics Row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase">Total Users</p>
                  <p className="text-2xl font-extrabold text-white mt-1">{stats.totalUsers}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-violet-950/60 text-violet-400">
                  <Users className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase">Total Projects</p>
                  <p className="text-2xl font-extrabold text-white mt-1">{stats.totalProjects}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-950/60 text-indigo-400">
                  <FolderKanban className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase">Uploaded Assets</p>
                  <p className="text-2xl font-extrabold text-white mt-1">{stats.totalAssets}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-cyan-950/60 text-cyan-400">
                  <FileBox className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase">Storage Used</p>
                  <p className="text-2xl font-extrabold text-white mt-1">{stats.totalStorageMB} MB</p>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-950/60 text-amber-400">
                  <HardDrive className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Sections: Reports & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Reports Queue */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Content & User Moderation Queue ({reports.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  No moderation reports logged. All clear!
                </p>
              ) : (
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">
                          Target: {report.targetType} ({report.targetId})
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            report.status === "Open"
                              ? "bg-rose-950 text-rose-300 border border-rose-800"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {report.status}
                        </span>
                      </div>

                      <p className="text-slate-300">Reason: {report.reason}</p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
                        <span>Reported by @{report.reporter.username}</span>
                        {report.status === "Open" && (
                          <div className="flex gap-2">
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleResolveReport(report.id, "Resolved")}
                            >
                              Resolve
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResolveReport(report.id, "Dismissed")}
                            >
                              Dismiss
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Categories Manager */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-violet-400" />
                Category Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleCreateCategory} className="flex gap-2">
                <input
                  type="text"
                  placeholder="New Category name..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <Button type="submit" size="sm" className="gap-1">
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </Button>
              </form>

              <div className="space-y-2 pt-2">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 text-xs"
                  >
                    <span className="font-medium text-slate-200">{cat.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
