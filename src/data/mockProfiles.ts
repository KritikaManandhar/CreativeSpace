import { sanitizeExternalUrl } from "@/lib/features/profile";

export type ProfilePerspective = "owner" | "visitor";

export type CoverThemeId =
  | "conservatory"
  | "travertine"
  | "solstice"
  | "celestial"
  | "botanical";

export interface CoverPresetOption {
  id: CoverThemeId;
  label: string;
  subtitle: string;
  imageUrl: string | null;
  gradient: string;
}

export interface AvatarPresetOption {
  id: string;
  label: string;
  imageUrl: string | null;
}

export interface ProfileSocialUser {
  id: string;
  username: string;
  displayName: string;
  roleTitle: string;
  initials: string;
  avatarTone: string;
  avatarAccent: string;
  avatarUrl?: string | null;
  isFollowing: boolean;
}

export interface ProfileProjectVersion {
  version: string;
  label: string;
  date: string;
  status: "Draft" | "In Review" | "Approved" | "Final";
  note: string;
}

export interface ProjectGalleryAsset {
  id: string;
  projectId?: string;
  mediaType: "image" | "video" | "audio" | "document";
  mediaUrl: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  posterUrl?: string;
  caption?: string;
}

export interface ProjectContributorItem {
  id?: string;
  name: string;
  role: string;
  username?: string;
  url?: string | null;
  urlLabel?: string | null;
  avatarUrl?: string | null;
}

export interface ProfileProjectItem {
  id: string;
  title: string;
  description: string;
  discipline: string;
  status: "Completed" | "InProgress" | "InReview";
  versionTag: string;
  featured: boolean;
  coverUrl: string;
  coverAlt: string;
  tags: string[];
  tools: string[];
  updatedAt: string;
  likeCount: number;
  commentCount: number;
  collaborators: Array<{
    name: string;
    username: string;
    initials: string;
    tone: string;
    accent: string;
    role: string;
    url?: string | null;
    urlLabel?: string | null;
  }>;
  versions: ProfileProjectVersion[];
  // Structured creator management fields
  isPublished?: boolean;
  fullDescription?: string;
  background?: string;
  objectives?: string;
  creativeApproach?: string;
  galleryAssets?: ProjectGalleryAsset[];
  skills?: string[];
  projectType?: "Personal" | "Client" | "Academic";
  style?: string;
  duration?: string;
  completionDate?: string;
  canvasDimensions?: string;
  colorProfile?: string;
  externalUrl?: string;
  externalUrlLabel?: string;
  contributors?: ProjectContributorItem[];
  metadata?: Record<string, unknown> | null;
}

export type PostKind = "Studio Note" | "Process Log" | "Critique Request" | "Milestone";

export interface ProfilePostComment {
  id: string;
  authorName: string;
  authorHandle: string;
  initials: string;
  tone: string;
  accent: string;
  createdAt: string;
  content: string;
}

export interface ProfilePostItem {
  id: string;
  kind: PostKind;
  title?: string;
  content: string;
  createdAt: string;
  projectRef?: {
    id: string;
    title: string;
    versionTag?: string;
  };
  imageUrl?: string | null;
  imageAlt?: string;
  tags: string[];
  likeCount: number;
  comments: ProfilePostComment[];
}

export type ServiceAvailabilityStatus = "Available" | "Limited Slots" | "Paused";
export type ServicePricingModel = "Starting at" | "Fixed price";

export interface ProfileServiceItem {
  id: string;
  title: string;
  category: string;
  shortDescription: string;
  fullDescription: string;
  coverUrl: string;
  coverAlt: string;
  pricingModel: ServicePricingModel;
  priceAmount: number;
  currency: string;
  estimatedDuration: string;
  availabilityStatus: ServiceAvailabilityStatus;
  availabilityDetail: string;
  sessionFormat: string;
  minNotice: string;
  revisionsIncluded: string;
  deliverables: string[];
  isPublished: boolean;
}

export type ProfileIdeaStage =
  | "Spark"
  | "Concept & Moodboard"
  | "Active Production"
  | "Review & Polish"
  | "Completed";

export interface ProfileIdeaContributor {
  name: string;
  username: string;
  initials: string;
  tone: string;
  accent: string;
  role: string;
}

export interface ProfileIdeaItem {
  id: string;
  title: string;
  spark: string;
  discipline: string;
  stage: ProfileIdeaStage;
  stageProgress: number;
  leadName: string;
  leadUsername: string;
  contributors: ProfileIdeaContributor[];
  tags: string[];
  lastUpdate: string;
  nextMilestone: string;
}

export interface UserProfileRecord {
  id: string;
  username: string;
  displayName: string;
  headline: string;
  bio: string;
  location: string;
  timezone: string;
  joinedAt: string;
  openToCollab: boolean;
  studioStatus: string;
  avatarUrl: string | null;
  avatarInitials: string;
  avatarTone: string;
  avatarAccent: string;
  coverUrl: string | null;
  coverPreset: CoverThemeId;
  disciplines: string[];
  tools: string[];
  socialLinks: Record<string, string>;
  stats: {
    projects: number;
    services: number;
    posts: number;
    ideas: number;
    followers: number;
    following: number;
    totalLikes: number;
    collaborations: number;
  };
  defaultPerspective: ProfilePerspective;
  projects: ProfileProjectItem[];
  services: ProfileServiceItem[];
  posts: ProfilePostItem[];
  ideas: ProfileIdeaItem[];
  followersList: ProfileSocialUser[];
  followingList: ProfileSocialUser[];
}

export const COVER_PRESETS: CoverPresetOption[] = [
  {
    id: "conservatory",
    label: "Conservatory",
    subtitle: "Painted twilight glasshouse",
    imageUrl: "/images/landing/artwork-animation.jpg",
    gradient: "linear-gradient(135deg, #203B35 0%, #304D45 52%, #504E63 100%)",
  },
  {
    id: "travertine",
    label: "Travertine Court",
    subtitle: "Sunlit stone arches",
    imageUrl: "/images/landing/artwork-photography.jpg",
    gradient: "linear-gradient(135deg, #3A4741 0%, #7C796E 55%, #C8BDE0 100%)",
  },
  {
    id: "solstice",
    label: "Solstice Grid",
    subtitle: "Editorial exhibition print",
    imageUrl: "/images/landing/artwork-graphic-design.jpg",
    gradient: "linear-gradient(135deg, #203B35 0%, #5B7365 55%, #C8BDE0 100%)",
  },
  {
    id: "celestial",
    label: "Celestial Orbit",
    subtitle: "Deep forest & lavender mist",
    imageUrl: null,
    gradient:
      "radial-gradient(circle at 78% 24%, rgba(200, 189, 224, 0.36) 0%, transparent 45%), radial-gradient(circle at 22% 80%, rgba(157, 181, 165, 0.32) 0%, transparent 48%), linear-gradient(135deg, #162A26 0%, #203B35 55%, #2D4942 100%)",
  },
  {
    id: "botanical",
    label: "Botanical Sage",
    subtitle: "Soft morning sage & linen",
    imageUrl: null,
    gradient:
      "radial-gradient(circle at 26% 30%, rgba(246, 243, 235, 0.25) 0%, transparent 46%), radial-gradient(circle at 82% 72%, rgba(200, 189, 224, 0.28) 0%, transparent 50%), linear-gradient(135deg, #2B4B43 0%, #4E6D61 52%, #7D9989 100%)",
  },
];

