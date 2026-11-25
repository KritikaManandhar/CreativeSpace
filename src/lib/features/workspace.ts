import { parseApiResponse } from "./api-client";

export type WorkspaceTab = "projects" | "invitations" | "connections" | "notifications";

export const WORKSPACE_TABS: readonly WorkspaceTab[] = [
  "projects",
  "invitations",
  "connections",
  "notifications",
] as const;

export const DISCIPLINE_CATEGORIES = [
  "Illustration",
  "Photography",
  "Music",
  "Writing",
  "Animation",
  "Video",
  "UI/UX",
] as const;

export type DisciplineCategory = (typeof DISCIPLINE_CATEGORIES)[number];

export type ProjectStatus = "Idea" | "InProgress" | "InReview" | "Completed" | "Archived";
export type Visibility = "Public" | "Private" | "Unlisted";
export type CollaboratorRole = "Owner" | "Collaborator" | "ClientReviewer" | "Viewer" | "Public";

export interface DisciplineFieldDefinition {
  key: string;
  label: string;
  type: "text" | "number";
  placeholder: string;
  required?: boolean;
}

export const DISCIPLINE_METADATA_FIELDS: Record<string, DisciplineFieldDefinition[]> = {
  Illustration: [
    { key: "software", label: "Software", type: "text", placeholder: "Procreate, Photoshop", required: true },
    { key: "style", label: "Style", type: "text", placeholder: "Vector, Concept Art", required: true },
    { key: "canvasWidth", label: "Canvas Width", type: "number", placeholder: "3840", required: true },
    { key: "canvasHeight", label: "Canvas Height", type: "number", placeholder: "2160", required: true },
    { key: "colorProfile", label: "Color Profile", type: "text", placeholder: "sRGB, Display P3" },
  ],
  Photography: [
    { key: "camera", label: "Camera Body", type: "text", placeholder: "Sony A7 IV", required: true },
    { key: "lens", label: "Lens", type: "text", placeholder: "24-70mm f/2.8", required: true },
    { key: "aperture", label: "Aperture", type: "text", placeholder: "f/2.8", required: true },
    { key: "iso", label: "ISO", type: "number", placeholder: "400", required: true },
    { key: "shutterSpeed", label: "Shutter Speed", type: "text", placeholder: "1/250s" },
    { key: "focalLength", label: "Focal Length", type: "text", placeholder: "50mm" },
  ],
  Music: [
    { key: "bpm", label: "BPM", type: "number", placeholder: "120", required: true },
    { key: "key", label: "Musical Key", type: "text", placeholder: "F# Minor", required: true },
    { key: "daw", label: "DAW", type: "text", placeholder: "Ableton Live, Logic Pro", required: true },
    { key: "genre", label: "Genre", type: "text", placeholder: "Ambient, Electronic", required: true },
    { key: "timeSignature", label: "Time Signature", type: "text", placeholder: "4/4" },
  ],
  Writing: [
    { key: "genre", label: "Genre", type: "text", placeholder: "Fiction, Screenplay", required: true },
    { key: "wordCountTarget", label: "Target Word Count", type: "number", placeholder: "5000", required: true },
    { key: "language", label: "Language", type: "text", placeholder: "English", required: true },
    { key: "format", label: "Format", type: "text", placeholder: "Essay, Script, Short Story", required: true },
  ],
  Animation: [
    { key: "fps", label: "Frame Rate (FPS)", type: "number", placeholder: "24", required: true },
    { key: "resolution", label: "Resolution", type: "text", placeholder: "1920x1080, 4K", required: true },
    { key: "software", label: "Animation Software", type: "text", placeholder: "Blender, After Effects", required: true },
    { key: "technique", label: "Technique", type: "text", placeholder: "2D Frame-by-Frame, 3D CGI", required: true },
  ],
  Video: [
    { key: "resolution", label: "Resolution", type: "text", placeholder: "4K, 1080p", required: true },
    { key: "aspectRatio", label: "Aspect Ratio", type: "text", placeholder: "16:9, 2.39:1", required: true },
    { key: "frameRate", label: "Frame Rate", type: "number", placeholder: "24", required: true },
    { key: "colorSpace", label: "Color Space", type: "text", placeholder: "Rec.709, S-Log3" },
    { key: "cameraRig", label: "Camera Rig", type: "text", placeholder: "RED Komodo, FX3" },
  ],
  "UI/UX": [
    { key: "designTool", label: "Design Tool", type: "text", placeholder: "Figma, Framer", required: true },
    { key: "platform", label: "Platform", type: "text", placeholder: "Web, iOS, Cross-platform", required: true },
    { key: "colorPalette", label: "Color Palette", type: "text", placeholder: "Warm Editorial" },
    { key: "typography", label: "Typography", type: "text", placeholder: "Instrument Serif / Plus Jakarta Sans" },
  ],
};

