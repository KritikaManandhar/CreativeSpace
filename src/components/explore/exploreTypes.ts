export type ExploreContentType =
  | "all"
  | "creators"
  | "projects"
  | "posts"
  | "services";

export type ExploreDiscipline =
  | "All"
  | "Illustration"
  | "Photography"
  | "Graphic Design"
  | "UI/UX Design"
  | "Digital Art"
  | "Animation"
  | "Writing"
  | "Ceramics & Print";

export const EXPLORE_DISCIPLINES: ExploreDiscipline[] = [
  "All",
  "Illustration",
  "Photography",
  "Graphic Design",
  "UI/UX Design",
  "Digital Art",
  "Animation",
  "Writing",
  "Ceramics & Print",
];

export const EXPLORE_CONTENT_TABS: Array<{
  id: ExploreContentType;
  label: string;
}> = [
  { id: "all", label: "All Directory" },
  { id: "creators", label: "Creators" },
  { id: "projects", label: "Projects & Artwork" },
  { id: "posts", label: "Studio Posts" },
  { id: "services", label: "Services" },
];

export interface ExploreProjectItem {
  id: string;
  title: string;
  description?: string | null;
  discipline: string;
  coverUrl?: string | null;
  coverAlt?: string;
  tags?: string[];
  likesCount?: number;
  commentsCount?: number;
  versionTag?: string;
  isFeatured?: boolean;
  creator: {
    id?: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    disciplines?: string[];
  };
  createdAt?: string;
}

export interface ExploreCreatorItem {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  disciplines: string[];
  projectsCount?: number;
  followersCount?: number;
  servicesCount?: number;
  isAvailableForWork?: boolean;
  location?: string | null;
}

export interface ExplorePostItem {
  id: string;
  kind: "Process Log" | "Critique Request" | "Milestone" | "Studio Note" | string;
  title?: string;
  content: string;
  discipline?: string;
  coverUrl?: string | null;
  coverAlt?: string;
  tags?: string[];
  likesCount?: number;
  commentsCount?: number;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatarUrl?: string | null;
  createdAt?: string;
}

export interface ExploreServiceItem {
  id: string;
  title: string;
  shortDescription: string;
  category: string;
  coverUrl?: string | null;
  coverAlt?: string;
  priceDisplay: string;
  pricingModel?: "Fixed" | "Hourly" | "Starting At" | string;
  estimatedDuration: string;
  availabilityStatus: "Available" | "Limited Slots" | "Booked";
  creatorUsername: string;
  creatorDisplayName: string;
  creatorAvatarUrl?: string | null;
}