export const AVATAR_PRESETS: AvatarPresetOption[] = [
  {
    id: "monogram",
    label: "Monogram Crest",
    imageUrl: null,
  },
  {
    id: "illustration",
    label: "Botanical Orbit",
    imageUrl: "/images/landing/artwork-illustration.jpg",
  },
  {
    id: "ceramics",
    label: "Kiln & Print",
    imageUrl: "/images/landing/artwork-ceramics.jpg",
  },
  {
    id: "digital",
    label: "Celadon Orb",
    imageUrl: "/images/landing/artwork-digital-art.jpg",
  },
  {
    id: "photography",
    label: "Travertine Light",
    imageUrl: "/images/landing/artwork-photography.jpg",
  },
];

export const PROFILE_DISCIPLINE_OPTIONS = [
  "Illustration",
  "Photography",
  "Graphic Design",
  "UI/UX",
  "Digital Art",
  "Animation",
  "Writing",
  "Ceramics & Print",
  "Music & Audio",
  "Creative Direction",
] as const;

export const SOCIAL_LINK_FIELDS = [
  { key: "website", label: "Personal Website", placeholder: "https://studio-anya.example" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/handle" },
  { key: "twitter", label: "X / Twitter", placeholder: "https://x.com/handle" },
  { key: "behance", label: "Behance", placeholder: "https://behance.net/handle" },
  { key: "dribbble", label: "Dribbble", placeholder: "https://dribbble.com/handle" },
  { key: "github", label: "GitHub", placeholder: "https://github.com/handle" },
] as const;

/**
 * Validates image sources used in local preview state.
 * Permits local /images/... assets, browser blob:/data:image raster uploads,
 * and http:/https: URLs while blocking SVG data URIs or script protocols.
 */
export function sanitizePreviewImageUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/images/")) return trimmed;
  if (trimmed.startsWith("blob:")) return trimmed;
  if (/^data:image\/(png|jpe?g|webp|gif|avif);base64,/i.test(trimmed)) {
    return trimmed;
  }
  return sanitizeExternalUrl(trimmed);
}

export function formatServicePrice(service: Pick<ProfileServiceItem, "priceAmount" | "currency">): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: service.currency || "USD",
    maximumFractionDigits: 0,
  }).format(service.priceAmount);
}

