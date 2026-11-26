import {
  MOCK_PROFILES,
  deriveInitials,
  sanitizePreviewImageUrl,
} from "@/data/mockProfiles";

export type FeedPostKind =
  | "Studio Note"
  | "Process Log"
  | "Critique Request"
  | "Milestone"
  | "Project Update";

export type FeedDiscipline =
  | "Illustration"
  | "Photography"
  | "Graphic Design"
  | "UI/UX"
  | "Animation"
  | "Writing"
  | "Digital Art"
  | "Ceramics & Print";

export type FeedDisciplineFilter = "All" | FeedDiscipline;
export type FeedStreamTab = "for-you" | "following" | "critiques" | "saved";
export type FeedSortOption = "recent" | "appreciated";

export interface FeedReplyItem {
  id: string;
  authorName: string;
  authorHandle: string;
  initials: string;
  tone: string;
  accent: string;
  avatarUrl?: string | null;
  createdAt: string;
  content: string;
}

export interface FeedCommentItem {
  id: string;
  authorName: string;
  authorHandle: string;
  initials: string;
  tone: string;
  accent: string;
  avatarUrl?: string | null;
  createdAt: string;
  content: string;
  likeCount: number;
  replies: FeedReplyItem[];
}

export interface FeedCreatorSummary {
  id: string;
  username: string;
  displayName: string;
  headline: string;
  bio: string;
  initials: string;
  avatarTone: string;
  avatarAccent: string;
  avatarUrl: string | null;
  primaryDiscipline: FeedDiscipline;
  disciplines: FeedDiscipline[];
  location: string;
  followersCount: number;
  projectsCount: number;
  defaultFollowing: boolean;
}

export interface FeedPostItem {
  id: string;
  kind: FeedPostKind;
  discipline: FeedDiscipline;
  authorUsername: string;
  title?: string;
  content: string;
  createdAt: string;
  sortOrder: number;
  projectRef?: {
    id: string;
    title: string;
    versionTag?: string;
  };
  imageUrl?: string | null;
  imageAlt?: string;
  excerptQuote?: string;
  tags: string[];
  likeCount: number;
  comments: FeedCommentItem[];
}

export interface CommunityHighlightItem {
  id: string;
  eyebrow: string;
  title: string;
  summary: string;
  creatorUsername: string;
  creatorLabel: string;
  discipline: FeedDiscipline;
  accentTone: "sage" | "lavender" | "forest";
}

export interface MediaPresetOption {
  id: string;
  label: string;
  discipline: FeedDiscipline;
  imageUrl: string;
  alt: string;
}

export const FEED_DISCIPLINES: FeedDisciplineFilter[] = [
  "All",
  "Illustration",
  "Photography",
  "Graphic Design",
  "UI/UX",
  "Animation",
  "Writing",
  "Digital Art",
  "Ceramics & Print",
];

export const FEED_POST_KINDS: FeedPostKind[] = [
  "Studio Note",
  "Process Log",
  "Critique Request",
  "Milestone",
  "Project Update",
];

export const COMPOSER_MEDIA_PRESETS: MediaPresetOption[] = [
  {
    id: "preset-illustration",
    label: "Botanical Gouache",
    discipline: "Illustration",
    imageUrl: "/images/landing/artwork-illustration.jpg",
    alt: "Botanical eucalyptus gouache illustration with crescent moon and orbital arcs",
  },
  {
    id: "preset-photography",
    label: "Travertine Court",
    discipline: "Photography",
    imageUrl: "/images/landing/artwork-photography.jpg",
    alt: "Medium-format architectural study of sunlit limestone arches over still water",
  },
  {
    id: "preset-graphic",
    label: "Solstice Riso",
    discipline: "Graphic Design",
    imageUrl: "/images/landing/artwork-graphic-design.jpg",
    alt: "Minimalist Swiss-editorial exhibition poster on warm linen",
  },
  {
    id: "preset-uiux",
    label: "Editorial Tablet UI",
    discipline: "UI/UX",
    imageUrl: "/images/landing/artwork-uiux.jpg",
    alt: "Clean editorial reader UI showcased on tablet over travertine stone",
  },
  {
    id: "preset-animation",
    label: "Glasshouse Dusk",
    discipline: "Animation",
    imageUrl: "/images/landing/artwork-animation.jpg",
    alt: "Painted twilight glass conservatory frame glowing with lantern light",
  },
  {
    id: "preset-writing",
    label: "Chapbook Spread",
    discipline: "Writing",
    imageUrl: "/images/landing/artwork-writing.jpg",
    alt: "Cloth-bound studio notebook open on oatmeal linen beside brass fountain pen",
  },
];

