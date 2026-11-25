export interface ExploreCategory {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  count: string;
  artworkSrc: string;
  aspectClass: string;
  bgTone: string;
  borderTone: string;
  accentTone: string;
  textColor: string;
  featured?: boolean;
}

export interface ExploreProject {
  id: string;
  title: string;
  category: string;
  filterCategory: "Photography" | "Design" | "Illustration" | "Digital Art" | "Other";
  creator: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    avatarInitials: string;
    avatarTone: string;
    avatarAccent: string;
    specialty: string;
    isFollowing?: boolean;
  };
  coverImage: string;
  aspectClass: string; // e.g. 'aspect-[3/4]', 'aspect-[4/5]', 'aspect-[16/10]', 'aspect-[1/1]'
  colSpanClass: string; // e.g. 'col-span-1', 'col-span-1 md:col-span-2'
  likes: number;
  hasLiked?: boolean;
  hasBookmarked?: boolean;
  tags: string[];
  editionNote?: string;
  description?: string;
  views?: number;
  publishedAt: string;
  isPopular?: boolean;
  isRecent?: boolean;
}

export interface ExploreCreator {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  avatarInitials: string;
  avatarTone: string;
  avatarAccent: string;
  specialty: string;
  bio: string;
  location: string;
  followerCount: number;
  isFollowing: boolean;
  previewImages: string[];
  disciplineBadge: string;
}

export interface ExploreCollection {
  id: string;
  title: string;
  curatorNote: string;
  curatorName: string;
  curatorRole: string;
  projectCount: number;
  accentColor: string;
  tags: string[];
  primaryImage: string;
  secondaryImages: string[];
}

export const SEARCH_SUGGESTIONS = [
  "Minimalist Architecture",
  "Botanical Gouache",
  "Generative Typography",
  "Nordic Travertine",
  "3D Ambient Motion",
  "Analogue Synthesizer",
  "Swiss Editorial",
  "Ceramic Monolith",
];