export function deriveInitials(displayName: string): string {
  const words = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "CS";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

const SHARED_NETWORK_USERS: ProfileSocialUser[] = [
  {
    id: "u-kenji",
    username: "kenji_film",
    displayName: "Kenji Sato",
    roleTitle: "Architectural Photographer",
    initials: "KS",
    avatarTone: "#3B4A44",
    avatarAccent: "#9DB5A5",
    avatarUrl: "/images/landing/artwork-photography.jpg",
    isFollowing: true,
  },
  {
    id: "u-elena",
    username: "elena_type",
    displayName: "Elena Rostova",
    roleTitle: "Visual Systems Designer",
    initials: "ER",
    avatarTone: "#2D3C38",
    avatarAccent: "#F6F3EB",
    avatarUrl: null,
    isFollowing: true,
  },
  {
    id: "u-mateo",
    username: "mateo_ux",
    displayName: "Mateo Silva",
    roleTitle: "Product & Audio Designer",
    initials: "MS",
    avatarTone: "#4A5952",
    avatarAccent: "#C8BDE0",
    avatarUrl: "/images/landing/artwork-uiux.jpg",
    isFollowing: false,
  },
  {
    id: "u-amara",
    username: "amara_3d",
    displayName: "Amara Okafor",
    roleTitle: "Sculptural Digital Artist",
    initials: "AO",
    avatarTone: "#203B35",
    avatarAccent: "#9DB5A5",
    avatarUrl: "/images/landing/artwork-digital-art.jpg",
    isFollowing: true,
  },
  {
    id: "u-hannah",
    username: "hannah_prose",
    displayName: "Hannah Lindqvist",
    roleTitle: "Essayist & Print Editor",
    initials: "HL",
    avatarTone: "#344640",
    avatarAccent: "#E7DFD1",
    avatarUrl: "/images/landing/artwork-writing.jpg",
    isFollowing: false,
  },
];

const ANYA_PROJECTS: ProfileProjectItem[] = [
  {
    id: "proj-nocturne-flora",
    title: "Nocturne Flora & Orbit",
    description:
      "Gouache and fine ink botanical study pairing eucalyptus stems with quiet celestial orbital lines on cotton rag.",
    discipline: "Illustration",
    status: "Completed",
    versionTag: "v3.0 · Final",
    featured: true,
    coverUrl: "/images/landing/artwork-illustration.jpg",
    coverAlt: "Botanical eucalyptus gouache illustration with crescent moon and orbital arcs",
    tags: ["gouache", "botanical", "editorial"],
    tools: ["Gouache & Ink", "Cotton Rag 300gsm", "Procreate"],
    updatedAt: "Nov 18, 2026",
    likeCount: 284,
    commentCount: 18,
    collaborators: [
      {
        name: "Elena Rostova",
        username: "elena_type",
        initials: "ER",
        tone: "#2D3C38",
        accent: "#F6F3EB",
        role: "Art Director",
        url: "https://elenarostova.design",
        urlLabel: "View Portfolio",
      },
    ],
    versions: [
      {
        version: "v1.0",
        label: "Pencil Blocking & Silhouette",
        date: "Nov 02",
        status: "Draft",
        note: "Initial botanical leaf rhythm and crescent focal point.",
      },
      {
        version: "v2.0",
        label: "Sage Wash & Lavender Orbit",
        date: "Nov 10",
        status: "In Review",
        note: "Balanced deep forest leaf density against lavender hairline rings.",
      },
      {
        version: "v3.0",
        label: "Exhibition Plate",
        date: "Nov 18",
        status: "Final",
        note: "High-resolution 600 DPI scan color-graded for print.",
      },
    ],
  },
  {
    id: "proj-conservatory-dusk",
    title: "Conservatory at Dusk — Frame 042",
    description:
      "Key background painting for an animated short exploring a warm glasshouse studio glowing under lavender twilight.",
    discipline: "Animation",
    status: "InReview",
    versionTag: "v2.4 · Review",
    featured: true,
    coverUrl: "/images/landing/artwork-animation.jpg",
    coverAlt: "Painted 2D twilight hillside conservatory glowing with warm studio light",
    tags: ["background-art", "lighting", "2d-film"],
    tools: ["Photoshop", "TVPaint", "Gouache Brushes"],
    updatedAt: "Nov 22, 2026",
    likeCount: 412,
    commentCount: 27,
    collaborators: [
      {
        name: "Rohan Verma",
        username: "rohan_anim",
        initials: "RV",
        tone: "#27413B",
        accent: "#C8BDE0",
        role: "Director",
        url: "https://vimeo.com/rohanverma",
        urlLabel: "View Contribution",
      },
      {
        name: "Mateo Silva",
        username: "mateo_ux",
        initials: "MS",
        tone: "#4A5952",
        accent: "#C8BDE0",
        role: "Sound Design",
      },
    ],
    versions: [
      {
        version: "v1.0",
        label: "Value & Dusk Sky Thumbnail",
        date: "Nov 08",
        status: "Draft",
        note: "Testing lantern warmth against dusk hillside greens.",
      },
      {
        version: "v2.4",
        label: "Firefly Pass & Glass Reflections",
        date: "Nov 22",
        status: "In Review",
        note: "Added subtle firefly trails and lavender cloud rim light.",
      },
    ],
  },
  {
    id: "proj-solstice-biennial",
    title: "Solstice Biennial Poster Folio",
    description:
      "Modular Swiss-grid print series uniting architectural arches, celestial crescents, and risograph ink textures.",
    discipline: "Graphic Design",
    status: "Completed",
    versionTag: "v2.0 · Final",
    featured: false,
    coverUrl: "/images/landing/artwork-graphic-design.jpg",
    coverAlt: "Minimalist Swiss-editorial geometric print featuring deep green arch and lavender crescent",
    tags: ["risograph", "print", "swiss-grid"],
    tools: ["InDesign", "Risograph", "Munken Cream"],
    updatedAt: "Oct 29, 2026",
    likeCount: 342,
    commentCount: 14,
    collaborators: [
      {
        name: "Elena Rostova",
        username: "elena_type",
        initials: "ER",
        tone: "#2D3C38",
        accent: "#F6F3EB",
        role: "Co-Designer",
      },
    ],
    versions: [
      {
        version: "v1.0",
        label: "Grid Proportions",
        date: "Oct 14",
        status: "Draft",
        note: "12-column geometric construction and arch tension.",
      },
      {
        version: "v2.0",
        label: "3-Color Riso Proof",
        date: "Oct 29",
        status: "Final",
        note: "Approved Hunter Green, Mist Sage, and Violet Soy inks.",
      },
    ],
  },
  {
    id: "proj-stoneware-linocut",
    title: "Kiln & Botanical Linocut Edition",
    description:
      "Collaborative tactile table study pairing speckled stoneware glazes with hand-carved botanical relief prints.",
    discipline: "Ceramics & Print",
    status: "Completed",
    versionTag: "v1.2 · Approved",
    featured: false,
    coverUrl: "/images/landing/artwork-ceramics.jpg",
    coverAlt: "Hand-thrown cream and forest-green stoneware vessels beside a botanical linocut print",
    tags: ["linocut", "ceramics", "craft"],
    tools: ["Japanese Vinyl Block", "Cranfield Ink", "Deckle Cotton"],
    updatedAt: "Oct 12, 2026",
    likeCount: 209,
    commentCount: 11,
    collaborators: [],
    versions: [
      {
        version: "v1.0",
        label: "Carved Key Block Proof",
        date: "Oct 04",
        status: "Draft",
        note: "First hand-burnished impression on deckled rag paper.",
      },
      {
        version: "v1.2",
        label: "Edition of 25 Signed",
        date: "Oct 12",
        status: "Approved",
        note: "Paired with moss-glazed stoneware forms for studio open house.",
      },
    ],
  },
  {
    id: "proj-field-chapbook",
    title: "Notes on Quiet Light — Chapbook",
    description:
      "Hand-bound studio notebook and essay anthology documenting dawn walks, ink washes, and unhurried craft.",
    discipline: "Writing",
    status: "InProgress",
    versionTag: "v1.5 · Draft",
    featured: false,
    coverUrl: "/images/landing/artwork-writing.jpg",
    coverAlt: "Open cloth-bound chapbook pages on warm linen beside eucalyptus sprig and brass pen",
    tags: ["essays", "bookbinding", "sketchbook"],
    tools: ["Fountain Pen", "Smyth-Sewn Linen", "Editorial Layout"],
    updatedAt: "Nov 14, 2026",
    likeCount: 164,
    commentCount: 9,
    collaborators: [
      {
        name: "Hannah Lindqvist",
        username: "hannah_prose",
        initials: "HL",
        tone: "#344640",
        accent: "#E7DFD1",
        role: "Editor",
      },
    ],
    versions: [
      {
        version: "v1.0",
        label: "Manuscript Notes",
        date: "Nov 01",
        status: "Draft",
        note: "Four essays compiled from winter studio mornings.",
      },
      {
        version: "v1.5",
        label: "Signature Sewing Dummy",
        date: "Nov 14",
        status: "In Review",
        note: "Testing margin rhythm and paper grain direction.",
      },
    ],
  },
  {
    id: "proj-celadon-studies",
    title: "Celadon Forms & Soft Orbit",
    description:
      "Material lighting exploration translating botanical arch silhouettes into matte ceramic and frosted glass forms.",
    discipline: "Digital Art",
    status: "Completed",
    versionTag: "v2.0 · Final",
    featured: false,
    coverUrl: "/images/landing/artwork-digital-art.jpg",
    coverAlt: "Matte sage arches balancing a frosted lavender orb above obsidian stone",
    tags: ["lighting", "color-study", "materiality"],
    tools: ["Blender", "Octane", "ACEScg"],
    updatedAt: "Sep 28, 2026",
    likeCount: 318,
    commentCount: 21,
    collaborators: [
      {
        name: "Amara Okafor",
        username: "amara_3d",
        initials: "AO",
        tone: "#203B35",
        accent: "#9DB5A5",
        role: "Lighting Mentor",
      },
    ],
    versions: [
      {
        version: "v1.0",
        label: "Clay Silhouette Study",
        date: "Sep 19",
        status: "Draft",
        note: "Explored nested arches and negative space balance.",
      },
      {
        version: "v2.0",
        label: "Frosted Lavender Shader",
        date: "Sep 28",
        status: "Final",
        note: "Dialed subsurface scatter on matte celadon ceramic.",
      },
    ],
  },
];

const ANYA_POSTS: ProfilePostItem[] = [
  {
    id: "post-anya-1",
    kind: "Process Log",
    title: "Why I start every celestial illustration with dry charcoal",
    content:
      "Before touching gouache or opening Procreate, I block out three thumbnail compositions on newsprint with dry willow charcoal. Working at postcard scale makes negative space honest—if the orbital arc doesn't carry weight at 4 inches, no amount of fine linework will save it later.",
    createdAt: "2 days ago · Nov 24",
    projectRef: {
      id: "proj-nocturne-flora",
      title: "Nocturne Flora & Orbit",
      versionTag: "v3.0",
    },
    imageUrl: "/images/landing/artwork-illustration.jpg",
    imageAlt: "Finished gouache study of eucalyptus stems and crescent moon",
    tags: ["process", "composition", "gouache"],
    likeCount: 68,
    comments: [
      {
        id: "c-1",
        authorName: "Elena Rostova",
        authorHandle: "elena_type",
        initials: "ER",
        tone: "#2D3C38",
        accent: "#F6F3EB",
        createdAt: "1 day ago",
        content:
          "That rule of testing balance at thumbnail size saved our Solstice poster grid too—the quiet gap around the moon really breathes here.",
      },
      {
        id: "c-2",
        authorName: "Kenji Sato",
        authorHandle: "kenji_film",
        initials: "KS",
        tone: "#3B4A44",
        accent: "#9DB5A5",
        createdAt: "18 hours ago",
        content: "The shift between matte pine green and the pale sage stems feels so tactile.",
      },
    ],
  },
  {
    id: "post-anya-2",
    kind: "Critique Request",
    title: "Lighting balance on Conservatory Frame 042 — warm amber vs twilight sky",
    content:
      "Looking for gentle eyes on the v2.4 background pass before we lock final cel compositing. Does the warm lantern interior hold the viewer's eye, or should I soften the lavender cloud highlights on the upper right cypresses?",
    createdAt: "5 days ago · Nov 21",
    projectRef: {
      id: "proj-conservatory-dusk",
      title: "Conservatory at Dusk — Frame 042",
      versionTag: "v2.4",
    },
    imageUrl: "/images/landing/artwork-animation.jpg",
    imageAlt: "Twilight hillside glass conservatory frame",
    tags: ["critique", "color-key", "animation"],
    likeCount: 54,
    comments: [
      {
        id: "c-3",
        authorName: "Rohan Verma",
        authorHandle: "rohan_anim",
        initials: "RV",
        tone: "#27413B",
        accent: "#C8BDE0",
        createdAt: "4 days ago",
        content:
          "Keep the lavender rim! It stops the dark cypresses from feeling heavy and frames the warm doorway cleanly.",
      },
    ],
  },
  {
    id: "post-anya-3",
    kind: "Studio Note",
    title: "Morning desk: mixing sage gouache with a touch of raw umber",
    content:
      "A tiny drop of raw umber warms synthetic green pigment just enough so it feels like dried eucalyptus under morning window light. Keeping a physical swatch index beside the scanner has cut color-proofing time in half this autumn.",
    createdAt: "Nov 12, 2026",
    imageUrl: "/images/landing/artwork-writing.jpg",
    imageAlt: "Open studio journal on linen beside eucalyptus leaves",
    tags: ["color-notes", "pigments", "studio"],
    likeCount: 91,
    comments: [],
  },
  {
    id: "post-anya-4",
    kind: "Milestone",
    title: "Completed the 25-print Kiln & Botanical linocut collaboration",
    content:
      "Signed and numbered the final sheet of our autumn collaborative edition. Pairing flat relief ink with wheel-thrown speckled stoneware reminded me how much screens benefit from stepping back to physical paper grain.",
    createdAt: "Oct 18, 2026",
    projectRef: {
      id: "proj-stoneware-linocut",
      title: "Kiln & Botanical Linocut Edition",
      versionTag: "v1.2",
    },
    imageUrl: null,
    tags: ["milestone", "printmaking", "collaboration"],
    likeCount: 112,
    comments: [
      {
        id: "c-4",
        authorName: "Hannah Lindqvist",
        authorHandle: "hannah_prose",
        initials: "HL",
        tone: "#344640",
        accent: "#E7DFD1",
        createdAt: "Oct 19",
        content: "Congratulations! The deckled cotton paper edges look museum-grade.",
      },
    ],
  },
];

const KENJI_PROJECTS: ProfileProjectItem[] = [
  {
    id: "proj-travertine-court",
    title: "Silence at Travertine Court",
    description:
      "Medium-format 6×7 architectural study capturing first light across limestone arches and still water.",
    discipline: "Photography",
    status: "Completed",
    versionTag: "v2.0 · Final",
    featured: true,
    coverUrl: "/images/landing/artwork-photography.jpg",
    coverAlt: "Travertine stone arches reflected in a still courtyard pool",
    tags: ["medium-format", "architecture", "natural-light"],
    tools: ["Mamiya 7II", "Portra 160", "Epson V850"],
    updatedAt: "Nov 19, 2026",
    likeCount: 196,
    commentCount: 12,
    collaborators: [],
    versions: [
      {
        version: "v1.0",
        label: "Contact Sheet Selects",
        date: "Nov 05",
        status: "Draft",
        note: "Selected frame #07 from roll 14 for architectural symmetry.",
      },
      {
        version: "v2.0",
        label: "Final Silver & Pigment Print",
        date: "Nov 19",
        status: "Final",
        note: "Gentle highlight roll-off preserved in travertine columns.",
      },
    ],
  },
  {
    id: "proj-quiet-cities-zine",
    title: "Field Notes on Quiet Cities",
    description:
      "Photo essay chapbook pairing architectural shadows with short meditations on acoustic calm.",
    discipline: "Writing",
    status: "InReview",
    versionTag: "v1.3 · Review",
    featured: true,
    coverUrl: "/images/landing/artwork-writing.jpg",
    coverAlt: "Cloth-bound chapbook spread with brass fountain pen",
    tags: ["photo-essay", "print", "architecture"],
    tools: ["35mm Film", "InDesign", "Fountain Pen"],
    updatedAt: "Nov 10, 2026",
    likeCount: 148,
    commentCount: 8,
    collaborators: [
      {
        name: "Hannah Lindqvist",
        username: "hannah_prose",
        initials: "HL",
        tone: "#344640",
        accent: "#E7DFD1",
        role: "Co-Author",
      },
    ],
    versions: [
      {
        version: "v1.3",
        label: "Sequence Proof",
        date: "Nov 10",
        status: "In Review",
        note: "Balancing text spreads against full-bleed courtyard plates.",
      },
    ],
  },
  {
    id: "proj-kiln-light",
    title: "Morning Kiln Studio Series",
    description:
      "Natural window light portraits of ceramic studios and hand-thrown stoneware vessels in Kyoto.",
    discipline: "Photography",
    status: "Completed",
    versionTag: "v1.0 · Final",
    featured: false,
    coverUrl: "/images/landing/artwork-ceramics.jpg",
    coverAlt: "Ceramic stoneware vessels bathed in soft morning window light",
    tags: ["documentary", "craft", "daylight"],
    tools: ["Leica M6", "Summicron 50mm", "Ilford Delta 400"],
    updatedAt: "Oct 21, 2026",
    likeCount: 173,
    commentCount: 6,
    collaborators: [],
    versions: [
      {
        version: "v1.0",
        label: "Curated Studio Series",
        date: "Oct 21",
        status: "Final",
        note: "12 archival plates delivered to maker portfolio.",
      },
    ],
  },
];

const KENJI_POSTS: ProfilePostItem[] = [
  {
    id: "post-kenji-1",
    kind: "Studio Note",
    title: "Waiting twenty minutes for wind to leave the courtyard pool",
    content:
      "With medium-format architecture, patience does more work than gear. At 6:40 AM a single breeze ripples the arch reflection into noise; by 7:05 AM the travertine wall blocks the draft and the pool turns into liquid glass.",
    createdAt: "3 days ago · Nov 23",
    projectRef: {
      id: "proj-travertine-court",
      title: "Silence at Travertine Court",
      versionTag: "v2.0",
    },
    imageUrl: "/images/landing/artwork-photography.jpg",
    imageAlt: "Still travertine arch reflection",
    tags: ["field-notes", "6x7", "architecture"],
    likeCount: 79,
    comments: [
      {
        id: "ck-1",
        authorName: "Anya Sharma",
        authorHandle: "anya_art",
        initials: "AS",
        tone: "#203B35",
        accent: "#C8BDE0",
        createdAt: "2 days ago",
        content: "The reflection holds almost like an etching. Worth every minute of waiting.",
      },
    ],
  },
  {
    id: "post-kenji-2",
    kind: "Process Log",
    title: "Testing uncoated cotton papers for our Kyoto essay chapbook",
    content:
      "Coated stock makes highlights feel clinical. Moving to 120gsm uncoated cotton warms the limestone whites and gives shadow gradients a velvety quietness.",
    createdAt: "Nov 11, 2026",
    tags: ["print-production", "paper", "zine"],
    likeCount: 46,
    comments: [],
  },
];

const ELENA_PROJECTS: ProfileProjectItem[] = [
  {
    id: "proj-elena-solstice",
    title: "Solstice Biennial Identity System",
    description:
      "Editorial posters, wayfinding badges, and modular typographic grids built around botanical and cosmic geometry.",
    discipline: "Graphic Design",
    status: "Completed",
    versionTag: "v3.1 · Final",
    featured: true,
    coverUrl: "/images/landing/artwork-graphic-design.jpg",
    coverAlt: "Minimalist exhibition poster on linen surface",
    tags: ["identity", "typography", "exhibition"],
    tools: ["InDesign", "Illustrator", "Risograph"],
    updatedAt: "Nov 17, 2026",
    likeCount: 342,
    commentCount: 19,
    collaborators: [
      {
        name: "Anya Sharma",
        username: "anya_art",
        initials: "AS",
        tone: "#203B35",
        accent: "#C8BDE0",
        role: "Illustrator",
      },
    ],
    versions: [
      {
        version: "v3.1",
        label: "Exhibition Print Master",
        date: "Nov 17",
        status: "Final",
        note: "Press-ready separations archived with color specs.",
      },
    ],
  },
  {
    id: "proj-elena-loom",
    title: "Archive Creative — Editorial Reader UI",
    description:
      "Calm browser and tablet reading system for independent art portfolios, prioritizing white space over chrome.",
    discipline: "UI/UX",
    status: "InProgress",
    versionTag: "v2.0 · Review",
    featured: true,
    coverUrl: "/images/landing/artwork-uiux.jpg",
    coverAlt: "Editorial portfolio grid presented on tablet over travertine",
    tags: ["design-system", "editorial-ui", "typography"],
    tools: ["Figma", "CSS Grid", "Type Tokens"],
    updatedAt: "Nov 20, 2026",
    likeCount: 231,
    commentCount: 15,
    collaborators: [
      {
        name: "Mateo Silva",
        username: "mateo_ux",
        initials: "MS",
        tone: "#4A5952",
        accent: "#C8BDE0",
        role: "Interaction Lead",
      },
    ],
    versions: [
      {
        version: "v2.0",
        label: "Responsive Token Spec",
        date: "Nov 20",
        status: "In Review",
        note: "Harmonized hairline borders and serif scale across breakpoints.",
      },
    ],
  },
];

const ELENA_POSTS: ProfilePostItem[] = [
  {
    id: "post-elena-1",
    kind: "Studio Note",
    title: "Restraint is a layout material, not empty space",
    content:
      "Whenever an exhibition identity starts feeling noisy, I strip away every decorative badge except one hairline rule and one serif italic accent. Let the artwork carry the warmth.",
    createdAt: "4 days ago · Nov 22",
    projectRef: {
      id: "proj-elena-solstice",
      title: "Solstice Biennial Identity System",
      versionTag: "v3.1",
    },
    imageUrl: "/images/landing/artwork-graphic-design.jpg",
    imageAlt: "Printed exhibition poster on warm linen",
    tags: ["grid-systems", "editorial", "design-notes"],
    likeCount: 84,
    comments: [],
  },
];

const ANYA_SERVICES: ProfileServiceItem[] = [
  {
    id: "srv-anya-editorial-illustration",
    title: "Botanical & Editorial Illustration Commission",
    category: "Illustration",
    shortDescription:
      "Bespoke gouache and fine-ink artwork crafted for book covers, literary essays, packaging, or exhibition posters.",
    fullDescription:
      "A collaborative illustration commission from initial charcoal thumbnails and palette studies to final print-ready masters. Ideal for independent publishers, cultural journals, botanical brands, and album covers seeking tactile warmth and quiet cosmic detail.",
    coverUrl: "/images/landing/artwork-illustration.jpg",
    coverAlt: "Botanical eucalyptus gouache illustration with celestial rings",
    pricingModel: "Starting at",
    priceAmount: 480,
    currency: "USD",
    estimatedDuration: "2–3 weeks",
    availabilityStatus: "Available",
    availabilityDetail: "Accepting 2 new commissions for Dec · Mon–Thu studio schedule",
    sessionFormat: "Async milestone reviews + 1 kickoff call",
    minNotice: "72 hours advance booking",
    revisionsIncluded: "2 structured sketch & color rounds",
    deliverables: [
      "3 rough composition thumbnails for direction selection",
      "Color palette & gouache texture proof",
      "High-resolution 600 DPI TIFF & Print-ready PDF",
      "Commercial or editorial usage license summary",
    ],
    isPublished: true,
  },
  {
    id: "srv-anya-color-critique",
    title: "Visual Direction & Color Key Studio Session",
    category: "Creative Direction",
    shortDescription:
      "Focused 1-on-1 studio session reviewing color keys, lighting mood, and composition flow for your draft.",
    fullDescription:
      "Bring an illustration, short film background, or zine spread that feels almost finished. Together we walk through value hierarchy, atmospheric lighting, palette restraint, and focal composition with annotated paint-over notes delivered afterward.",
    coverUrl: "/images/landing/artwork-animation.jpg",
    coverAlt: "Twilight conservatory color lighting study",
    pricingModel: "Fixed price",
    priceAmount: 140,
    currency: "USD",
    estimatedDuration: "60 min session",
    availabilityStatus: "Limited Slots",
    availabilityDetail: "2 evening slots left this week (Tue & Thu · UTC+5:45)",
    sessionFormat: "Live video critique + annotated canvas notes",
    minNotice: "24 hours advance booking",
    revisionsIncluded: "Follow-up async note check included",
    deliverables: [
      "60-minute live critique & live color-key walkthrough",
      "Annotated high-res markup notes & swatch adjustments",
      "Written summary of recommended next revision steps",
    ],
    isPublished: true,
  },
  {
    id: "srv-anya-riso-edition",
    title: "Custom Risograph Print & Zine Edition Design",
    category: "Graphic Design",
    shortDescription:
      "Multi-layer soy-ink print layout, spot color separations, and botanical cover illustration for small runs.",
    fullDescription:
      "End-to-end design and color separation setup for 2- to 4-color risograph posters, chapbooks, and studio lookbooks. Includes custom illustration vignettes, paper stock recommendations, and press-ready registration files.",
    coverUrl: "/images/landing/artwork-graphic-design.jpg",
    coverAlt: "Minimalist geometric risograph exhibition poster",
    pricingModel: "Starting at",
    priceAmount: 650,
    currency: "USD",
    estimatedDuration: "3–4 weeks",
    availabilityStatus: "Available",
    availabilityDetail: "Open for January print cycles · Flexible async milestones",
    sessionFormat: "Studio project workspace + press check prep",
    minNotice: "5 days advance notice",
    revisionsIncluded: "3 proof & separation review passes",
    deliverables: [
      "Custom cover artwork + typographic grid layout",
      "Press-ready spot color separation PDFs",
      "Paper weight & soy ink pairing specification sheet",
    ],
    isPublished: true,
  },
  {
    id: "srv-anya-gouache-mentorship-draft",
    title: "Gouache Palette & Botanical Sketchbook Mentorship",
    category: "Mentorship",
    shortDescription:
      "Draft curriculum for a 4-session guided pigment mixing and botanical observational drawing track.",
    fullDescription:
      "Unpublished workshop outline exploring raw pigments, dry charcoal thumbnails, and cohesive editorial color stories. Currently refining session worksheets before publishing publicly.",
    coverUrl: "/images/landing/artwork-writing.jpg",
    coverAlt: "Open studio notebook and botanical sprig on linen",
    pricingModel: "Fixed price",
    priceAmount: 290,
    currency: "USD",
    estimatedDuration: "4 × 45 min",
    availabilityStatus: "Paused",
    availabilityDetail: "Draft · Not yet open to public bookings",
    sessionFormat: "4 weekly studio sessions",
    minNotice: "7 days advance notice",
    revisionsIncluded: "Weekly sketchbook feedback",
    deliverables: [
      "4 live studio workshops",
      "Digital pigment swatch reference guide",
    ],
    isPublished: false,
  },
];

const KENJI_SERVICES: ProfileServiceItem[] = [
  {
    id: "srv-kenji-architectural-essay",
    title: "Architectural Daylight Photo Essay",
    category: "Photography",
    shortDescription:
      "Medium-format film & digital architectural documentation for studios, galleries, and serene residences.",
    fullDescription:
      "Unhurried full-day daylight study capturing how natural shadow, stone texture, and quiet spatial proportions shift across morning and dusk. Shot on 6×7 medium-format film and digital back.",
    coverUrl: "/images/landing/artwork-photography.jpg",
    coverAlt: "Sunlit travertine courtyard arches over still water",
    pricingModel: "Starting at",
    priceAmount: 950,
    currency: "USD",
    estimatedDuration: "1–2 weeks",
    availabilityStatus: "Available",
    availabilityDetail: "Booking Q1 travel & Kyoto/Tokyo daylight shoots",
    sessionFormat: "On-site architectural shoot + curated gallery delivery",
    minNotice: "7 days advance booking",
    revisionsIncluded: "Contact sheet selection + 2 grading passes",
    deliverables: [
      "Curated contact sheet of 40+ medium-format selects",
      "16 color-graded archival TIFF & web plates",
      "Print-ready sequence PDF for press or portfolio",
    ],
    isPublished: true,
  },
  {
    id: "srv-kenji-print-critique",
    title: "Photo Sequence & Contact Sheet Review",
    category: "Photography",
    shortDescription:
      "1-on-1 edit and sequencing review for zines, exhibition proposals, or portfolio series.",
    fullDescription:
      "Tighten pacing, pair spreads thoughtfully, and refine highlight/shadow tone across your photo essay or monograph dummy before going to print.",
    coverUrl: "/images/landing/artwork-ceramics.jpg",
    coverAlt: "Stoneware studio still life in soft window light",
    pricingModel: "Fixed price",
    priceAmount: 110,
    currency: "USD",
    estimatedDuration: "50 min session",
    availabilityStatus: "Limited Slots",
    availabilityDetail: "Wed & Fri morning slots (UTC+9)",
    sessionFormat: "Live screen-share edit + PDF notes",
    minNotice: "24 hours advance booking",
    revisionsIncluded: "Follow-up sequence check included",
    deliverables: [
      "50-minute live sequencing session",
      "Marked contact sheet with pacing notes",
    ],
    isPublished: true,
  },
  {
    id: "srv-kenji-darkroom-draft",
    title: "Private Silver Gelatin Toning Workshop",
    category: "Workshop",
    shortDescription:
      "In-person Kyoto darkroom session covering split-grade printing and paper toning.",
    fullDescription:
      "Draft seasonal offering currently being scheduled for spring studio dates.",
    coverUrl: "/images/landing/artwork-writing.jpg",
    coverAlt: "Open studio journal on natural linen",
    pricingModel: "Fixed price",
    priceAmount: 320,
    currency: "USD",
    estimatedDuration: "3 hours",
    availabilityStatus: "Paused",
    availabilityDetail: "Draft · Spring darkroom dates pending",
    sessionFormat: "In-person Kyoto darkroom",
    minNotice: "14 days advance notice",
    revisionsIncluded: "Includes archival chemistry & fiber paper",
    deliverables: ["3 toned 8×10 fiber prints"],
    isPublished: false,
  },
];

const ELENA_SERVICES: ProfileServiceItem[] = [
  {
    id: "srv-elena-exhibition-identity",
    title: "Exhibition Identity & Swiss Grid System",
    category: "Graphic Design",
    shortDescription:
      "Cohesive visual identity, poster system, and typographic guidelines for cultural projects.",
    fullDescription:
      "Complete editorial identity architecture including typographic hierarchy, grid proportions, poster templates, and digital/print asset specifications tailored to independent galleries, studios, and festivals.",
    coverUrl: "/images/landing/artwork-graphic-design.jpg",
    coverAlt: "Swiss-editorial art poster on linen",
    pricingModel: "Starting at",
    priceAmount: 1200,
    currency: "USD",
    estimatedDuration: "4 weeks",
    availabilityStatus: "Limited Slots",
    availabilityDetail: "1 identity slot available starting next month",
    sessionFormat: "Weekly studio milestones + shared workspace",
    minNotice: "7 days advance notice",
    revisionsIncluded: "3 structured design iterations",
    deliverables: [
      "Modular Swiss-grid identity system & type scale",
      "Key poster & digital exhibition templates",
      "Comprehensive studio identity manual (PDF)",
    ],
    isPublished: true,
  },
  {
    id: "srv-elena-portfolio-audit",
    title: "Editorial Portfolio & Typography Audit",
    category: "UI/UX",
    shortDescription:
      "Detailed typographic, layout rhythm, and responsive polish critique for your creative site.",
    fullDescription:
      "An intentional review of spacing, visual hierarchy, project case-study pacing, and typographic restraint so your work stands forward without visual clutter.",
    coverUrl: "/images/landing/artwork-uiux.jpg",
    coverAlt: "Minimalist editorial tablet portfolio interface",
    pricingModel: "Fixed price",
    priceAmount: 180,
    currency: "USD",
    estimatedDuration: "60 min session",
    availabilityStatus: "Available",
    availabilityDetail: "Mon–Thu afternoons (Zurich · UTC+1)",
    sessionFormat: "Live Figma/browser walkthrough + Loom recap",
    minNotice: "48 hours advance booking",
    revisionsIncluded: "1 follow-up pass review",
    deliverables: [
      "60-minute live audit & layout markup",
      "Type scale & spacing token checklist",
    ],
    isPublished: true,
  },
  {
    id: "srv-elena-type-specimen-draft",
    title: "Custom Editorial Display Ligature Set",
    category: "Typography",
    shortDescription:
      "Bespoke wordmark & display ligature suite for independent journals.",
    fullDescription:
      "Draft service awaiting specimen sheets before publishing.",
    coverUrl: "/images/landing/artwork-digital-art.jpg",
    coverAlt: "Matte celadon arches and frosted orb sculpture",
    pricingModel: "Starting at",
    priceAmount: 850,
    currency: "USD",
    estimatedDuration: "3 weeks",
    availabilityStatus: "Paused",
    availabilityDetail: "Draft · Preparing specimen previews",
    sessionFormat: "Async milestone delivery",
    minNotice: "5 days advance notice",
    revisionsIncluded: "2 vector refinement passes",
    deliverables: ["OTF/WOFF2 wordmark glyphs & vector masters"],
    isPublished: false,
  },
];

const ANYA_IDEAS: ProfileIdeaItem[] = [
  {
    id: "idea-bioluminescence",
    title: "Bioluminescent Forest VR & Ambient Soundscape",
    spark:
      "Merging botanical macro gouache studies of glowing fungi with generative 3D shaders and modular ambient synthesizer soundscapes.",
    discipline: "Animation & Sound",
    stage: "Active Production",
    stageProgress: 65,
    leadName: "Anya Sharma",
    leadUsername: "anya_art",
    contributors: [
      {
        name: "Anya Sharma",
        username: "anya_art",
        initials: "AS",
        tone: "#203B35",
        accent: "#C8BDE0",
        role: "Visual Lead & Gouache Assets",
      },
      {
        name: "Rohan Verma",
        username: "rohan_anim",
        initials: "RV",
        tone: "#27413B",
        accent: "#C8BDE0",
        role: "3D Animation & Shaders",
      },
      {
        name: "Grace Chen",
        username: "grace_music",
        initials: "GC",
        tone: "#304D45",
        accent: "#9DB5A5",
        role: "Ambient Modular Audio",
      },
    ],
    tags: ["vr", "bioluminescence", "generative", "soundscape"],
    lastUpdate: "Grace added 2 ambient audio tracks yesterday",
    nextMilestone: "Interactive WebGL prototype preview (Dec 06)",
  },
  {
    id: "idea-solstice-zine",
    title: "Alpine Typographic Specimen & Folded Zine",
    spark:
      "A limited-run risograph publication pairing Swiss asymmetric typography, high-altitude lichen photography, and poetry.",
    discipline: "Graphic Design & Print",
    stage: "Concept & Moodboard",
    stageProgress: 35,
    leadName: "Elena Rostova",
    leadUsername: "elena_type",
    contributors: [
      {
        name: "Elena Rostova",
        username: "elena_type",
        initials: "ER",
        tone: "#2D3C38",
        accent: "#F6F3EB",
        role: "Initiator & Typographer",
      },
      {
        name: "Anya Sharma",
        username: "anya_art",
        initials: "AS",
        tone: "#203B35",
        accent: "#C8BDE0",
        role: "Botanical Endpapers",
      },
      {
        name: "Kenji Sato",
        username: "kenji_film",
        initials: "KS",
        tone: "#3B4A44",
        accent: "#9DB5A5",
        role: "Medium-Format Film Plates",
      },
    ],
    tags: ["risograph", "zine", "typography", "lichen"],
    lastUpdate: "Elena shared 3 folded dummy prototypes 3 days ago",
    nextMilestone: "Paper weight & dual-drum ink selection (Dec 10)",
  },
  {
    id: "idea-sumie-motion",
    title: "Sumi-e Fluid Motion Graphic Experiments",
    spark:
      "Investigating the physical friction of wet ink against handmade washi paper, translated into procedural 2D particle simulations.",
    discipline: "Digital Art & Film",
    stage: "Spark",
    stageProgress: 15,
    leadName: "Anya Sharma",
    leadUsername: "anya_art",
    contributors: [
      {
        name: "Anya Sharma",
        username: "anya_art",
        initials: "AS",
        tone: "#203B35",
        accent: "#C8BDE0",
        role: "Ink Studies & Texture Library",
      },
    ],
    tags: ["sumi-e", "ink", "fluid-dynamics", "particles"],
    lastUpdate: "Moodboard & wet-ink wash studies added 5 days ago",
    nextMilestone: "Procedural brush-stroke particle timing study",
  },
  {
    id: "idea-ceramic-archive",
    title: "Earthen Glaze & Mineral Pigment Open Archive",
    spark:
      "A collective open-source digital library documenting natural clay slips, wood-ash glazes, and botanical dyes with high-resolution reflectance scans.",
    discipline: "Ceramics & Print",
    stage: "Completed",
    stageProgress: 100,
    leadName: "Mateo Silva",
    leadUsername: "mateo_ux",
    contributors: [
      {
        name: "Mateo Silva",
        username: "mateo_ux",
        initials: "MS",
        tone: "#4A5952",
        accent: "#C8BDE0",
        role: "Archive Architecture & UI",
      },
      {
        name: "Anya Sharma",
        username: "anya_art",
        initials: "AS",
        tone: "#203B35",
        accent: "#C8BDE0",
        role: "Pigment Swatch Documentation",
      },
    ],
    tags: ["ceramics", "pigments", "open-source", "archive"],
    lastUpdate: "Archive v1.0 published and indexed on CreativeSpace",
    nextMilestone: "Project concluded and archived",
  },
];

const KENJI_IDEAS: ProfileIdeaItem[] = [
  {
    id: "idea-kenji-daylight-monograph",
    title: "Travertine & Morning Silence — Unbound Contact Monograph",
    spark:
      "Sequencing uncropped medium-format silver gelatin proof sheets by solar elevation angle to trace how quiet stone rooms hold dawn light.",
    discipline: "Photography & Writing",
    stage: "Review & Polish",
    stageProgress: 85,
    leadName: "Kenji Sato",
    leadUsername: "kenji_film",
    contributors: [
      {
        name: "Kenji Sato",
        username: "kenji_film",
        initials: "KS",
        tone: "#3B4A44",
        accent: "#9DB5A5",
        role: "Photography & Sequencing",
      },
    ],
    tags: ["medium-format", "architecture", "monograph", "daylight"],
    lastUpdate: "Updated colophon & plate index 2 days ago",
    nextMilestone: "Duotone offset proof check with Kyoto press",
  },
  {
    id: "idea-solstice-zine-kenji",
    title: "Alpine Typographic Specimen & Folded Zine",
    spark:
      "A limited-run risograph publication pairing Swiss asymmetric typography, high-altitude lichen photography, and poetry.",
    discipline: "Graphic Design & Print",
    stage: "Concept & Moodboard",
    stageProgress: 35,
    leadName: "Elena Rostova",
    leadUsername: "elena_type",
    contributors: [
      {
        name: "Elena Rostova",
        username: "elena_type",
        initials: "ER",
        tone: "#2D3C38",
        accent: "#F6F3EB",
        role: "Initiator & Typographer",
      },
      {
        name: "Kenji Sato",
        username: "kenji_film",
        initials: "KS",
        tone: "#3B4A44",
        accent: "#9DB5A5",
        role: "Medium-Format Film Plates",
      },
    ],
    tags: ["risograph", "zine", "typography", "lichen"],
    lastUpdate: "Delivered 6 alpine film drum scans 3 days ago",
    nextMilestone: "Paper weight & dual-drum ink selection (Dec 10)",
  },
];

const ELENA_IDEAS: ProfileIdeaItem[] = [
  {
    id: "idea-solstice-zine-elena",
    title: "Alpine Typographic Specimen & Folded Zine",
    spark:
      "A limited-run risograph publication pairing Swiss asymmetric typography, high-altitude lichen photography, and poetry.",
    discipline: "Graphic Design & Print",
    stage: "Concept & Moodboard",
    stageProgress: 35,
    leadName: "Elena Rostova",
    leadUsername: "elena_type",
    contributors: [
      {
        name: "Elena Rostova",
        username: "elena_type",
        initials: "ER",
        tone: "#2D3C38",
        accent: "#F6F3EB",
        role: "Initiator & Typographer",
      },
      {
        name: "Anya Sharma",
        username: "anya_art",
        initials: "AS",
        tone: "#203B35",
        accent: "#C8BDE0",
        role: "Botanical Endpapers",
      },
      {
        name: "Kenji Sato",
        username: "kenji_film",
        initials: "KS",
        tone: "#3B4A44",
        accent: "#9DB5A5",
        role: "Medium-Format Film Plates",
      },
    ],
    tags: ["risograph", "zine", "typography", "lichen"],
    lastUpdate: "Shared 3 folded dummy prototypes 3 days ago",
    nextMilestone: "Paper weight & dual-drum ink selection (Dec 10)",
  },
  {
    id: "idea-elena-herbarium-grotesk",
    title: "Herbarium Serif & Botanical Marginalia System",
    spark:
      "A variable editorial typeface inspired by 19th-century alpine field catalogs, built for bilingual exhibition captions and scholarly monographs.",
    discipline: "Typography & UI/UX",
    stage: "Active Production",
    stageProgress: 60,
    leadName: "Elena Rostova",
    leadUsername: "elena_type",
    contributors: [
      {
        name: "Elena Rostova",
        username: "elena_type",
        initials: "ER",
        tone: "#2D3C38",
        accent: "#F6F3EB",
        role: "Type Design & Specimen",
      },
    ],
    tags: ["typography", "variable-font", "editorial", "herbarium"],
    lastUpdate: "Completed italic optical master & diacritics yesterday",
    nextMilestone: "Specimen booklet layout & optical size kerning",
  },
];

export const MOCK_PROFILES: Record<string, UserProfileRecord> = {
  anya_art: {
    id: "user-anya-art",
    username: "anya_art",
    displayName: "Anya Sharma",
    headline: "Editorial Illustrator & Botanical Printmaker",
    bio: "Exploring quiet botanical studies, celestial geometry, and layered gouache narratives. Documenting works-in-progress from first charcoal thumbnails to exhibition plates in an unhurried studio.",
    location: "Kathmandu, NP",
    timezone: "UTC+5:45",
    joinedAt: "Joined Nov 2024",
    openToCollab: true,
    studioStatus: "Open to select editorial & print collaborations",
    avatarUrl: "/images/landing/artwork-illustration.jpg",
    avatarInitials: "AS",
    avatarTone: "#203B35",
    avatarAccent: "#C8BDE0",
    coverUrl: "/images/landing/artwork-animation.jpg",
    coverPreset: "conservatory",
    disciplines: ["Illustration", "Graphic Design", "Ceramics & Print", "Animation"],
    tools: ["Gouache & Ink", "Procreate", "Risograph", "Photoshop"],
    socialLinks: {
      website: "https://anyasharma.studio",
      instagram: "https://instagram.com/anya_art",
      behance: "https://behance.net/anya_art",
      twitter: "https://x.com/anya_art",
    },
    stats: {
      projects: ANYA_PROJECTS.length,
      services: ANYA_SERVICES.filter((s) => s.isPublished).length,
      posts: ANYA_POSTS.length,
      ideas: ANYA_IDEAS.length,
      followers: 1284,
      following: 164,
      totalLikes: 1729,
      collaborations: 7,
    },
    defaultPerspective: "owner",
    projects: ANYA_PROJECTS,
    services: ANYA_SERVICES,
    posts: ANYA_POSTS,
    ideas: ANYA_IDEAS,
    followersList: SHARED_NETWORK_USERS,
    followingList: SHARED_NETWORK_USERS.slice(0, 3),
  },
  kenji_film: {
    id: "user-kenji-film",
    username: "kenji_film",
    displayName: "Kenji Sato",
    headline: "Architectural Photographer & Visual Essayist",
    bio: "Medium-format architectural studies of travertine courts, morning shadow, and quiet urban sanctuaries. Sharing contact sheets, paper proofs, and field dispatches.",
    location: "Kyoto, JP",
    timezone: "UTC+9",
    joinedAt: "Joined Jan 2025",
    openToCollab: true,
    studioStatus: "Booking Q1 architectural & print essays",
    avatarUrl: "/images/landing/artwork-photography.jpg",
    avatarInitials: "KS",
    avatarTone: "#3B4A44",
    avatarAccent: "#9DB5A5",
    coverUrl: "/images/landing/artwork-photography.jpg",
    coverPreset: "travertine",
    disciplines: ["Photography", "Writing", "Creative Direction"],
    tools: ["Mamiya 7II", "Leica M6", "Portra 160", "InDesign"],
    socialLinks: {
      website: "https://kenjisato.photo",
      instagram: "https://instagram.com/kenji_film",
      behance: "https://behance.net/kenji_film",
    },
    stats: {
      projects: KENJI_PROJECTS.length,
      services: KENJI_SERVICES.filter((s) => s.isPublished).length,
      posts: KENJI_POSTS.length,
      ideas: KENJI_IDEAS.length,
      followers: 892,
      following: 118,
      totalLikes: 517,
      collaborations: 4,
    },
    defaultPerspective: "visitor",
    projects: KENJI_PROJECTS,
    services: KENJI_SERVICES,
    posts: KENJI_POSTS,
    ideas: KENJI_IDEAS,
    followersList: SHARED_NETWORK_USERS.slice(1),
    followingList: SHARED_NETWORK_USERS.slice(0, 4),
  },
  elena_type: {
    id: "user-elena-type",
    username: "elena_type",
    displayName: "Elena Rostova",
    headline: "Visual Systems Designer & Printmaker",
    bio: "Swiss-editorial grids, exhibition identity systems, and quiet typographic editions crafted for cultural studios, journals, and independent makers.",
    location: "Zurich, CH",
    timezone: "UTC+1",
    joinedAt: "Joined Sep 2024",
    openToCollab: false,
    studioStatus: "Focused on Autumn Biennial exhibition press",
    avatarUrl: null,
    avatarInitials: "ER",
    avatarTone: "#2D3C38",
    avatarAccent: "#C8BDE0",
    coverUrl: null,
    coverPreset: "celestial",
    disciplines: ["Graphic Design", "UI/UX", "Writing"],
    tools: ["InDesign", "Figma", "Risograph", "Glyphs"],
    socialLinks: {
      website: "https://elenarostova.ch",
      dribbble: "https://dribbble.com/elena_type",
      github: "https://github.com/elena-type",
    },
    stats: {
      projects: ELENA_PROJECTS.length,
      services: ELENA_SERVICES.filter((s) => s.isPublished).length,
      posts: ELENA_POSTS.length,
      ideas: ELENA_IDEAS.length,
      followers: 1540,
      following: 95,
      totalLikes: 573,
      collaborations: 9,
    },
    defaultPerspective: "visitor",
    projects: ELENA_PROJECTS,
    services: ELENA_SERVICES,
    posts: ELENA_POSTS,
    ideas: ELENA_IDEAS,
    followersList: SHARED_NETWORK_USERS,
    followingList: SHARED_NETWORK_USERS.slice(0, 2),
  },
};

export const SAMPLE_PROFILE_LINKS = [
  { username: "anya_art", label: "Anya Sharma", discipline: "Illustration" },
  { username: "kenji_film", label: "Kenji Sato", discipline: "Photography" },
  { username: "elena_type", label: "Elena Rostova", discipline: "Graphic Design" },
] as const;

function formatDisplayNameFromUsername(username: string): string {
  const cleaned = username
    .replace(/^@+/, "")
    .replace(/[_-]+/g, " ")
    .trim();
  if (!cleaned) return "CreativeSpace Member";
  return cleaned
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Resolves a registered user profile for any `/profile/[username]` route.
 * Uses rich preset mock profiles for sample handles and synthesizes a unified
 * registered user profile for any other handle so the page works universally.
 */
export function resolveMockProfile(rawUsername: string): UserProfileRecord {
  const decoded = decodeURIComponent(rawUsername || "anya_art")
    .trim()
    .replace(/^@+/, "");
  const key = decoded.toLowerCase();

  if (MOCK_PROFILES[key]) {
    return structuredClone(MOCK_PROFILES[key]);
  }

  const displayName = formatDisplayNameFromUsername(decoded);
  const initials = deriveInitials(displayName);
  const safeHandle = decoded.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase() || "creator";

  return {
    id: `user-${safeHandle}`,
    username: safeHandle,
    displayName,
    headline: "Multidisciplinary Maker · CreativeSpace Member",
    bio: "Sharing creative works-in-progress, studio experiments, and visual studies across disciplines. Exploring thoughtful critique and collaborative projects on CreativeSpace.",
    location: "Studio Member",
    timezone: "UTC",
    joinedAt: "Joined 2026",
    openToCollab: true,
    studioStatus: "Open to collaborations",
    avatarUrl: null,
    avatarInitials: initials,
    avatarTone: "#203B35",
    avatarAccent: "#9DB5A5",
    coverUrl: null,
    coverPreset: "celestial",
    disciplines: ["Illustration", "UI/UX", "Writing"],
    tools: ["Sketchbook", "Figma", "Studio Notes"],
    socialLinks: {
      website: `https://creativespace.example/${safeHandle}`,
      instagram: `https://instagram.com/${safeHandle}`,
    },
    stats: {
      projects: 3,
      services: 2,
      posts: 2,
      ideas: 2,
      followers: 248,
      following: 74,
      totalLikes: 420,
      collaborations: 2,
    },
    defaultPerspective: "owner",
    projects: ANYA_PROJECTS.slice(0, 3).map((p, idx) => ({
      ...p,
      id: `${safeHandle}-proj-${idx}`,
      collaborators: [],
    })),
    services: [
      {
        ...ANYA_SERVICES[0],
        id: `${safeHandle}-srv-0`,
      },
      {
        ...ELENA_SERVICES[1],
        id: `${safeHandle}-srv-1`,
      },
      {
        ...ANYA_SERVICES[3],
        id: `${safeHandle}-srv-draft`,
      },
    ],
    posts: ANYA_POSTS.slice(0, 2).map((post, idx) => ({
      ...post,
      id: `${safeHandle}-post-${idx}`,
    })),
    ideas: ANYA_IDEAS.slice(0, 2).map((idea, idx) => ({
      ...idea,
      id: `${safeHandle}-idea-${idx}`,
      leadName: displayName,
      leadUsername: safeHandle,
      contributors: [
        {
          name: displayName,
          username: safeHandle,
          initials,
          tone: "#203B35",
          accent: "#9DB5A5",
          role: "Concept Lead",
        },
      ],
    })),
    followersList: SHARED_NETWORK_USERS.slice(0, 3),
    followingList: SHARED_NETWORK_USERS.slice(1, 3),
  };
}
