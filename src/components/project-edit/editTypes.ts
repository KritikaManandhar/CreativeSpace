import { ProjectAsset, ProjectStatus, Visibility, CollaboratorRole } from "@/components/project-detail/projectTypes";

export interface EditProjectFormData {
  id: string;
  title: string;
  caption: string;
  description: string;
  category: string;
  status: ProjectStatus;
  visibility: Visibility;
  tags: string[];
  coverImageUrl: string;
  coverAssetId?: string;
  metadata: Record<string, any>;
  assets: ProjectAsset[];
}

export interface CategorySpecField {
  key: string;
  label: string;
  placeholder: string;
  type: "text" | "number" | "select";
  options?: string[];
  required?: boolean;
  helpText?: string;
}

export interface CategoryConfig {
  name: string;
  description: string;
  suggestedTags: string[];
  fields: CategorySpecField[];
}

export const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  Illustration: {
    name: "Illustration",
    description: "Vector artwork, digital paintings, concept art, character design",
    suggestedTags: ["vector", "conceptart", "characterdesign", "procreate", "digitalpainting", "editorial"],
    fields: [
      { key: "software", label: "Software / Tools", placeholder: "e.g. Procreate, Adobe Illustrator", type: "text" },
      { key: "style", label: "Art Style", placeholder: "e.g. Flat, Vector, Concept Art, Line Art", type: "text" },
      { key: "canvasWidth", label: "Canvas Width (px)", placeholder: "e.g. 4000", type: "number" },
      { key: "canvasHeight", label: "Canvas Height (px)", placeholder: "e.g. 3000", type: "number" },
      { key: "colorProfile", label: "Color Profile", placeholder: "e.g. sRGB Display P3, CMYK", type: "text" },
    ],
  },
  Photography: {
    name: "Photography",
    description: "Portraiture, landscapes, architectural, documentary, editorial photography",
    suggestedTags: ["portrait", "landscape", "35mm", "editorial", "cinematic", "film", "streetphotography"],
    fields: [
      { key: "camera", label: "Camera Body", placeholder: "e.g. Sony A7 IV, Leica M11", type: "text" },
      { key: "lens", label: "Lens", placeholder: "e.g. 24-70mm f/2.8 GM, 50mm f/1.4", type: "text" },
      { key: "aperture", label: "Aperture", placeholder: "e.g. f/2.8, f/1.4", type: "text" },
      { key: "iso", label: "ISO", placeholder: "e.g. 400", type: "number" },
      { key: "shutterSpeed", label: "Shutter Speed", placeholder: "e.g. 1/250s", type: "text" },
      { key: "focalLength", label: "Focal Length", placeholder: "e.g. 35mm, 85mm", type: "text" },
    ],
  },
  "Graphic Design": {
    name: "Graphic Design",
    description: "Brand identities, posters, print editorial, book layouts, iconography",
    suggestedTags: ["branding", "typography", "poster", "editorial", "identity", "print", "packaging"],
    fields: [
      { key: "designTool", label: "Primary Tools", placeholder: "e.g. InDesign, Illustrator, Figma", type: "text" },
      { key: "deliverables", label: "Deliverables", placeholder: "e.g. Brand Kit, Typography Specimen, Poster Series", type: "text" },
      { key: "clientType", label: "Context / Client", placeholder: "e.g. Cultural Institution, Self-Initiated, Commercial", type: "text" },
    ],
  },
  "UI/UX Design": {
    name: "UI/UX Design",
    description: "Web apps, mobile interfaces, design systems, interactive prototypes",
    suggestedTags: ["uiux", "figma", "designsystem", "mobileapp", "webapp", "interaction", "usability"],
    fields: [
      { key: "designTool", label: "Design Tool", placeholder: "e.g. Figma, Framer, Principle", type: "text" },
      { key: "platform", label: "Target Platform", placeholder: "e.g. Web, iOS, macOS, Cross-platform", type: "text" },
      { key: "colorPalette", label: "Color Palette Notes", placeholder: "e.g. Monochromatic Dark, Editorial Forest", type: "text" },
      { key: "typography", label: "Typography System", placeholder: "e.g. Serif / Mono hybrid", type: "text" },
    ],
  },
  "Digital Art": {
    name: "Digital Art",
    description: "Generative art, 3D renders, mixed media, matte painting, experimental visuals",
    suggestedTags: ["generative", "glitch", "3drender", "abstract", "surrealism", "photobash"],
    fields: [
      { key: "software", label: "Primary Engine / Software", placeholder: "e.g. Blender, Cinema 4D, TouchDesigner", type: "text" },
      { key: "renderEngine", label: "Render Engine / Technique", placeholder: "e.g. Cycles, Octane, Unreal Engine 5", type: "text" },
      { key: "resolution", label: "Render Resolution", placeholder: "e.g. 4K Ultra HD (3840x2160)", type: "text" },
    ],
  },
  Animation: {
    name: "Animation",
    description: "2D frame-by-frame, 3D CGI, motion graphics, kinetic type, stop-motion",
    suggestedTags: ["motiongraphics", "2danimation", "3danimation", "character", "loop", "kinetic"],
    fields: [
      { key: "fps", label: "Frame Rate (FPS)", placeholder: "e.g. 24, 30, 60", type: "number" },
      { key: "resolution", label: "Resolution", placeholder: "e.g. 1920x1080, 4K", type: "text" },
      { key: "software", label: "Animation Software", placeholder: "e.g. After Effects, Blender, Toon Boom", type: "text" },
      { key: "technique", label: "Technique", placeholder: "e.g. 2D Frame-by-Frame, 3D CGI, Rigged", type: "text" },
    ],
  },
  Writing: {
    name: "Writing",
    description: "Narrative prose, poetry, critical essays, worldbuilding, scripts, monographs",
    suggestedTags: ["fiction", "poetry", "essay", "monograph", "worldbuilding", "screenplay"],
    fields: [
      { key: "genre", label: "Genre / Discipline", placeholder: "e.g. Speculative Fiction, Critical Essay", type: "text" },
      { key: "wordCountTarget", label: "Word Count / Length", placeholder: "e.g. 4500", type: "number" },
      { key: "language", label: "Language", placeholder: "e.g. English, French, Japanese", type: "text" },
      { key: "format", label: "Publication Format", placeholder: "e.g. Monograph, Chapbook, Serial", type: "text" },
    ],
  },
  Music: {
    name: "Music",
    description: "Compositions, soundtrack scoring, beats, ambient soundscapes, field recordings",
    suggestedTags: ["ambient", "cinematic", "lofi", "soundtrack", "electronic", "synthwave", "acoustics"],
    fields: [
      { key: "bpm", label: "Beats Per Minute (BPM)", placeholder: "e.g. 120", type: "number" },
      { key: "key", label: "Musical Key", placeholder: "e.g. C Minor, F# Major", type: "text" },
      { key: "daw", label: "DAW / Studio", placeholder: "e.g. Ableton Live, Logic Pro, FL Studio", type: "text" },
      { key: "genre", label: "Musical Genre", placeholder: "e.g. Ambient Cinematic, Neo-Classical", type: "text" },
      { key: "timeSignature", label: "Time Signature", placeholder: "e.g. 4/4, 7/8", type: "text" },
    ],
  },
  "3D & Spatial": {
    name: "3D & Spatial",
    description: "Hard surface modeling, environment design, sculpts, spatial computing assets",
    suggestedTags: ["3dmodeling", "sculpt", "blender", "zbrush", "archviz", "spatial"],
    fields: [
      { key: "software", label: "3D Package", placeholder: "e.g. Blender, ZBrush, Houdini", type: "text" },
      { key: "polyCount", label: "Polygon Count / Density", placeholder: "e.g. 120k polygons (subdivided)", type: "text" },
      { key: "materials", label: "Shading & Texturing", placeholder: "e.g. Substance Painter, Procedural PBR", type: "text" },
    ],
  },
  Video: {
    name: "Video",
    description: "Short films, music videos, experimental cinema, visual essays, documentaries",
    suggestedTags: ["shortfilm", "cinematography", "colorgrading", "documentary", "visualessay"],
    fields: [
      { key: "resolution", label: "Resolution", placeholder: "e.g. 4K DCI, 1080p", type: "text" },
      { key: "aspectRatio", label: "Aspect Ratio", placeholder: "e.g. 2.39:1 Anamorphic, 16:9, 4:3", type: "text" },
      { key: "frameRate", label: "Frame Rate (FPS)", placeholder: "e.g. 24", type: "number" },
      { key: "colorSpace", label: "Color Grading Profile", placeholder: "e.g. DaVinci YRGB, ACEScc", type: "text" },
      { key: "cameraRig", label: "Camera & Sensor", placeholder: "e.g. ARRI Alexa Mini, RED Komodo", type: "text" },
    ],
  },
};

export const ALL_CATEGORIES = Object.keys(CATEGORY_CONFIGS);

export function getCategoryConfig(category?: string | null): CategoryConfig {
  if (!category) return CATEGORY_CONFIGS["Illustration"];
  if (CATEGORY_CONFIGS[category]) return CATEGORY_CONFIGS[category];
  // Match synonyms
  if (category === "Art" || category === "Digital Art") return CATEGORY_CONFIGS["Digital Art"] || CATEGORY_CONFIGS["Illustration"];
  if (category === "UIUX" || category === "UI/UX") return CATEGORY_CONFIGS["UI/UX Design"];
  return CATEGORY_CONFIGS["Illustration"];
}