export const EXPLORE_CATEGORIES: ExploreCategory[] = [
  {
    id: "cat-design",
    name: "Graphic Design",
    slug: "Design",
    tagline: "Swiss grids, visual systems & exhibition monographs",
    count: "2.4k works",
    artworkSrc: "/images/landing/artwork-graphic-design.jpg",
    aspectClass: "aspect-[16/10]",
    bgTone: "bg-[#203B35]",
    borderTone: "border-[#203B35]/20",
    accentTone: "#FAF8F3",
    textColor: "text-[#FAF8F3]",
    featured: true,
  },
  {
    id: "cat-photo",
    name: "Photography",
    slug: "Photography",
    tagline: "Medium-format architecture, light & brutalist silence",
    count: "3.8k works",
    artworkSrc: "/images/landing/artwork-photography.jpg",
    aspectClass: "aspect-[4/3]",
    bgTone: "bg-[#FAF8F3]",
    borderTone: "border-[#203B35]/15",
    accentTone: "#203B35",
    textColor: "text-[#203B35]",
  },
  {
    id: "cat-illust",
    name: "Illustration",
    slug: "Illustration",
    tagline: "Botanical gouache, celestial prints & editorial ink",
    count: "4.1k works",
    artworkSrc: "/images/landing/artwork-illustration.jpg",
    aspectClass: "aspect-[3/4]",
    bgTone: "bg-[#C8BDE0]/25",
    borderTone: "border-[#C8BDE0]/40",
    accentTone: "#203B35",
    textColor: "text-[#203B35]",
  },
  {
    id: "cat-uiux",
    name: "UI/UX Design",
    slug: "Design",
    tagline: "Refined digital ateliers, typography & serene flows",
    count: "1.9k works",
    artworkSrc: "/images/landing/artwork-uiux.jpg",
    aspectClass: "aspect-[4/3]",
    bgTone: "bg-[#EFECE2]",
    borderTone: "border-[#203B35]/15",
    accentTone: "#5D635F",
    textColor: "text-[#203B35]",
  },
  {
    id: "cat-digital",
    name: "Digital Art",
    slug: "Digital Art",
    tagline: "Generative geometry, luminescent fluid & celestial forms",
    count: "3.2k works",
    artworkSrc: "/images/landing/artwork-digital-art.jpg",
    aspectClass: "aspect-[16/10]",
    bgTone: "bg-[#162A26]",
    borderTone: "border-[#9DB5A5]/25",
    accentTone: "#9DB5A5",
    textColor: "text-[#F6F3EB]",
    featured: true,
  },
  {
    id: "cat-animation",
    name: "Animation",
    slug: "Other",
    tagline: "Kinetic motion, clay shaders & atmospheric dust",
    count: "1.2k works",
    artworkSrc: "/images/landing/artwork-animation.jpg",
    aspectClass: "aspect-[4/3]",
    bgTone: "bg-[#FAF8F3]",
    borderTone: "border-[#203B35]/15",
    accentTone: "#E85D3F",
    textColor: "text-[#203B35]",
  },
  {
    id: "cat-writing",
    name: "Writing",
    slug: "Other",
    tagline: "Critical creative theory, poetry & atelier essays",
    count: "840 works",
    artworkSrc: "/images/landing/artwork-writing.jpg",
    aspectClass: "aspect-[3/4]",
    bgTone: "bg-[#EFECE2]",
    borderTone: "border-[#203B35]/15",
    accentTone: "#282B2A",
    textColor: "text-[#282B2A]",
  },
  {
    id: "cat-3d",
    name: "3D Art",
    slug: "Digital Art",
    tagline: "Travertine sculptural monoliths & tactile material studies",
    count: "2.1k works",
    artworkSrc: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
    aspectClass: "aspect-[4/3]",
    bgTone: "bg-[#282B2A]",
    borderTone: "border-[#282B2A]/40",
    accentTone: "#FAF8F3",
    textColor: "text-[#FAF8F3]",
  },
  {
    id: "cat-arch",
    name: "Architecture",
    slug: "Photography",
    tagline: "Raw concrete sanctuaries, sacred light & spatial balance",
    count: "1.6k works",
    artworkSrc: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80",
    aspectClass: "aspect-[16/10]",
    bgTone: "bg-[#FAF8F3]",
    borderTone: "border-[#203B35]/15",
    accentTone: "#203B35",
    textColor: "text-[#203B35]",
  },
  {
    id: "cat-music",
    name: "Music",
    slug: "Other",
    tagline: "Modular synth soundscapes, neoclassical tape & acoustic tone",
    count: "950 works",
    artworkSrc: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80",
    aspectClass: "aspect-[4/3]",
    bgTone: "bg-[#9DB5A5]/20",
    borderTone: "border-[#9DB5A5]/40",
    accentTone: "#203B35",
    textColor: "text-[#203B35]",
  },
];

