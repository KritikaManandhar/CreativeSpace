import {
  MOCK_PROFILES,
  type ProfileProjectItem,
  type ProfileServiceItem,
  type ProfilePostItem,
} from "@/data/mockProfiles";

export type BookingStatus = "Pending" | "Confirmed" | "Completed" | "Declined";

export interface DashboardBookingItem {
  id: string;
  clientName: string;
  clientHandle: string;
  clientRole: string;
  clientInitials: string;
  clientAvatarTone: string;
  clientAvatarAccent: string;
  clientAvatarUrl?: string | null;
  serviceId: string;
  serviceTitle: string;
  serviceCategory: string;
  status: BookingStatus;
  dateRequested: string;
  scheduledDate: string;
  timeSlot: string;
  priceAmount: number;
  currency: string;
  clientNote: string;
  deliverables: string[];
  sessionFormat: string;
}

export type IdeaStage =
  | "Spark"
  | "Concept & Moodboard"
  | "Active Production"
  | "Review & Polish"
  | "Completed";

export interface DashboardIdeaCollaborator {
  name: string;
  username: string;
  initials: string;
  tone: string;
  accent: string;
  role: string;
}

export interface DashboardIdeaItem {
  id: string;
  title: string;
  spark: string;
  discipline: string;
  stage: IdeaStage;
  stageProgress: number; // 0 - 100
  role: "Owner" | "Collaborator";
  leadName: string;
  leadUsername: string;
  collaborators: DashboardIdeaCollaborator[];
  tags: string[];
  lastUpdate: string;
  nextMilestone: string;
  openRolesNeeded?: string[];
}

export type ActivityCategory =
  | "booking"
  | "project"
  | "service"
  | "idea"
  | "collaboration"
  | "post"
  | "comment";

export interface DashboardActivityItem {
  id: string;
  category: ActivityCategory;
  title: string;
  description: string;
  timestamp: string;
  actorName: string;
  actorHandle: string;
  actorInitials: string;
  actorTone: string;
  actorAccent: string;
  targetSection: "projects" | "services" | "bookings" | "posts" | "ideas";
  unread?: boolean;
}

