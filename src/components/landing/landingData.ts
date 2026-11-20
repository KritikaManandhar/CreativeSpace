export type CreativeDiscipline =
  | "All"
  | "Illustration"
  | "Photography"
  | "Graphic Design"
  | "UI/UX Design"
  | "Digital Art"
  | "Animation"
  | "Writing"
  | "Ceramics & Print";

export interface ShowcaseProject {
  id: string;
  title: string;
  discipline: Exclude<CreativeDiscipline, "All">;
  discoverCategory: string;
  creatorName: string;
  creatorHandle: string;
  creatorRole: string;
  avatarTone: string;
  avatarAccent: string;
  avatarInitials: string;
  imageSrc: string;
  imageAlt: string;
  aspectClass: string;
  columnIndex: 0 | 1 | 2;
  likes: number;
  editionNote: string;
}

export const SHOWCASE_DISCIPLINES: CreativeDiscipline[] = [
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

export const SHOWCASE_PROJECTS: ShowcaseProject[] = [
  {
    id: "nocturne-flora",
    title: "Nocturne Flora & Orbit",
    discipline: "Illustration",
    discoverCategory: "Illustration",
    creatorName: "Anya Sharma",
    creatorHandle: "@anya_art",
    creatorRole: "Editorial Illustrator",
    avatarTone: "#203B35",
    avatarAccent: "#C8BDE0",
    avatarInitials: "AS",
    imageSrc: "/images/landing/artwork-illustration.jpg",
    imageAlt: "Gouache and ink botanical illustration with subtle crescent moon and sage orbital arcs",
    aspectClass: "aspect-[3/4]",
    columnIndex: 0,
    likes: 284,
    editionNote: "Gouache & Ink · v3",
  },
  {
    id: "silence-north-pier",
    title: "Silence at Travertine Court",
    discipline: "Photography",
    discoverCategory: "Photography",
    creatorName: "Kenji Sato",
    creatorHandle: "@kenji_film",
    creatorRole: "Architectural Photographer",
    avatarTone: "#3B4A44",
    avatarAccent: "#9DB5A5",
    avatarInitials: "KS",
    imageSrc: "/images/landing/artwork-photography.jpg",
    imageAlt: "Medium-format architectural photograph of sunlit travertine arches over a still reflecting pool",
    aspectClass: "aspect-[4/3]",
    columnIndex: 1,
    likes: 196,
    editionNote: "Medium Format · 6×7",
  },
  {
    id: "solstice-biennial",
    title: "Solstice Biennial Print Series",
    discipline: "Graphic Design",
    discoverCategory: "Illustration",
    creatorName: "Elena Rostova",
    creatorHandle: "@elena_type",
    creatorRole: "Visual Systems Designer",
    avatarTone: "#2D3C38",
    avatarAccent: "#F6F3EB",
    avatarInitials: "ER",
    imageSrc: "/images/landing/artwork-graphic-design.jpg",
    imageAlt: "Minimalist Swiss-editorial exhibition poster featuring deep green arches and sage circles",
    aspectClass: "aspect-[4/5]",
    columnIndex: 2,
    likes: 342,
    editionNote: "Exhibition Print · Swiss Grid",
  },
  {
    id: "kinfolk-audio",
    title: "Loom — Tactile Listening Space",
    discipline: "UI/UX Design",
    discoverCategory: "UI/UX",
    creatorName: "Mateo Silva",
    creatorHandle: "@mateo_ux",
    creatorRole: "Product & Interface Designer",
    avatarTone: "#4A5952",
    avatarAccent: "#C8BDE0",
    avatarInitials: "MS",
    imageSrc: "/images/landing/artwork-uiux.jpg",
    imageAlt: "Minimalist editorial digital interface displayed on a tablet resting on natural travertine",
    aspectClass: "aspect-[4/3]",
    columnIndex: 0,
    likes: 231,
    editionNote: "Interactive Prototype",
  },
  {
    id: "celadon-vessels",
    title: "Celadon Vessels in Glass",
    discipline: "Digital Art",
    discoverCategory: "Illustration",
    creatorName: "Amara Okafor",
    creatorHandle: "@amara_3d",
    creatorRole: "3D Sculptural Artist",
    avatarTone: "#203B35",
    avatarAccent: "#9DB5A5",
    avatarInitials: "AO",
    imageSrc: "/images/landing/artwork-digital-art.jpg",
    imageAlt: "Minimalist 3D digital sculpture of matte sage arches, obsidian stone, and frosted lavender orb",
    aspectClass: "aspect-square",
    columnIndex: 1,
    likes: 318,
    editionNote: "3D Lighting Study",
  },
  {
    id: "field-notes-quiet",
    title: "Field Notes on Quiet Cities",
    discipline: "Writing",
    discoverCategory: "Writing",
    creatorName: "Hannah Lindqvist",
    creatorHandle: "@hannah_prose",
    creatorRole: "Essayist & Editor",
    avatarTone: "#344640",
    avatarAccent: "#E7DFD1",
    avatarInitials: "HL",
    imageSrc: "/images/landing/artwork-writing.jpg",
    imageAlt: "Open cloth-bound literary journal and chapbook pages on oatmeal linen with brass pen",
    aspectClass: "aspect-[4/5]",
    columnIndex: 2,
    likes: 164,
    editionNote: "Essay Chapbook · Issue 04",
  },
  {
    id: "conservatory-dusk",
    title: "Conservatory at Dusk — Frame 042",
    discipline: "Animation",
    discoverCategory: "Animation",
    creatorName: "Rohan Verma",
    creatorHandle: "@rohan_anim",
    creatorRole: "Director & 2D Animator",
    avatarTone: "#27413B",
    avatarAccent: "#C8BDE0",
    avatarInitials: "RV",
    imageSrc: "/images/landing/artwork-animation.jpg",
    imageAlt: "Hand-painted 2D animated film still of a glowing hillside glass conservatory under twilight sky",
    aspectClass: "aspect-[16/10]",
    columnIndex: 0,
    likes: 412,
    editionNote: "24 fps · Painted Cel",
  },
  {
    id: "stoneware-proof",
    title: "Riso & Stoneware Study No. 4",
    discipline: "Ceramics & Print",
    discoverCategory: "Photography",
    creatorName: "Priya Nair",
    creatorHandle: "@priya_kiln",
    creatorRole: "Ceramicist & Printmaker",
    avatarTone: "#3E4F48",
    avatarAccent: "#9DB5A5",
    avatarInitials: "PN",
    imageSrc: "/images/landing/artwork-ceramics.jpg",
    imageAlt: "Hand-thrown speckled cream and moss-green stoneware vessels beside a botanical linocut print",
    aspectClass: "aspect-square",
    columnIndex: 1,
    likes: 209,
    editionNote: "Stoneware & Linocut",
  },
];

export interface HeroCollageCard {
  id: string;
  title: string;
  discipline: string;
  creator: string;
  imageSrc: string;
  imageAlt: string;
  plateCode: string;
}

export const HERO_COLLAGE_WORKS: HeroCollageCard[] = [
  {
    id: "hero-illustration",
    title: "Nocturne Flora & Orbit",
    discipline: "Illustration",
    creator: "Anya Sharma",
    imageSrc: "/images/landing/artwork-illustration.jpg",
    imageAlt: "Editorial botanical and celestial gouache illustration",
    plateCode: "FIG. 01",
  },
  {
    id: "hero-photography",
    title: "Travertine Court",
    discipline: "Photography",
    creator: "Kenji Sato",
    imageSrc: "/images/landing/artwork-photography.jpg",
    imageAlt: "Fine-art architectural courtyard photograph",
    plateCode: "FIG. 02",
  },
  {
    id: "hero-graphic",
    title: "Solstice Print",
    discipline: "Graphic Design",
    creator: "Elena Rostova",
    imageSrc: "/images/landing/artwork-graphic-design.jpg",
    imageAlt: "Swiss-editorial geometric art poster",
    plateCode: "FIG. 03",
  },
  {
    id: "hero-uiux",
    title: "Loom Interface",
    discipline: "UI/UX Design",
    creator: "Mateo Silva",
    imageSrc: "/images/landing/artwork-uiux.jpg",
    imageAlt: "Minimalist editorial tablet interface design",
    plateCode: "FIG. 04",
  },
  {
    id: "hero-digital",
    title: "Celadon Vessels",
    discipline: "Digital Art",
    creator: "Amara Okafor",
    imageSrc: "/images/landing/artwork-digital-art.jpg",
    imageAlt: "Sculptural 3D celadon glass and stone still life",
    plateCode: "FIG. 05",
  },
];
