import { parseApiResponse } from "./api-client";
import {
  DISCIPLINE_CATEGORIES,
  DISCIPLINE_METADATA_FIELDS,
  type DisciplineFieldDefinition,
  type ProjectStatus,
  type Visibility,
} from "./workspace";

export const ALL_CATEGORIES = DISCIPLINE_CATEGORIES;

export interface CategoryConfig {
  category: string;
  fields: DisciplineFieldDefinition[];
}

export const CATEGORY_CONFIGS: Record<string, CategoryConfig> = Object.fromEntries(
  Object.entries(DISCIPLINE_METADATA_FIELDS).map(([category, fields]) => [
    category,
    { category, fields },
  ])
);

export function getCategoryConfig(category: string): CategoryConfig {
  return (
    CATEGORY_CONFIGS[category] || {
      category,
      fields: [],
    }
  );
}

export interface EditProjectFormData {
  title: string;
  description: string;
  category: string;
  status: ProjectStatus;
  visibility: Visibility;
  tags: string[];
  metadata: Record<string, string>;
}

export interface EditableProjectRecord {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  status: ProjectStatus;
  visibility: Visibility;
  tags?: string[];
  projectTags?: Array<{ tag: { name: string } }>;
  metadata?: Record<string, unknown> | null;
}

export function toEditProjectFormData(project: EditableProjectRecord): EditProjectFormData {
  const tags = Array.isArray(project.tags)
    ? project.tags
    : Array.isArray(project.projectTags)
      ? project.projectTags.map((pt) => pt.tag.name)
      : [];

  const metadata: Record<string, string> = {};
  if (project.metadata && typeof project.metadata === "object") {
    for (const [key, value] of Object.entries(project.metadata)) {
      if (value !== null && value !== undefined) {
        metadata[key] = String(value);
      }
    }
  }

  return {
    title: project.title || "",
    description: project.description || "",
    category: project.category || ALL_CATEGORIES[0],
    status: project.status || "Idea",
    visibility: project.visibility || "Private",
    tags,
    metadata,
  };
}

export function validateProjectTitle(title: string): string | null {
  const trimmed = title.trim();
  if (trimmed.length < 2) {
    return "Title must be at least 2 characters";
  }
  if (trimmed.length > 120) {
    return "Title cannot exceed 120 characters";
  }
  return null;
}

export function computeIsProjectFormDirty(
  initial: EditProjectFormData,
  current: EditProjectFormData
): boolean {
  return JSON.stringify(initial) !== JSON.stringify(current);
}

export function buildProjectPatchPayload(
  formData: EditProjectFormData,
  numericFieldKeys: Set<string> = new Set(["canvasWidth", "canvasHeight", "iso", "bpm", "wordCountTarget", "fps", "frameRate"])
) {
  const metadataPayload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(formData.metadata)) {
    const trimmed = typeof value === "string" ? value.trim() : value;
    if (trimmed === "" || trimmed === undefined) continue;
    if (numericFieldKeys.has(key)) {
      const parsed = Number(trimmed);
      if (Number.isFinite(parsed)) {
        metadataPayload[key] = parsed;
      }
    } else {
      metadataPayload[key] = trimmed;
    }
  }

  return {
    title: formData.title.trim(),
    description: formData.description.trim() || null,
    category: formData.category,
    status: formData.status,
    visibility: formData.visibility,
    tags: formData.tags,
    metadata: metadataPayload,
  };
}

export async function fetchProjectForEditing(
  projectId: string
): Promise<EditProjectFormData> {
  const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
    cache: "no-store",
  });
  const project = await parseApiResponse<EditableProjectRecord>(
    res,
    "Failed to load project for editing"
  );
  return toEditProjectFormData(project);
}

export async function updateProjectDetails(
  projectId: string,
  formData: EditProjectFormData
): Promise<EditableProjectRecord> {
  const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildProjectPatchPayload(formData)),
  });
  return parseApiResponse<EditableProjectRecord>(res, "Failed to update project");
}

export async function deleteProjectById(
  projectId: string
): Promise<{ deleted: boolean }> {
  const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
    method: "DELETE",
  });
  return parseApiResponse<{ deleted: boolean }>(res, "Failed to delete project");
}
