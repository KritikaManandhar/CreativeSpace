import { parseApiResponse } from "./api-client";

export interface AdminCategoryCount {
  category: string;
  count: number;
}

export interface AdminStatsData {
  totalUsers: number;
  totalProjects: number;
  totalAssets: number;
  totalVersions: number;
  totalComments: number;
  totalLikes: number;
  pendingReports: number;
  totalStorageBytes: number;
  totalStorageMB: number;
  projectsByCategory: AdminCategoryCount[];
}

export type ModerationReportStatus = "Open" | "Resolved" | "Dismissed";

export interface AdminReportRecord {
  id: string;
  reporterId: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: ModerationReportStatus;
  createdAt: string;
  reporter?: {
    id: string;
    username: string;
    displayName: string;
    email?: string | null;
  } | null;
}

export interface AdminCategoryRecord {
  id: string;
  name: string;
  createdAt?: string;
}

export interface AdminDashboardSnapshot {
  stats: AdminStatsData;
  reports: AdminReportRecord[];
  categories: AdminCategoryRecord[];
}

export async function fetchAdminDashboardData(): Promise<AdminDashboardSnapshot> {
  const [statsRes, reportsRes, categoriesRes] = await Promise.all([
    fetch("/api/admin/stats", { cache: "no-store" }),
    fetch("/api/admin/reports", { cache: "no-store" }),
    fetch("/api/admin/categories", { cache: "no-store" }),
  ]);

  const [stats, reports, categories] = await Promise.all([
    parseApiResponse<AdminStatsData>(statsRes, "Failed to load platform stats"),
    parseApiResponse<AdminReportRecord[]>(reportsRes, "Failed to load moderation reports"),
    parseApiResponse<AdminCategoryRecord[]>(categoriesRes, "Failed to load categories"),
  ]);

  return { stats, reports, categories };
}

export async function resolveAdminReport(
  reportId: string,
  status: "Resolved" | "Dismissed"
): Promise<AdminReportRecord> {
  const res = await fetch(`/api/admin/reports/${encodeURIComponent(reportId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return parseApiResponse<AdminReportRecord>(res, "Failed to update report status");
}

export async function createAdminCategory(name: string): Promise<AdminCategoryRecord> {
  const res = await fetch("/api/admin/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name.trim() }),
  });
  return parseApiResponse<AdminCategoryRecord>(res, "Failed to create category");
}