// Reuse existing profile entities from `mockProfiles.ts` to keep identities & stats synchronized.
const anyaProfile = MOCK_PROFILES.anya_art;
const kenjiProfile = MOCK_PROFILES.kenji_film;
const elenaProfile = MOCK_PROFILES.elena_type;

const networkByHandle = new Map(
  anyaProfile.followersList.map((user) => [user.username, user])
);

const mateoNet = networkByHandle.get("mateo_ux");
const amaraNet = networkByHandle.get("amara_3d");
const hannahNet = networkByHandle.get("hannah_prose");

export const FEED_CREATORS: Record<string, FeedCreatorSummary> = {
  anya_art: {
    id: anyaProfile.id,
    username: anyaProfile.username,
    displayName: anyaProfile.displayName,
    headline: anyaProfile.headline,
    bio: anyaProfile.bio,
    initials: anyaProfile.avatarInitials,
    avatarTone: anyaProfile.avatarTone,
    avatarAccent: anyaProfile.avatarAccent,
    avatarUrl: anyaProfile.avatarUrl,
    primaryDiscipline: "Illustration",
    disciplines: ["Illustration", "Graphic Design", "Ceramics & Print", "Animation"],
    location: anyaProfile.location,
    followersCount: anyaProfile.stats.followers,
    projectsCount: anyaProfile.stats.projects,
    defaultFollowing: true,
  },
  kenji_film: {
    id: kenjiProfile.id,
    username: kenjiProfile.username,
    displayName: kenjiProfile.displayName,
    headline: kenjiProfile.headline,
    bio: kenjiProfile.bio,
    initials: kenjiProfile.avatarInitials,
    avatarTone: kenjiProfile.avatarTone,
    avatarAccent: kenjiProfile.avatarAccent,
    avatarUrl: kenjiProfile.avatarUrl,
    primaryDiscipline: "Photography",
    disciplines: ["Photography", "Writing"],
    location: kenjiProfile.location,
    followersCount: kenjiProfile.stats.followers,
    projectsCount: kenjiProfile.stats.projects,
    defaultFollowing: true,
  },
  elena_type: {
    id: elenaProfile.id,
    username: elenaProfile.username,
    displayName: elenaProfile.displayName,
    headline: elenaProfile.headline,
    bio: elenaProfile.bio,
    initials: elenaProfile.avatarInitials,
    avatarTone: elenaProfile.avatarTone,
    avatarAccent: elenaProfile.avatarAccent,
    avatarUrl: elenaProfile.avatarUrl,
    primaryDiscipline: "Graphic Design",
    disciplines: ["Graphic Design", "UI/UX", "Writing"],
    location: elenaProfile.location,
    followersCount: elenaProfile.stats.followers,
    projectsCount: elenaProfile.stats.projects,
    defaultFollowing: true,
  },
  mateo_ux: {
    id: mateoNet?.id ?? "u-mateo",
    username: mateoNet?.username ?? "mateo_ux",
    displayName: mateoNet?.displayName ?? "Mateo Silva",
    headline: mateoNet?.roleTitle ?? "Product & Audio Designer",
    bio: "Crafting tactile digital reading instruments, calm typographic layouts, and sound-reactive spatial interfaces.",
    initials: mateoNet?.initials ?? "MS",
    avatarTone: mateoNet?.avatarTone ?? "#4A5952",
    avatarAccent: mateoNet?.avatarAccent ?? "#C8BDE0",
    avatarUrl: mateoNet?.avatarUrl ?? "/images/landing/artwork-uiux.jpg",
    primaryDiscipline: "UI/UX",
    disciplines: ["UI/UX", "Graphic Design"],
    location: "Lisbon, PT",
    followersCount: 642,
    projectsCount: 9,
    defaultFollowing: false,
  },
  amara_3d: {
    id: amaraNet?.id ?? "u-amara",
    username: amaraNet?.username ?? "amara_3d",
    displayName: amaraNet?.displayName ?? "Amara Okafor",
    headline: amaraNet?.roleTitle ?? "Sculptural Digital Artist",
    bio: "Translating architectural geometry and frosted mineral textures into contemplative light studies.",
    initials: amaraNet?.initials ?? "AO",
    avatarTone: amaraNet?.avatarTone ?? "#203B35",
    avatarAccent: amaraNet?.avatarAccent ?? "#9DB5A5",
    avatarUrl: amaraNet?.avatarUrl ?? "/images/landing/artwork-digital-art.jpg",
    primaryDiscipline: "Digital Art",
    disciplines: ["Digital Art", "Illustration"],
    location: "London, UK",
    followersCount: 918,
    projectsCount: 14,
    defaultFollowing: true,
  },
  hannah_prose: {
    id: hannahNet?.id ?? "u-hannah",
    username: hannahNet?.username ?? "hannah_prose",
    displayName: hannahNet?.displayName ?? "Hannah Lindqvist",
    headline: hannahNet?.roleTitle ?? "Essayist & Print Editor",
    bio: "Writing slow essays on craft, quiet architecture, and independent bookmaking from Gothenburg.",
    initials: hannahNet?.initials ?? "HL",
    avatarTone: hannahNet?.avatarTone ?? "#344640",
    avatarAccent: hannahNet?.avatarAccent ?? "#E7DFD1",
    avatarUrl: hannahNet?.avatarUrl ?? "/images/landing/artwork-writing.jpg",
    primaryDiscipline: "Writing",
    disciplines: ["Writing", "Graphic Design"],
    location: "Gothenburg, SE",
    followersCount: 534,
    projectsCount: 16,
    defaultFollowing: false,
  },
  rohan_anim: {
    id: "u-rohan",
    username: "rohan_anim",
    displayName: "Rohan Verma",
    headline: "Director & 2D Animator",
    bio: "Frame-by-frame atmospheric animation, background color keys, and nocturnal botanical landscapes.",
    initials: deriveInitials("Rohan Verma"),
    avatarTone: "#27413B",
    avatarAccent: "#C8BDE0",
    avatarUrl: "/images/landing/artwork-animation.jpg",
    primaryDiscipline: "Animation",
    disciplines: ["Animation", "Illustration"],
    location: "Bengaluru, IN",
    followersCount: 785,
    projectsCount: 11,
    defaultFollowing: false,
  },
  priya_kiln: {
    id: "u-priya",
    username: "priya_kiln",
    displayName: "Priya Nair",
    headline: "Ceramicist & Printmaker",
    bio: "Wheel-thrown stoneware vessels, botanical linocut editions, and wood-ash glaze field logs.",
    initials: deriveInitials("Priya Nair"),
    avatarTone: "#3E4F48",
    avatarAccent: "#9DB5A5",
    avatarUrl: "/images/landing/artwork-ceramics.jpg",
    primaryDiscipline: "Ceramics & Print",
    disciplines: ["Ceramics & Print", "Photography"],
    location: "Kochi, IN",
    followersCount: 476,
    projectsCount: 12,
    defaultFollowing: false,
  },
};

