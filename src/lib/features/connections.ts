import { parseApiResponse } from "./api-client";

export interface ConnectionPeerUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio?: string | null;
  disciplines?: string[];
}

export interface ConnectionRecord {
  id: string;
  requesterId: string;
  receiverId: string;
  status: "Pending" | "Accepted" | "Rejected";
  createdAt: string;
  acceptedAt?: string | null;
  peer?: ConnectionPeerUser;
  requester?: ConnectionPeerUser;
  receiver?: ConnectionPeerUser;
}

export interface ConnectionRequestsSnapshot {
  incoming: ConnectionRecord[];
  outgoing: ConnectionRecord[];
}

export async function fetchConnectionRequests(
  direction: "incoming" | "outgoing" | "all" = "all"
): Promise<ConnectionRequestsSnapshot> {
  const res = await fetch(
    `/api/connections/requests?direction=${encodeURIComponent(direction)}`,
    { cache: "no-store" }
  );
  return parseApiResponse<ConnectionRequestsSnapshot>(
    res,
    "Failed to fetch connection requests"
  );
}

export async function fetchAcceptedConnections(): Promise<{
  connections: ConnectionRecord[];
}> {
  const res = await fetch("/api/connections", { cache: "no-store" });
  return parseApiResponse<{ connections: ConnectionRecord[] }>(
    res,
    "Failed to fetch connections"
  );
}

export async function sendConnectionRequest(
  receiverId: string
): Promise<ConnectionRecord> {
  const res = await fetch("/api/connections", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ receiverId }),
  });
  return parseApiResponse<ConnectionRecord>(res, "Failed to send connection request");
}

export async function respondToConnection(
  connectionId: string,
  action: "accept" | "reject"
): Promise<ConnectionRecord> {
  const res = await fetch(`/api/connections/${encodeURIComponent(connectionId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  return parseApiResponse<ConnectionRecord>(
    res,
    `Failed to ${action} connection request`
  );
}

export async function deleteConnection(
  connectionId: string
): Promise<{ deleted: boolean }> {
  const res = await fetch(`/api/connections/${encodeURIComponent(connectionId)}`, {
    method: "DELETE",
  });
  return parseApiResponse<{ deleted: boolean }>(res, "Failed to remove connection");
}
