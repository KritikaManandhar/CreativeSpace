import { parseApiResponse } from "./api-client";

export interface InvitationUserSummary {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface ProjectInvitationItem {
  id: string;
  projectId: string;
  userId: string;
  role: "Collaborator" | "ClientReviewer" | "Owner";
  status: "Pending" | "Accepted" | "Rejected" | "Cancelled";
  invitedAt: string;
  acceptedAt?: string | null;
  project: {
    id: string;
    title: string;
    category: string;
    visibility: "Public" | "Private" | "Unlisted";
    coverThumbnail?: string | null;
    creator?: InvitationUserSummary;
  };
  invitedBy?: InvitationUserSummary | null;
  user?: InvitationUserSummary | null;
}

export interface InvitationsSnapshot {
  incoming: ProjectInvitationItem[];
  outgoing: ProjectInvitationItem[];
  counts?: {
    incomingPending: number;
    outgoingPending: number;
  };
}

export async function fetchProjectInvitations(): Promise<InvitationsSnapshot> {
  const res = await fetch("/api/invitations", { cache: "no-store" });
  return parseApiResponse<InvitationsSnapshot>(res, "Failed to load invitations");
}

export async function respondToProjectInvitation(
  projectId: string,
  userId: string,
  action: "accept" | "reject" | "cancel"
): Promise<unknown> {
  const res = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/collaborators/${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    }
  );
  return parseApiResponse<unknown>(res, `Failed to ${action} invitation`);
}