export const EXPLORE_PROJECTS: ExploreProject[] = [
  {
    id: "proj-1",
    title: "Nocturne Flora & Orbital Botanica",
    category: "Illustration",
    filterCategory: "Illustration",
    creator: {
      id: "creator-anya",
      username: "anya_art",
      displayName: "Anya Sharma",
      avatarInitials: "AS",
      avatarTone: "#203B35",
      avatarAccent: "#C8BDE0",
      specialty: "Botanical & Gouache Illustrator",
      isFollowing: false,
    },
    coverImage: "/images/landing/artwork-illustration.jpg",
    aspectClass: "aspect-[3/4]",
    colSpanClass: "col-span-1 md:col-span-1 xl:col-span-1",
    likes: 384,
    hasLiked: false,
    hasBookmarked: false,
    tags: ["botanical", "gouache", "editorial", "celestial"],
    editionNote: "Gouache & Ink · v3",
    description: "A 12-piece editorial illustration suite capturing rare Scandinavian alpine flora through gouache and fine ink line-work. Developed for the Spring Cultural Biennale exhibition.",
    views: 4890,
    publishedAt: "2 hours ago",
    isPopular: true,
    isRecent: true,
  },
  {
    id: "proj-2",
    title: "Travertine Silence: Reflections at Villa Ada",
    category: "Photography",
    filterCategory: "Photography",
    creator: {
      id: "creator-kenji",
      username: "kenji_film",
      displayName: "Kenji Sato",
      avatarInitials: "KS",
      avatarTone: "#3B4A44",
      avatarAccent: "#9DB5A5",
      specialty: "Architectural Photographer",
      isFollowing: false,
    },
    coverImage: "/images/landing/artwork-photography.jpg",
    aspectClass: "aspect-[16/10]",
    colSpanClass: "col-span-1 md:col-span-2 xl:col-span-2",
    likes: 642,
    hasLiked: false,
    hasBookmarked: true,
    tags: ["architecture", "mediumformat", "minimalism", "stone"],
    editionNote: "Medium Format · 6×7",
    description: "Medium-format architectural photographic series exploring silence, water reflections, and natural daylight penetrating travertine colonnades at dusk.",
    views: 7120,
    publishedAt: "5 hours ago",
    isPopular: true,
    isRecent: false,
  },
  {
    id: "proj-3",
    title: "Solstice Biennial: Typographic Identity & Grid",
    category: "Graphic Design",
    filterCategory: "Design",
    creator: {
      id: "creator-elena",
      username: "elena_type",
      displayName: "Elena Rostova",
      avatarInitials: "ER",
      avatarTone: "#2D3C38",
      avatarAccent: "#F6F3EB",
      specialty: "Visual Systems & Typographer",
      isFollowing: true,
    },
    coverImage: "/images/landing/artwork-graphic-design.jpg",
    aspectClass: "aspect-[4/5]",
    colSpanClass: "col-span-1 md:col-span-1 xl:col-span-1",
    likes: 512,
    hasLiked: true,
    hasBookmarked: false,
    tags: ["typography", "poster", "swissgrid", "editorial"],
    editionNote: "Screenprinted Exhibition Folio",
    description: "Custom editorial identity system combining Swiss mathematical proportions with tactile screen-printed archival inks on warm cotton rag.",
    views: 5310,
    publishedAt: "1 day ago",
    isPopular: true,
    isRecent: true,
  },
  {
    id: "proj-4",
    title: "Aurae: Generative Bioluminescence in Space",
    category: "Digital Art",
    filterCategory: "Digital Art",
    creator: {
      id: "creator-soren",
      username: "soren_code",
      displayName: "Søren Lindqvist",
      avatarInitials: "SL",
      avatarTone: "#162A26",
      avatarAccent: "#C8BDE0",
      specialty: "Creative Technologist & Shader Artist",
      isFollowing: false,
    },
    coverImage: "/images/landing/artwork-digital-art.jpg",
    aspectClass: "aspect-[1/1]",
    colSpanClass: "col-span-1 md:col-span-1 xl:col-span-1",
    likes: 429,
    hasLiked: false,
    hasBookmarked: false,
    tags: ["generative", "glsl", "fluid", "luminescence"],
    editionNote: "Custom WebGL Compute Shader",
    description: "Real-time particle simulation mimicking deep-sea bioluminescence reacting to ambient acoustic frequencies.",
    views: 3980,
    publishedAt: "3 days ago",
    isPopular: false,
    isRecent: true,
  },
  {
    id: "proj-5",
    title: "Sanctuary: Tactile Ceramic Vessels & Ash Glaze",
    category: "Ceramics & Print",
    filterCategory: "Other",
    creator: {
      id: "creator-mira",
      username: "mira_atelier",
      displayName: "Mira Kovač",
      avatarInitials: "MK",
      avatarTone: "#4A4036",
      avatarAccent: "#EFECE2",
      specialty: "Ceramicist & Sculptor",
      isFollowing: false,
    },
    coverImage: "/images/landing/artwork-ceramics.jpg",
    aspectClass: "aspect-[4/3]",
    colSpanClass: "col-span-1 md:col-span-1 xl:col-span-1",
    likes: 318,
    hasLiked: false,
    hasBookmarked: false,
    tags: ["ceramics", "woodfired", "tactile", "sculpture"],
    editionNote: "Anagama Kiln · Edition 1 of 8",
    description: "Hand-thrown stoneware vessels fired for five consecutive days in a traditional wood kiln using wild applewood ash.",
    views: 2840,
    publishedAt: "4 days ago",
    isPopular: false,
    isRecent: false,
  },
  {
    id: "proj-6",
    title: "Atelier OS: Digital Interface for Spatial Audio",
    category: "UI/UX Design",
    filterCategory: "Design",
    creator: {
      id: "creator-elena",
      username: "elena_type",
      displayName: "Elena Rostova",
      avatarInitials: "ER",
      avatarTone: "#2D3C38",
      avatarAccent: "#F6F3EB",
      specialty: "Visual Systems & Typographer",
      isFollowing: true,
    },
    coverImage: "/images/landing/artwork-uiux.jpg",
    aspectClass: "aspect-[16/10]",
    colSpanClass: "col-span-1 md:col-span-2 xl:col-span-2",
    likes: 724,
    hasLiked: false,
    hasBookmarked: true,
    tags: ["interface", "designsystem", "minimalism", "spatial"],
    editionNote: "Figma Community Component Kit",
    description: "A calm, unhurried desktop OS concept designed exclusively for sound artists, field recordists, and acoustic archivists.",
    views: 9240,
    publishedAt: "6 days ago",
    isPopular: true,
    isRecent: false,
  },
  {
    id: "proj-7",
    title: "Chronicles of Monolith: Kinetic Chapter Studies",
    category: "Animation",
    filterCategory: "Digital Art",
    creator: {
      id: "creator-rohan",
      username: "rohan_anim",
      displayName: "Rohan Verma",
      avatarInitials: "RV",
      avatarTone: "#203B35",
      avatarAccent: "#E5A93C",
      specialty: "3D Motion Director",
      isFollowing: false,
    },
    coverImage: "/images/landing/artwork-animation.jpg",
    aspectClass: "aspect-[4/5]",
    colSpanClass: "col-span-1 md:col-span-1 xl:col-span-1",
    likes: 476,
    hasLiked: false,
    hasBookmarked: false,
    tags: ["blender", "clay", "cinematography", "motion"],
    editionNote: "Blender Cycles · 24fps",
    description: "Atmospheric test sequences examining how ancient celestial monuments react to solar storms, featuring handcrafted procedural shaders.",
    views: 4120,
    publishedAt: "1 week ago",
    isPopular: true,
    isRecent: false,
  },
  {
    id: "proj-8",
    title: "The Architecture of Silence: Essays on Solitude",
    category: "Writing",
    filterCategory: "Other",
    creator: {
      id: "creator-isobel",
      username: "isobel_scribe",
      displayName: "Isobel Thorne",
      avatarInitials: "IT",
      avatarTone: "#282B2A",
      avatarAccent: "#9DB5A5",
      specialty: "Architecture Critic & Essayist",
      isFollowing: false,
    },
    coverImage: "/images/landing/artwork-writing.jpg",
    aspectClass: "aspect-[3/4]",
    colSpanClass: "col-span-1 md:col-span-1 xl:col-span-1",
    likes: 295,
    hasLiked: false,
    hasBookmarked: false,
    tags: ["theory", "essay", "architecture", "monograph"],
    editionNote: "Risograph Bound Pamphlet",
    description: "A series of seven meditative essays examining the relationship between architectural scale, silence, and creative focus.",
    views: 2900,
    publishedAt: "1 week ago",
    isPopular: false,
    isRecent: false,
  },
  {
    id: "proj-9",
    title: "Nordic Brutalism & Monolithic Concrete",
    category: "Photography",
    filterCategory: "Photography",
    creator: {
      id: "creator-kenji",
      username: "kenji_film",
      displayName: "Kenji Sato",
      avatarInitials: "KS",
      avatarTone: "#3B4A44",
      avatarAccent: "#9DB5A5",
      specialty: "Architectural Photographer",
      isFollowing: false,
    },
    coverImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80",
    aspectClass: "aspect-[4/3]",
    colSpanClass: "col-span-1 md:col-span-1 xl:col-span-1",
    likes: 580,
    hasLiked: false,
    hasBookmarked: false,
    tags: ["brutalism", "scandinavia", "filmphotography", "shadows"],
    editionNote: "Monochrome Gelatin Silver Print",
    description: "Documenting monolithic concrete worship spaces in Oslo, Helsinki, and Stockholm on Tri-X 400 film.",
    views: 6150,
    publishedAt: "2 weeks ago",
    isPopular: true,
    isRecent: false,
  },
];