// Initial Mock Bookings
export const INITIAL_DASHBOARD_BOOKINGS: DashboardBookingItem[] = [
  {
    id: "bkg-101",
    clientName: "David Miller",
    clientHandle: "david_client",
    clientRole: "Creative Director, Horizon Press",
    clientInitials: "DM",
    clientAvatarTone: "#203B35",
    clientAvatarAccent: "#C8BDE0",
    clientAvatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
    serviceId: "srv-anya-botanical-cover",
    serviceTitle: "Editorial Botanical Cover Series",
    serviceCategory: "Illustration",
    status: "Pending",
    dateRequested: "2 hours ago",
    scheduledDate: "Nov 30, 2026",
    timeSlot: "Kickoff Call: 2:00 PM – 3:00 PM (UTC+9)",
    priceAmount: 450,
    currency: "USD",
    clientNote:
      "We are curating the Winter issue of Horizon Quarterly centered around natural sanctuaries and urban flora. We loved your Nocturne Flora study and want 1 primary gouache cover + 2 chapter vignettes.",
    deliverables: [
      "3 rough composition thumbnails for direction selection",
      "Color palette & gouache texture proof",
      "High-resolution 600 DPI TIFF & Print-ready PDF",
      "Commercial or editorial usage license summary",
    ],
    sessionFormat: "Async milestone reviews + 1 kickoff call",
  },
  {
    id: "bkg-102",
    clientName: "Maya Lin",
    clientHandle: "maya_design",
    clientRole: "Brand Design Lead, Studio Koto",
    clientInitials: "ML",
    clientAvatarTone: "#3A4741",
    clientAvatarAccent: "#9DB5A5",
    serviceId: "srv-anya-critique-session",
    serviceTitle: "1-on-1 Studio Critique & Portfolio Review",
    serviceCategory: "Mentorship",
    status: "Pending",
    dateRequested: "Yesterday",
    scheduledDate: "Dec 03, 2026",
    timeSlot: "Live Studio Session: 4:30 PM – 5:30 PM (UTC+9)",
    priceAmount: 150,
    currency: "USD",
    clientNote:
      "Looking for candid feedback on an upcoming editorial monograph series. Specifically wanting to audit layout balance, gouache print reproductions, and typographic margins.",
    deliverables: [
      "60-minute recorded video critique & deep dive",
      "Annotated Figma or PDF review sheet with balance notes",
      "Follow-up resource & paper swatch recommendations",
    ],
    sessionFormat: "60-minute video session via studio link",
  },
  {
    id: "bkg-103",
    clientName: "Kenji Sato",
    clientHandle: "kenji_film",
    clientRole: "Architectural Photographer",
    clientInitials: "KS",
    clientAvatarTone: "#3B4A44",
    clientAvatarAccent: "#9DB5A5",
    serviceId: "srv-anya-botanical-spot",
    serviceTitle: "Custom Botanical Spot Illustration Set",
    serviceCategory: "Illustration",
    status: "Confirmed",
    dateRequested: "3 days ago",
    scheduledDate: "Dec 08, 2026",
    timeSlot: "Milestone Delivery Date",
    priceAmount: 650,
    currency: "USD",
    clientNote:
      "Collaborative spot artwork needed for my upcoming Kyoto Travertine photo book dividers. Five small Japanese moss & stone ink drawings.",
    deliverables: [
      "5 custom gouache / ink botanical spot plates",
      "Transparent PNG assets & vectorized SVG linework",
      "Printed contact sheet specimen proof",
    ],
    sessionFormat: "Weekly async drop & shared workspace",
  },
  {
    id: "bkg-104",
    clientName: "Sora Takahashi",
    clientHandle: "sora_indie",
    clientRole: "Independent Curator, Solstice Gallery",
    clientInitials: "ST",
    clientAvatarTone: "#28423C",
    clientAvatarAccent: "#C8BDE0",
    serviceId: "srv-anya-botanical-cover",
    serviceTitle: "Editorial Botanical Cover Series",
    serviceCategory: "Illustration",
    status: "Confirmed",
    dateRequested: "Nov 21, 2026",
    scheduledDate: "Dec 14, 2026",
    timeSlot: "Final Review & Handover",
    priceAmount: 450,
    currency: "USD",
    clientNote:
      "Poster and gallery brochure artwork for the Winter Solstice exhibition in Tokyo. Delivery needed before Dec 15.",
    deliverables: [
      "Full color gouache cover art",
      "Layered typography and background files",
      "CMYK press-ready export with crop marks",
    ],
    sessionFormat: "Async milestone reviews + 1 kickoff call",
  },
  {
    id: "bkg-105",
    clientName: "Julian Vance",
    clientHandle: "julian_vance",
    clientRole: "Author & Essayist",
    clientInitials: "JV",
    clientAvatarTone: "#4A5952",
    clientAvatarAccent: "#EFECE2",
    serviceId: "srv-anya-critique-session",
    serviceTitle: "1-on-1 Studio Critique & Portfolio Review",
    serviceCategory: "Mentorship",
    status: "Completed",
    dateRequested: "Nov 10, 2026",
    scheduledDate: "Nov 16, 2026",
    timeSlot: "Completed",
    priceAmount: 150,
    currency: "USD",
    clientNote:
      "Review of botanical zine cover draft and layout pacing. Thank you for the insightful feedback on contrast and paper texture!",
    deliverables: [
      "60-minute recorded video critique",
      "Annotated layout critique notes",
    ],
    sessionFormat: "60-minute video session",
  },
];

