export type ProjectStatus = "Idea" | "InProgress" | "InReview" | "Completed";
export type Visibility = "Private" | "CollaboratorsOnly" | "Public";
export type CollaboratorRole = "Owner" | "Collaborator" | "ClientReviewer";
export type VersionStatus = "Draft" | "Approved" | "Final" | "Rejected";

export interface ProjectAsset {
  id: string;
  projectId: string;
  versionId: string | null;
  fileName: string;
  mimeType: string;
  fileSize: number;
  thumbnailPath?: string | null;
  downloadUrl?: string;
  createdAt: string;
  uploader?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

export interface ProjectVersion {
  id: string;
  projectId: string;
  versionNumber: number;
  status: VersionStatus;
  createdAt: string;
  createdById: string;
  createdBy?: {
    id: string;
    username: string;
    displayName: string;
  };
  assets?: ProjectAsset[];
  comments?: any[];
  notes?: string;
}

export interface ProjectCollaborator {
  id: string;
  projectId: string;
  userId: string;
  role: CollaboratorRole;
  status?: string;
  invitedAt?: string;
  acceptedAt?: string | null;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    bio?: string | null;
  };
}

export interface ProjectCreator {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  disciplines?: string[];
  socialLinks?: Record<string, any> | null;
}

export interface ProjectDetailData {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: ProjectStatus;
  visibility: Visibility;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  creatorId: string;
  creator: ProjectCreator;
  collaborators: ProjectCollaborator[];
  assets: ProjectAsset[];
  versions: ProjectVersion[];
  tags: string[];
  hasLiked?: boolean;
  isPortfolioFeatured?: boolean;
  userRole?: CollaboratorRole | null;
  _count?: {
    likes?: number;
    comments?: number;
  };
}

export interface CommentAuthor {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface ProjectComment {
  id: string;
  projectId: string;
  versionId: string | null;
  parentId: string | null;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
  likeCount: number;
  hasLiked: boolean;
  replies?: ProjectComment[];
  replyCount?: number;
}

export interface RelatedProjectItem {
  id: string;
  title: string;
  category: string;
  coverImage: string;
  likes: number;
  description?: string;
  creator: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  };
}

// Category fallback imagery from repository public artwork
export const CATEGORY_ARTWORK_MAP: Record<string, string> = {
  Illustration: "/images/landing/artwork-illustration.jpg",
  Photography: "/images/landing/artwork-photography.jpg",
  "Graphic Design": "/images/landing/artwork-graphic-design.jpg",
  Design: "/images/landing/artwork-graphic-design.jpg",
  Animation: "/images/landing/artwork-animation.jpg",
  "UI/UX": "/images/landing/artwork-uiux.jpg",
  Writing: "/images/landing/artwork-writing.jpg",
  Ceramics: "/images/landing/artwork-ceramics.jpg",
  Sculpture: "/images/landing/artwork-ceramics.jpg",
  "Digital Art": "/images/landing/artwork-digital-art.jpg",
  Music: "/images/landing/artwork-digital-art.jpg",
  Video: "/images/landing/artwork-animation.jpg",
};

export function getCategoryArtwork(category?: string | null): string {
  if (!category) return "/images/landing/artwork-illustration.jpg";
  return (
    CATEGORY_ARTWORK_MAP[category] ||
    CATEGORY_ARTWORK_MAP["Illustration"] ||
    "/images/landing/artwork-illustration.jpg"
  );
}

export function formatRelativeDate(isoDate: string): string {
  try {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(isoDate).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Recently";
  }
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}