export const EXPLORE_CREATORS: ExploreCreator[] = [
  {
    id: "creator-anya",
    username: "anya_art",
    displayName: "Anya Sharma",
    avatarInitials: "AS",
    avatarTone: "#203B35",
    avatarAccent: "#C8BDE0",
    specialty: "Botanical & Gouache Illustrator",
    bio: "Creating contemplative nature studies, astrological charts, and editorial monographs using natural pigment gouaches.",
    location: "Stockholm, SE",
    followerCount: 3840,
    isFollowing: false,
    previewImages: [
      "/images/landing/artwork-illustration.jpg",
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1582561424760-0321d75e81fa?w=400&auto=format&fit=crop&q=80",
    ],
    disciplineBadge: "Illustration",
  },
  {
    id: "creator-kenji",
    username: "kenji_film",
    displayName: "Kenji Sato",
    avatarInitials: "KS",
    avatarTone: "#3B4A44",
    avatarAccent: "#9DB5A5",
    specialty: "Architectural & Still Life Photographer",
    bio: "Documenting brutalist concrete structures and serene travertine sanctuaries across Scandinavia and Japan on medium format 6x7.",
    location: "Kyoto / Zurich",
    followerCount: 5210,
    isFollowing: false,
    previewImages: [
      "/images/landing/artwork-photography.jpg",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&auto=format&fit=crop&q=80",
    ],
    disciplineBadge: "Photography",
  },
  {
    id: "creator-elena",
    username: "elena_type",
    displayName: "Elena Rostova",
    avatarInitials: "ER",
    avatarTone: "#2D3C38",
    avatarAccent: "#F6F3EB",
    specialty: "Visual Systems & Senior Typographer",
    bio: "Obsessed with editorial balance, Swiss grid discipline, display typefaces, and tactile cultural exhibition identities.",
    location: "Berlin, DE",
    followerCount: 6730,
    isFollowing: true,
    previewImages: [
      "/images/landing/artwork-graphic-design.jpg",
      "/images/landing/artwork-uiux.jpg",
      "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80",
    ],
    disciplineBadge: "Graphic Design",
  },
  {
    id: "creator-soren",
    username: "soren_code",
    displayName: "Søren Lindqvist",
    avatarInitials: "SL",
    avatarTone: "#162A26",
    avatarAccent: "#C8BDE0",
    specialty: "Creative Technologist & Shader Artist",
    bio: "Crafting real-time GLSL fluid simulations, generative geometry, and celestial projection maps for interactive installations.",
    location: "Copenhagen, DK",
    followerCount: 4180,
    isFollowing: false,
    previewImages: [
      "/images/landing/artwork-digital-art.jpg",
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400&auto=format&fit=crop&q=80",
    ],
    disciplineBadge: "Digital Art",
  },
];