export interface WorkspaceProjectSummary {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  status: ProjectStatus;
  visibility: Visibility;
  creatorId: string;
  currentUserRole?: CollaboratorRole;
  metadata?: Record<string, unknown>;
  tags?: string[];
  updatedAt: string;
  createdAt: string;
  _count?: {
    assets?: number;
    versions?: number;
    comments?: number;
    likes?: number;
  };
}

export interface WorkspaceNotificationItem {
  id: string;
  userId: string;
  type: string;
  category: "interactions" | "collaborations" | "network" | "bookings" | "system";
  relatedProjectId: string | null;
  relatedUserId: string | null;
  relatedConnectionId: string | null;
  relatedVersionId: string | null;
  relatedCommentId: string | null;
  relatedBookingId: string | null;
  isRead: boolean;
  createdAt: string;
  relatedProject?: {
    id: string;
    title: string;
    category?: string;
    visibility?: Visibility;
    coverThumbnail?: string | null;
  } | null;
  relatedUser?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  } | null;
  relatedVersion?: {
    id: string;
    versionNumber: number;
    status?: string;
  } | null;
  relatedComment?: {
    id: string;
    content?: string;
    versionId?: string | null;
  } | null;
  relatedBooking?: {
    id: string;
    status?: string;
    serviceTitle?: string;
    requestedStartsAt?: string | null;
    confirmedStartsAt?: string | null;
  } | null;
}

export interface NotificationsFeedResponse {
  notifications: WorkspaceNotificationItem[];
  unreadCount: number;
  categoryCounts: {
    all: number;
    unread: number;
    interactions: number;
    collaborations: number;
    network: number;
    bookings: number;
  };
}

export interface CreateProjectInput {
  title: string;
  description?: string;
  category: string;
  status?: ProjectStatus;
  visibility?: Visibility;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

export function resolveWorkspaceTab(rawTab: string | null | undefined): WorkspaceTab {
  if (rawTab && WORKSPACE_TABS.includes(rawTab as WorkspaceTab)) {
    return rawTab as WorkspaceTab;
  }
  return "projects";
}

export function filterWorkspaceProjects(
  projects: WorkspaceProjectSummary[],
  filters: {
    currentUserId?: string | null;
    roleFilter?: string;
    statusFilter?: string;
    searchQuery?: string;
  }
): WorkspaceProjectSummary[] {
  const query = filters.searchQuery?.trim().toLowerCase() || "";
  return projects.filter((project) => {
    const effectiveRole =
      project.currentUserRole ||
      (filters.currentUserId && project.creatorId === filters.currentUserId ? "Owner" : "Collaborator");

    if (filters.roleFilter && filters.roleFilter !== "All" && effectiveRole !== filters.roleFilter) {
      return false;
    }
    if (filters.statusFilter && filters.statusFilter !== "All" && project.status !== filters.statusFilter) {
      return false;
    }
    if (query) {
      const hay = `${project.title} ${project.category} ${project.description || ""}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
}

export function buildNotificationProjectHref(notification: WorkspaceNotificationItem): string | null {
  const projectId = notification.relatedProjectId || notification.relatedProject?.id;
  if (!projectId) return null;

  const params = new URLSearchParams();
  const versionId = notification.relatedVersionId || notification.relatedComment?.versionId;

  if (versionId) {
    params.set("tab", "versions");
    params.set("versionId", versionId);
  } else if (notification.relatedCommentId) {
    params.set("tab", "discussion");
  }

  if (notification.relatedCommentId) {
    params.set("commentId", notification.relatedCommentId);
  }

  const qs = params.toString();
  return qs ? `/projects/${projectId}?${qs}` : `/projects/${projectId}`;
}

export async function fetchWorkspaceProjects(): Promise<WorkspaceProjectSummary[]> {
  const res = await fetch("/api/projects", { cache: "no-store" });
  return parseApiResponse<WorkspaceProjectSummary[]>(res, "Failed to load projects");
}

export async function createWorkspaceProject(
  input: CreateProjectInput
): Promise<WorkspaceProjectSummary> {
  const res = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<WorkspaceProjectSummary>(res, "Failed to create project");
}

export async function fetchNotificationsFeed(
  filter = "all",
  limit = 50
): Promise<NotificationsFeedResponse> {
  const params = new URLSearchParams({ filter, limit: String(limit) });
  const res = await fetch(`/api/notifications?${params.toString()}`, { cache: "no-store" });
  return parseApiResponse<NotificationsFeedResponse>(res, "Failed to load notifications");
}

export async function markNotificationRead(notificationId: string): Promise<unknown> {
  const res = await fetch(`/api/notifications/${encodeURIComponent(notificationId)}`, {
    method: "PATCH",
  });
  return parseApiResponse<unknown>(res, "Failed to mark notification as read");
}

export async function markAllNotificationsRead(): Promise<{ message: string }> {
  const res = await fetch("/api/notifications", { method: "POST" });
  return parseApiResponse<{ message: string }>(res, "Failed to mark all notifications as read");
}
