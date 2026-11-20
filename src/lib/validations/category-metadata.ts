import { z } from "zod";

export const IllustrationMetadataSchema = z.object({
  software: z.string().min(1, "Software is required (e.g. Procreate, Photoshop)"),
  style: z.string().min(1, "Style is required (e.g. Flat, Vector, Concept Art)"),
  canvasWidth: z.coerce.number().positive("Canvas width must be a positive integer"),
  canvasHeight: z.coerce.number().positive("Canvas height must be a positive integer"),
  colorProfile: z.string().optional(),
});

export const PhotographyMetadataSchema = z.object({
  camera: z.string().min(1, "Camera body is required (e.g. Sony A7 IV)"),
  lens: z.string().min(1, "Lens is required (e.g. 24-70mm f/2.8)"),
  aperture: z.string().min(1, "Aperture is required (e.g. f/2.8)"),
  iso: z.coerce.number().positive("ISO must be a positive integer (e.g. 400)"),
  shutterSpeed: z.string().optional(),
  focalLength: z.string().optional(),
});

export const MusicMetadataSchema = z.object({
  bpm: z.coerce.number().positive("BPM must be greater than 0"),
  key: z.string().min(1, "Musical key is required (e.g. C Major, F# Minor)"),
  daw: z.string().min(1, "DAW is required (e.g. Ableton Live, FL Studio, Logic)"),
  genre: z.string().min(1, "Genre is required (e.g. Ambient, Lo-Fi, Cinematic)"),
  timeSignature: z.string().optional(),
});

export const WritingMetadataSchema = z.object({
  genre: z.string().min(1, "Genre is required (e.g. Fiction, Non-Fiction, Screenplay)"),
  wordCountTarget: z.coerce.number().positive("Word count target must be positive"),
  language: z.string().min(1, "Language is required"),
  format: z.string().min(1, "Format is required (e.g. Novel, Essay, Short Story, Script)"),
});

export const AnimationMetadataSchema = z.object({
  fps: z.coerce.number().positive("Frame rate (FPS) is required (e.g. 24, 30, 60)"),
  resolution: z.string().min(1, "Resolution is required (e.g. 1920x1080, 4K)"),
  software: z.string().min(1, "Animation software is required (e.g. Blender, After Effects)"),
  technique: z.string().min(1, "Technique is required (e.g. 2D Frame-by-Frame, 3D CGI, Stop Motion)"),
});

export const VideoMetadataSchema = z.object({
  resolution: z.string().min(1, "Resolution is required (e.g. 4K, 1080p)"),
  aspectRatio: z.string().min(1, "Aspect ratio is required (e.g. 16:9, 9:16, 2.39:1)"),
  frameRate: z.coerce.number().positive("Frame rate is required"),
  colorSpace: z.string().optional(),
  cameraRig: z.string().optional(),
});

export const UIUXMetadataSchema = z.object({
  designTool: z.string().min(1, "Design tool is required (e.g. Figma, Framer)"),
  platform: z.string().min(1, "Target platform is required (e.g. Web, iOS, Android, Cross-platform)"),
  colorPalette: z.string().optional(),
  typography: z.string().optional(),
});

export const CategoryMetadataSchemas: Record<string, z.ZodObject<any>> = {
  Illustration: IllustrationMetadataSchema,
  Art: IllustrationMetadataSchema,
  Photography: PhotographyMetadataSchema,
  Music: MusicMetadataSchema,
  Writing: WritingMetadataSchema,
  Animation: AnimationMetadataSchema,
  Video: VideoMetadataSchema,
  "UI/UX": UIUXMetadataSchema,
  UIUX: UIUXMetadataSchema,
};

/**
 * Validates category-specific metadata using appropriate Zod schema
 */
export function validateCategoryMetadata(category: string, metadata: unknown) {
  const schema = CategoryMetadataSchemas[category];
  if (!schema) {
    // If category has no special schema, allow arbitrary key-value json or empty object
    return z.record(z.any()).safeParse(metadata || {});
  }
  return schema.safeParse(metadata);
}