function mapProfilePostComments(
  comments: typeof anyaProfile.posts[number]["comments"]
): FeedCommentItem[] {
  return comments.map((comment, idx) => {
    const knownCreator = FEED_CREATORS[comment.authorHandle];
    return {
      id: comment.id,
      authorName: comment.authorName,
      authorHandle: comment.authorHandle,
      initials: comment.initials,
      tone: comment.tone,
      accent: comment.accent,
      avatarUrl: knownCreator?.avatarUrl ?? null,
      createdAt: comment.createdAt,
      content: comment.content,
      likeCount: 4 + idx * 3,
      replies:
        comment.id === "c-1"
          ? [
              {
                id: "rep-anya-1",
                authorName: anyaProfile.displayName,
                authorHandle: anyaProfile.username,
                initials: anyaProfile.avatarInitials,
                tone: anyaProfile.avatarTone,
                accent: anyaProfile.avatarAccent,
                avatarUrl: anyaProfile.avatarUrl,
                createdAt: "20 hours ago",
                content:
                  "Thank you Elena — the negative space check at thumbnail scale caught two crowded branches early!",
              },
            ]
          : [],
    };
  });
}

const anyaPost0 = anyaProfile.posts[0];
const anyaPost1 = anyaProfile.posts[1];
const kenjiPost0 = kenjiProfile.posts[0];
const elenaPost0 = elenaProfile.posts[0];