export const EXPLORE_COLLECTIONS: ExploreCollection[] = [
  {
    id: "col-1",
    title: "The Celestial Monograph: Space & Botanical Solitude",
    curatorNote: "A study of quiet botanical forms illuminated by subtle crescent moons, astronomical geometries, and soft gouache pigments.",
    curatorName: "CreativeSpace Editorial",
    curatorRole: "Curator's Archive",
    projectCount: 14,
    accentColor: "#C8BDE0",
    tags: ["Curator's Choice", "Botanical", "Celestial"],
    primaryImage: "/images/landing/artwork-illustration.jpg",
    secondaryImages: [
      "/images/landing/artwork-digital-art.jpg",
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80",
    ],
  },
  {
    id: "col-2",
    title: "Brutalist Travertine: Modern Architecture & Monoliths",
    curatorNote: "Capturing monumental silence, pure stone textures, and sacred natural daylight across travertine archways and reflecting pools.",
    curatorName: "Kenji Sato & Guest Curators",
    curatorRole: "Guest Portfolio",
    projectCount: 9,
    accentColor: "#9DB5A5",
    tags: ["Architecture", "Medium Format", "Minimalism"],
    primaryImage: "/images/landing/artwork-photography.jpg",
    secondaryImages: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80",
      "/images/landing/artwork-ceramics.jpg",
    ],
  },
  {
    id: "col-3",
    title: "Kinetic Glyphs & Generative Swiss Typology",
    curatorNote: "Where rigorous grid tradition meets dynamic motion: kinetic posters, variable fonts, and modular identity systems.",
    curatorName: "Elena Rostova",
    curatorRole: "Studio Showcase",
    projectCount: 18,
    accentColor: "#203B35",
    tags: ["Swiss Grid", "Typography", "Systems"],
    primaryImage: "/images/landing/artwork-graphic-design.jpg",
    secondaryImages: [
      "/images/landing/artwork-uiux.jpg",
      "/images/landing/artwork-animation.jpg",
    ],
  },
];