// Initial Mock Ideas & Collaborations
export const INITIAL_DASHBOARD_IDEAS: DashboardIdeaItem[] = [
  {
    id: "idea-bioluminescence",
    title: "Bioluminescent Forest VR & Ambient Soundscape",
    spark:
      "Merging botanical macro gouache studies of glowing fungi with generative 3D shaders and modular ambient synthesizer soundscapes.",
    discipline: "Animation & Sound",
    stage: "Active Production",
    stageProgress: 65,
    role: "Owner",
    leadName: "Anya Sharma",
    leadUsername: "anya_art",
    collaborators: [
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
    nextMilestone: "Milestone: Interactive WebGL prototype preview (Dec 06)",
    openRolesNeeded: ["Creative Technologist (Three.js)"],
  },
  {
    id: "idea-solstice-zine",
    title: "Alpine Typographic Specimen & Folded Zine",
    spark:
      "A limited-run risograph publication pairing Swiss asymmetric typography, high-altitude lichen photography, and poetry.",
    discipline: "Graphic Design & Print",
    stage: "Concept & Moodboard",
    stageProgress: 35,
    role: "Collaborator",
    leadName: "Elena Rostova",
    leadUsername: "elena_type",
    collaborators: [
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
    nextMilestone: "Milestone: Paper weight & dual-drum ink selection (Dec 10)",
  },
  {
    id: "idea-sumie-motion",
    title: "Sumi-e Fluid Motion Graphic Experiments",
    spark:
      "Investigating the physical friction of wet ink against handmade washi paper, translated into procedural 2D particle simulations.",
    discipline: "Digital Art & Film",
    stage: "Spark",
    stageProgress: 15,
    role: "Owner",
    leadName: "Anya Sharma",
    leadUsername: "anya_art",
    collaborators: [
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
    lastUpdate: "Pitched concept and moodboard references 5 days ago",
    nextMilestone: "Milestone: Assemble open invite for a procedural motion animator",
    openRolesNeeded: ["Houdini / TouchDesigner Artist"],
  },
  {
    id: "idea-ceramic-archive",
    title: "Earthen Glaze & Mineral Pigment Open Archive",
    spark:
      "A collective open-source digital library documenting natural clay slips, wood-ash glazes, and botanical dyes with high-resolution reflectance scans.",
    discipline: "Ceramics & Print",
    stage: "Completed",
    stageProgress: 100,
    role: "Collaborator",
    leadName: "Mateo Silva",
    leadUsername: "mateo_ux",
    collaborators: [
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
    nextMilestone: "Project successfully concluded and archived",
  },
];

// Initial Recent Activity Timeline
export const INITIAL_DASHBOARD_ACTIVITY: DashboardActivityItem[] = [
  {
    id: "act-1",
    category: "booking",
    title: "New booking request received",
    description:
      "David Miller (@david_client) requested 'Editorial Botanical Cover Series' for Horizon Quarterly.",
    timestamp: "2 hours ago",
    actorName: "David Miller",
    actorHandle: "david_client",
    actorInitials: "DM",
    actorTone: "#203B35",
    actorAccent: "#C8BDE0",
    targetSection: "bookings",
    unread: true,
  },
  {
    id: "act-2",
    category: "collaboration",
    title: "New audio stems uploaded",
    description:
      "Grace Chen uploaded 2 modular ambient tracks to 'Bioluminescent Forest VR & Soundscape'.",
    timestamp: "Yesterday",
    actorName: "Grace Chen",
    actorHandle: "grace_music",
    actorInitials: "GC",
    actorTone: "#304D45",
    actorAccent: "#9DB5A5",
    targetSection: "ideas",
    unread: true,
  },
  {
    id: "act-3",
    category: "comment",
    title: "Critique feedback on Nocturne Flora",
    description:
      "Elena Rostova commented: 'The quiet gap around the moon really breathes here...'",
    timestamp: "1 day ago",
    actorName: "Elena Rostova",
    actorHandle: "elena_type",
    actorInitials: "ER",
    actorTone: "#2D3C38",
    actorAccent: "#F6F3EB",
    targetSection: "posts",
  },
  {
    id: "act-4",
    category: "project",
    title: "Version v2.4 pushed to Review",
    description:
      "You updated 'Conservatory at Dusk — Frame 042' with soft lavender twilight wash.",
    timestamp: "3 days ago",
    actorName: "Anya Sharma",
    actorHandle: "anya_art",
    actorInitials: "AS",
    actorTone: "#203B35",
    actorAccent: "#C8BDE0",
    targetSection: "projects",
  },
  {
    id: "act-5",
    category: "booking",
    title: "Booking confirmed",
    description:
      "Kenji Sato accepted the schedule for 'Custom Botanical Spot Illustration Set'.",
    timestamp: "3 days ago",
    actorName: "Kenji Sato",
    actorHandle: "kenji_film",
    actorInitials: "KS",
    actorTone: "#3B4A44",
    actorAccent: "#9DB5A5",
    targetSection: "bookings",
  },
  {
    id: "act-6",
    category: "post",
    title: "Studio note published",
    description:
      "Published 'Why I start every celestial illustration with dry charcoal' — 68 appreciations.",
    timestamp: "4 days ago",
    actorName: "Anya Sharma",
    actorHandle: "anya_art",
    actorInitials: "AS",
    actorTone: "#203B35",
    actorAccent: "#C8BDE0",
    targetSection: "posts",
  },
  {
    id: "act-7",
    category: "service",
    title: "Service status updated",
    description:
      "Toggled 'Custom Botanical Spot Illustration Set' to Available with 2 upcoming slots.",
    timestamp: "5 days ago",
    actorName: "Anya Sharma",
    actorHandle: "anya_art",
    actorInitials: "AS",
    actorTone: "#203B35",
    actorAccent: "#C8BDE0",
    targetSection: "services",
  },
];

// Additional mock project to ensure diversity of statuses (Draft, InProgress, InReview, Completed)
export const INITIAL_DASHBOARD_PROJECTS: ProfileProjectItem[] = [
  ...MOCK_PROFILES.anya_art.projects,
  {
    id: "proj-gouache-swatches",
    title: "Mineral Gouache Pigment Field Guide",
    description:
      "A personal reference catalog testing natural earth pigments, binder ratios, and archival lightfastness across Japanese Mulberry and cotton paper.",
    discipline: "Ceramics & Print",
    status: "InProgress",
    versionTag: "v0.9 · Draft",
    featured: false,
    coverUrl: "/images/landing/artwork-ceramics.jpg",
    coverAlt: "Glazed stoneware ceramic palettes with botanical gouache mixtures",
    tags: ["pigments", "color-theory", "field-guide"],
    tools: ["Handmade Washi", "Gum Arabic", "Mineral Slips"],
    updatedAt: "Yesterday",
    likeCount: 94,
    commentCount: 9,
    collaborators: [],
    versions: [
      {
        version: "v0.1",
        label: "Raw Earth Swatches",
        date: "Nov 12",
        status: "Draft",
        note: "Initial pigment grinding tests with red ochre and raw umber.",
      },
      {
        version: "v0.9",
        label: "Wash Consistency Matrix",
        date: "Nov 25",
        status: "In Review",
        note: "Testing layer permanence over black ink underbrush.",
      },
    ],
  },
];

// Services initialized with full editable publication status
export const INITIAL_DASHBOARD_SERVICES: ProfileServiceItem[] = [
  ...MOCK_PROFILES.anya_art.services,
  {
    id: "srv-anya-book-jacket-draft",
    title: "Bespoke Illustrated Book Jacket & Endpapers",
    category: "Illustration",
    shortDescription:
      "Full wrap-around illustrated dust jacket, matching endpaper pattern, and embossed spine typography for hardbound volumes.",
    fullDescription:
      "Complete book jacket art direction for small presses and authors. Includes full cover painting, hand-lettered or curated title typography, decorative endpaper motif, and foil stamping vector files.",
    coverUrl: "/images/landing/artwork-writing.jpg",
    coverAlt: "Hardcover linen book jacket with delicate celestial illustration",
    pricingModel: "Fixed price",
    priceAmount: 1200,
    currency: "USD",
    estimatedDuration: "3-4 weeks",
    availabilityStatus: "Paused",
    availabilityDetail: "Currently drafting template — launching next season",
    sessionFormat: "Milestone reviews + print production proofing",
    minNotice: "14 days advance booking",
    revisionsIncluded: "3 rounds of composition and color reviews",
    deliverables: [
      "Full wrap-around high-resolution dust jacket art",
      "Seamless repeat endpaper pattern files",
      "Spine & foil stamp vector artwork (AI / PDF)",
      "Printer color profile specifications",
    ],
    isPublished: false, // Draft service!
  },
];

export const INITIAL_DASHBOARD_POSTS: ProfilePostItem[] = [
  ...MOCK_PROFILES.anya_art.posts,
  {
    id: "post-anya-critique-crescent",
    kind: "Critique Request",
    title: "Feedback wanted: Balancing celestial lavender arcs against raw linen",
    content:
      "Working on a new plate where deep forest gouache leaves intersect a quiet lavender orbit. On screen the lavender feels subtle, but my test print on rough cotton rag came out slightly heavier than intended. Would love another set of eyes from anyone doing physical print runs!",
    createdAt: "5 days ago · Nov 21",
    projectRef: {
      id: "proj-nocturne-flora",
      title: "Nocturne Flora & Orbit",
      versionTag: "v2.0",
    },
    imageUrl: "/images/landing/artwork-graphic-design.jpg",
    imageAlt: "Test print specimen on raw linen sheet showing color values",
    tags: ["critique", "printmaking", "color-calibration"],
    likeCount: 43,
    comments: [
      {
        id: "c-3",
        authorName: "Kenji Sato",
        authorHandle: "kenji_film",
        initials: "KS",
        tone: "#3B4A44",
        accent: "#9DB5A5",
        createdAt: "4 days ago",
        content:
          "Cotton rag tends to absorb lavender pigments deeper, which darkens the perceived value. Try cutting the pigment density with 10% more distilled water on the third wash.",
      },
    ],
  },
];