export const INITIAL_FEED_POSTS: FeedPostItem[] = [
  {
    id: anyaPost0.id,
    kind: anyaPost0.kind,
    discipline: "Illustration",
    authorUsername: anyaProfile.username,
    title: anyaPost0.title,
    content: anyaPost0.content,
    createdAt: "2 hours ago",
    sortOrder: 12,
    projectRef: anyaPost0.projectRef,
    imageUrl: sanitizePreviewImageUrl(anyaPost0.imageUrl),
    imageAlt: anyaPost0.imageAlt,
    tags: anyaPost0.tags,
    likeCount: anyaPost0.likeCount + 74,
    comments: mapProfilePostComments(anyaPost0.comments),
  },
  {
    id: "feed-post-mateo-ui",
    kind: "Project Update",
    discipline: "UI/UX",
    authorUsername: "mateo_ux",
    title: "Calm reading margins for Archive Creative UI v2.0",
    content:
      "Stripped away floating toolbars inside the tablet exhibition reader so artwork plates can hold a 68% viewport share. Hairline borders and soft serif captions now do all the structural pacing.",
    createdAt: "4 hours ago",
    sortOrder: 11,
    projectRef: {
      id: "proj-elena-loom",
      title: "Archive Creative — Editorial Reader UI",
      versionTag: "v2.0",
    },
    imageUrl: "/images/landing/artwork-uiux.jpg",
    imageAlt: "Editorial portfolio interface presented on tablet over travertine surface",
    tags: ["editorial-ui", "typography", "reading-experience"],
    likeCount: 118,
    comments: [
      {
        id: "fc-mateo-1",
        authorName: elenaProfile.displayName,
        authorHandle: elenaProfile.username,
        initials: elenaProfile.avatarInitials,
        tone: elenaProfile.avatarTone,
        accent: elenaProfile.avatarAccent,
        avatarUrl: elenaProfile.avatarUrl,
        createdAt: "3 hours ago",
        content:
          "Giving the artwork room to breathe on tablet completely changes the cadence of reading a portfolio.",
        likeCount: 9,
        replies: [
          {
            id: "rep-mateo-1",
            authorName: "Mateo Silva",
            authorHandle: "mateo_ux",
            initials: "MS",
            tone: "#4A5952",
            accent: "#C8BDE0",
            avatarUrl: "/images/landing/artwork-uiux.jpg",
            createdAt: "2 hours ago",
            content:
              "Agreed — locking the hairline spacing tokens next before we test the mobile drawer rhythm.",
          },
        ],
      },
    ],
  },
  {
    id: anyaPost1.id,
    kind: anyaPost1.kind,
    discipline: "Animation",
    authorUsername: anyaProfile.username,
    title: anyaPost1.title,
    content: anyaPost1.content,
    createdAt: "6 hours ago",
    sortOrder: 10,
    projectRef: anyaPost1.projectRef,
    imageUrl: sanitizePreviewImageUrl(anyaPost1.imageUrl),
    imageAlt: anyaPost1.imageAlt,
    tags: anyaPost1.tags,
    likeCount: anyaPost1.likeCount + 41,
    comments: mapProfilePostComments(anyaPost1.comments),
  },
  {
    id: "feed-post-hannah-essay",
    kind: "Studio Note",
    discipline: "Writing",
    authorUsername: "hannah_prose",
    title: "On finishing creative drafts slowly without rushing to publish",
    content:
      "Most of my favorite chapbook pages came from letting a draft sit untouched beside a cup of tea for seventy-two hours. Distance turns self-doubt into clear editorial eyes — you spot which sentences carry atmosphere and which ones are just clearing their throat.",
    createdAt: "11 hours ago",
    sortOrder: 9,
    excerptQuote:
      "Distance turns self-doubt into clear editorial eyes — leave room between making and announcing.",
    imageUrl: null,
    tags: ["essays", "slow-craft", "creative-writing"],
    likeCount: 163,
    comments: [
      {
        id: "fc-hannah-1",
        authorName: kenjiProfile.displayName,
        authorHandle: kenjiProfile.username,
        initials: kenjiProfile.avatarInitials,
        tone: kenjiProfile.avatarTone,
        accent: kenjiProfile.avatarAccent,
        avatarUrl: kenjiProfile.avatarUrl,
        createdAt: "9 hours ago",
        content:
          "Same discipline with contact sheets. If I pick selects the same evening I scan film, I always choose too dramatically.",
        likeCount: 14,
        replies: [],
      },
    ],
  },
  {
    id: kenjiPost0.id,
    kind: kenjiPost0.kind,
    discipline: "Photography",
    authorUsername: kenjiProfile.username,
    title: kenjiPost0.title,
    content: kenjiPost0.content,
    createdAt: "1 day ago",
    sortOrder: 8,
    projectRef: kenjiPost0.projectRef,
    imageUrl: sanitizePreviewImageUrl(kenjiPost0.imageUrl),
    imageAlt: kenjiPost0.imageAlt,
    tags: kenjiPost0.tags,
    likeCount: kenjiPost0.likeCount + 52,
    comments: mapProfilePostComments(kenjiPost0.comments),
  },
  {
    id: "feed-post-amara-3d",
    kind: "Milestone",
    discipline: "Digital Art",
    authorUsername: "amara_3d",
    title: "Dialing subsurface warmth on Celadon Forms & Frosted Orbit",
    content:
      "Finished the final ACEScg lighting pass after three weeks of shader calibration. Pairing matte eucalyptus stoneware planes with a frosted lavender glass sphere gave the still life a quiet morning museum feel instead of sterile CGI.",
    createdAt: "1 day ago",
    sortOrder: 7,
    projectRef: {
      id: "proj-celadon-studies",
      title: "Celadon Forms & Soft Orbit",
      versionTag: "v2.0",
    },
    imageUrl: "/images/landing/artwork-digital-art.jpg",
    imageAlt: "Minimalist 3D sculptural arches balancing a frosted lavender orb above dark stone",
    tags: ["lighting-study", "shader-craft", "digital-sculpture"],
    likeCount: 214,
    comments: [
      {
        id: "fc-amara-1",
        authorName: anyaProfile.displayName,
        authorHandle: anyaProfile.username,
        initials: anyaProfile.avatarInitials,
        tone: anyaProfile.avatarTone,
        accent: anyaProfile.avatarAccent,
        avatarUrl: anyaProfile.avatarUrl,
        createdAt: "22 hours ago",
        content:
          "The soft refraction around that lavender sphere feels genuinely physical — like sea glass in morning fog.",
        likeCount: 11,
        replies: [],
      },
    ],
  },
  {
    id: elenaPost0.id,
    kind: elenaPost0.kind,
    discipline: "Graphic Design",
    authorUsername: elenaProfile.username,
    title: elenaPost0.title,
    content: elenaPost0.content,
    createdAt: "2 days ago",
    sortOrder: 6,
    projectRef: elenaPost0.projectRef,
    imageUrl: sanitizePreviewImageUrl(elenaPost0.imageUrl),
    imageAlt: elenaPost0.imageAlt,
    tags: elenaPost0.tags,
    likeCount: elenaPost0.likeCount + 64,
    comments: [
      {
        id: "fc-elena-1",
        authorName: "Hannah Lindqvist",
        authorHandle: "hannah_prose",
        initials: "HL",
        tone: "#344640",
        accent: "#E7DFD1",
        avatarUrl: "/images/landing/artwork-writing.jpg",
        createdAt: "1 day ago",
        content: "That discipline around a single hairline rule reads effortlessly in print too.",
        likeCount: 6,
        replies: [],
      },
    ],
  },
  {
    id: "feed-post-priya-kiln",
    kind: "Process Log",
    discipline: "Ceramics & Print",
    authorUsername: "priya_kiln",
    title: "Unloading the reduction kiln: wood-ash moss glaze meets linocut plates",
    content:
      "Tested three botanical linocut impressions directly beside our morning stoneware batch. The speckled ivory clay picked up a soft celadon halo along the rim that mirrors the hand-burnished block ink.",
    createdAt: "3 days ago",
    sortOrder: 5,
    projectRef: {
      id: "proj-stoneware-proof",
      title: "Riso & Stoneware Study No. 4",
      versionTag: "v1.4",
    },
    imageUrl: "/images/landing/artwork-ceramics.jpg",
    imageAlt: "Speckled cream and moss-green stoneware vessels beside botanical linocut print",
    tags: ["ceramics", "linocut", "tactile-craft"],
    likeCount: 137,
    comments: [],
  },
  {
    id: "feed-post-rohan-anim-critique",
    kind: "Critique Request",
    discipline: "Animation",
    authorUsername: "rohan_anim",
    title: "Question for fellow animators: subtle firefly cadence at 12fps vs 24fps",
    content:
      "Our conservatory scene holds painted backgrounds on twos, and we are debating whether the floating warm firefly particles should run on ones at 24fps for a dreamy shimmer or stay matched on twos so the hand-painted world stays cohesive. Curious how you balance mixed frame rates!",
    createdAt: "4 days ago",
    sortOrder: 4,
    excerptQuote:
      "Should ambient atmospheric particles run on ones for shimmer, or stay matched on twos with the brushwork?",
    imageUrl: null,
    tags: ["animation-craft", "frame-rate", "critique"],
    likeCount: 89,
    comments: [
      {
        id: "fc-rohan-1",
        authorName: "Mateo Silva",
        authorHandle: "mateo_ux",
        initials: "MS",
        tone: "#4A5952",
        accent: "#C8BDE0",
        avatarUrl: "/images/landing/artwork-uiux.jpg",
        createdAt: "3 days ago",
        content:
          "Staggering the gentle glow opacity softly at 24fps while keeping positional arcs on twos often feels magical without looking digital.",
        likeCount: 12,
        replies: [],
      },
    ],
  },
  {
    id: "feed-post-hannah-chapbook",
    kind: "Project Update",
    discipline: "Writing",
    authorUsername: "hannah_prose",
    title: "First stitched signatures for Field Notes on Quiet Cities",
    content:
      "Paired Kenji's travertine courtyard plates with Smyth-sewn 120gsm uncoated linen paper today. Having tactile margins and breathable column widths turned four scattered essays into one cohesive room.",
    createdAt: "5 days ago",
    sortOrder: 3,
    projectRef: {
      id: "proj-quiet-cities-zine",
      title: "Field Notes on Quiet Cities",
      versionTag: "v1.3",
    },
    imageUrl: "/images/landing/artwork-writing.jpg",
    imageAlt: "Open cloth-bound essay chapbook on natural linen with eucalyptus sprig and pen",
    tags: ["chapbook", "bookbinding", "collaboration"],
    likeCount: 124,
    comments: [],
  },
  {
    id: "feed-post-elena-type-discussion",
    kind: "Critique Request",
    discipline: "Graphic Design",
    authorUsername: elenaProfile.username,
    title: "Serif italics paired with technical monospace: how sparse is too sparse?",
    content:
      "Designing metadata tags for cultural exhibition catalogs this week. Right now every plate gets only a figure number in monospace, an Instrument Serif italic title, and one hair-thin sage rule. Would you add medium dimensions here or keep it purely atmospheric?",
    createdAt: "6 days ago",
    sortOrder: 2,
    imageUrl: null,
    tags: ["typography", "swiss-grid", "critique"],
    likeCount: 76,
    comments: [],
  },
];

export const SUGGESTED_CREATOR_HANDLES: string[] = [
  "rohan_anim",
  "mateo_ux",
  "hannah_prose",
  "priya_kiln",
  "amara_3d",
];

export const COMMUNITY_HIGHLIGHTS: CommunityHighlightItem[] = [
  {
    id: "highlight-critique",
    eyebrow: "Open Studio Salon",
    title: "Autumn Light & Atmospheric Color Key Exchange",
    summary:
      "Makers across 2D animation, gouache illustration, and architectural film are sharing work-in-progress studies for generous peer critique this week.",
    creatorUsername: "anya_art",
    creatorLabel: "Hosted with @anya_art & @rohan_anim",
    discipline: "Animation",
    accentTone: "lavender",
  },
  {
    id: "highlight-chapbook",
    eyebrow: "Collaborative Edition",
    title: "Field Notes on Quiet Cities — Paper Proofs",
    summary:
      "An architectural photo & essay chapbook co-authored across Kyoto and Gothenburg in 120gsm cotton signatures.",
    creatorUsername: "kenji_film",
    creatorLabel: "Co-created by @kenji_film & @hannah_prose",
    discipline: "Writing",
    accentTone: "sage",
  },
];
