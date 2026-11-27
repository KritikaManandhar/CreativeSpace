"use client";

import {
  INITIAL_DASHBOARD_PROJECTS,
} from "@/data/mockDashboard";
import type {
  ProfileProjectItem,
  ProfileProjectVersion,
  ProjectGalleryAsset,
  ProjectContributorItem,
} from "@/data/mockProfiles";
import type { ProfileDisplayProject } from "@/components/profile/ProfileProjectCard";

const STORAGE_KEY = "creativespace_projects_v2";

/**
 * Enriches initial mock projects with rich metadata, overview, gallery assets,
 * technical specs, and contributors for complete exhibition readiness.
 */
function createDefaultProjects(): ProfileProjectItem[] {
  return INITIAL_DASHBOARD_PROJECTS.map((proj, index) => {
    const isGouacheFieldGuide = proj.id === "proj-gouache-swatches";
    const isCompleted = proj.status === "Completed";

    return {
      ...proj,
      isPublished: !isGouacheFieldGuide,
      fullDescription:
        proj.description +
        " Explored through tactile iterations, compositional balance, and archival color testing.",
      background:
        index % 2 === 0
          ? "Conceived during an unhurried seasonal residency examining natural light refractions, historical botanical plates, and celestial movements."
          : "Commissioned as an editorial exploration into sustainable pigments, tactile materials, and geometric typographic structures.",
      objectives:
        "1. Capture organic nuances through hand-ground pigment washes.\n2. Harmonize traditional craft mediums with digital presentation.\n3. Establish an open reproducible visual vocabulary.",
      creativeApproach:
        "Beginning with graphite thumbnails and pigment swatch studies on 300gsm cotton rag before moving to high-resolution archival digital scans and typographic balance.",
      projectType: isCompleted ? (index === 0 ? "Client" : "Personal") : "Personal",
      style:
        proj.discipline === "Illustration"
          ? "Botanical & Celestial Minimalist"
          : proj.discipline === "Photography"
          ? "Monochrome Medium-Format Architectural"
          : "Contemporary Swiss Editorial",
      duration: index === 0 ? "6 weeks" : "3 months",
      completionDate: isCompleted ? "2026-11-18" : undefined,
      canvasDimensions: "3840 × 2160 px",
      colorProfile: "Display P3",
      externalUrl:
        index === 0
          ? "https://creativespace.atelier/exhibits/nocturne-flora"
          : undefined,
      externalUrlLabel:
        index === 0 ? "Interactive Atelier Exhibition" : undefined,
      skills:
        proj.tags.length > 0
          ? proj.tags.map((t) => t.charAt(0).toUpperCase() + t.slice(1))
          : ["Composition", "Color Grading", "Art Direction"],
      galleryAssets: [
        {
          id: `${proj.id}-asset-1`,
          projectId: proj.id,
          mediaType: "image",
          fileName: `${proj.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-plate-1.jpg`,
          mediaUrl: proj.coverUrl,
          fileSize: 2450000,
          mimeType: "image/jpeg",
          caption: "Primary exhibition plate master",
        },
        {
          id: `${proj.id}-asset-2`,
          projectId: proj.id,
          mediaType: "image",
          fileName: "process-ink-swatches.jpg",
          mediaUrl:
            index % 2 === 0
              ? "/images/landing/artwork-ceramics.jpg"
              : "/images/landing/artwork-animation.jpg",
          fileSize: 1840000,
          mimeType: "image/jpeg",
          caption: "Material wash and swatch exploration",
        },
      ],
      contributors:
        proj.collaborators.length > 0
          ? proj.collaborators.map((c) => ({
              name: c.name,
              role: c.role,
              username: c.username,
              url: c.url || null,
              urlLabel: c.urlLabel || "View Portfolio",
            }))
          : [
              {
                name: "Anya Sharma",
                role: "Visual Lead & Atelier Artist",
                username: "anya_art",
                url: "https://anya.sharma.art",
                urlLabel: "Studio Website",
              },
            ],
      metadata: {
        background:
          index % 2 === 0
            ? "Conceived during an unhurried seasonal residency examining natural light refractions, historical botanical plates, and celestial movements."
            : "Commissioned as an editorial exploration into sustainable pigments, tactile materials, and geometric typographic structures.",
        objectives:
          "Capture organic nuances through hand-ground pigment washes, harmonizing traditional craft with digital presentation.",
        creativeApproach:
          "Beginning with graphite thumbnails and pigment swatch studies on 300gsm cotton rag before moving to high-resolution archival digital scans.",
        projectType: isCompleted ? (index === 0 ? "Client" : "Personal") : "Personal",
        style:
          proj.discipline === "Illustration"
            ? "Botanical & Celestial Minimalist"
            : "Contemporary Swiss Editorial",
        duration: index === 0 ? "6 weeks" : "3 months",
        completionDate: isCompleted ? "2026-11-18" : undefined,
        canvasDimensions: "3840 × 2160 px",
        colorProfile: "Display P3",
        projectUrl:
          index === 0
            ? "https://creativespace.atelier/exhibits/nocturne-flora"
            : undefined,
        externalUrl:
          index === 0
            ? "https://creativespace.atelier/exhibits/nocturne-flora"
            : undefined,
        externalUrlLabel:
          index === 0 ? "Interactive Atelier Exhibition" : undefined,
        skills: proj.tags,
        software: proj.tools,
        tools: proj.tools,
        credits:
          proj.collaborators.length > 0
            ? proj.collaborators.map((c) => ({
                name: c.name,
                role: c.role,
                username: c.username,
                url: c.url || null,
                urlLabel: c.urlLabel || "View Portfolio",
              }))
            : undefined,
      },
    };
  });
}

/**
 * Retrieve all projects from persistent storage or default seeds.
 */
export function getStoredProjects(username?: string): ProfileProjectItem[] {
  if (typeof window === "undefined") {
    return createDefaultProjects();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaults = createDefaultProjects();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    const defaults = createDefaultProjects();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  } catch {
    return createDefaultProjects();
  }
}

/**
 * Save projects to localStorage and dispatch custom update event.
 */
export function saveStoredProjects(projects: ProfileProjectItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    window.dispatchEvent(
      new CustomEvent("creativespace_projects_updated", { detail: projects })
    );
  } catch {
    // Graceful fallback
  }
}

/**
 * Subscribe to project changes across components and browser windows.
 */
export function subscribeToProjects(
  callback: (projects: ProfileProjectItem[]) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  const handler = (e: Event) => {
    const custom = e as CustomEvent<ProfileProjectItem[]>;
    if (custom.detail) {
      callback(custom.detail);
    } else {
      callback(getStoredProjects());
    }
  };

  window.addEventListener("creativespace_projects_updated", handler);
  window.addEventListener("storage", handler);

  return () => {
    window.removeEventListener("creativespace_projects_updated", handler);
    window.removeEventListener("storage", handler);
  };
}

/**
 * Create or save a new project to the persistent store.
 */
export function createStoredProject(
  projectData: Partial<ProfileProjectItem>
): ProfileProjectItem {
  const current = getStoredProjects();
  const id = projectData.id || `proj-${Date.now()}`;
  const now = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const fullProject: ProfileProjectItem = {
    id,
    title: projectData.title?.trim() || "Untitled Project",
    discipline: projectData.discipline || "Illustration",
    description: projectData.description?.trim() || "New project created in atelier.",
    versionTag: projectData.versionTag || "v1.0 · Initial Release",
    status: projectData.status || "InProgress",
    featured: Boolean(projectData.featured),
    coverUrl: projectData.coverUrl || "/images/landing/artwork-illustration.jpg",
    coverAlt: projectData.coverAlt || projectData.title || "Project cover",
    tags: projectData.tags || [projectData.discipline?.toLowerCase() || "studio"],
    tools: projectData.tools || ["CreativeSpace Atelier"],
    updatedAt: "Just now",
    likeCount: projectData.likeCount || 0,
    commentCount: projectData.commentCount || 0,
    collaborators: projectData.collaborators || [],
    versions: projectData.versions || [
      {
        version: "v1.0",
        label: "Initial Spark",
        date: "Today",
        status: "Draft",
        note: "Opened in personal atelier.",
      },
    ],
    isPublished: projectData.isPublished !== undefined ? projectData.isPublished : true,
    fullDescription: projectData.fullDescription,
    background: projectData.background,
    objectives: projectData.objectives,
    creativeApproach: projectData.creativeApproach,
    galleryAssets: projectData.galleryAssets || [],
    skills: projectData.skills || [],
    projectType: projectData.projectType,
    style: projectData.style,
    duration: projectData.duration,
    completionDate: projectData.completionDate,
    canvasDimensions: projectData.canvasDimensions,
    colorProfile: projectData.colorProfile,
    externalUrl: projectData.externalUrl,
    externalUrlLabel: projectData.externalUrlLabel,
    contributors: projectData.contributors || [],
    metadata: {
      ...(projectData.metadata || {}),
      fullDescription: projectData.fullDescription,
      background: projectData.background,
      objectives: projectData.objectives,
      creativeApproach: projectData.creativeApproach,
      projectType: projectData.projectType,
      style: projectData.style,
      duration: projectData.duration,
      completionDate: projectData.completionDate,
      canvasDimensions: projectData.canvasDimensions,
      colorProfile: projectData.colorProfile,
      projectUrl: projectData.externalUrl,
      externalUrl: projectData.externalUrl,
      externalUrlLabel: projectData.externalUrlLabel,
      skills: projectData.skills,
      tools: projectData.tools,
      software: projectData.tools,
      galleryAssets: projectData.galleryAssets,
      credits: projectData.contributors,
      contributors: projectData.contributors,
      publishedAt: projectData.isPublished ? now : undefined,
    },
  };

  const next = [fullProject, ...current.filter((p) => p.id !== id)];
  saveStoredProjects(next);
  return fullProject;
}

/**
 * Update an existing project in persistent storage.
 */
export function updateStoredProject(
  projectId: string,
  updates: Partial<ProfileProjectItem>
): ProfileProjectItem | null {
  const current = getStoredProjects();
  const existing = current.find((p) => p.id === projectId);
  if (!existing) return null;

  const mergedMetadata = {
    ...(existing.metadata || {}),
    ...(updates.metadata || {}),
    fullDescription: updates.fullDescription ?? existing.fullDescription,
    background: updates.background ?? existing.background,
    objectives: updates.objectives ?? existing.objectives,
    creativeApproach: updates.creativeApproach ?? existing.creativeApproach,
    projectType: updates.projectType ?? existing.projectType,
    style: updates.style ?? existing.style,
    duration: updates.duration ?? existing.duration,
    completionDate: updates.completionDate ?? existing.completionDate,
    canvasDimensions: updates.canvasDimensions ?? existing.canvasDimensions,
    colorProfile: updates.colorProfile ?? existing.colorProfile,
    projectUrl: updates.externalUrl ?? existing.externalUrl,
    externalUrl: updates.externalUrl ?? existing.externalUrl,
    externalUrlLabel: updates.externalUrlLabel ?? existing.externalUrlLabel,
    skills: updates.skills ?? existing.skills,
    tools: updates.tools ?? existing.tools,
    software: updates.tools ?? existing.tools,
    galleryAssets: updates.galleryAssets ?? existing.galleryAssets,
    credits: updates.contributors ?? existing.contributors,
    contributors: updates.contributors ?? existing.contributors,
  };

  const updated: ProfileProjectItem = {
    ...existing,
    ...updates,
    updatedAt: "Just now",
    metadata: mergedMetadata,
  };

  const next = current.map((p) => (p.id === projectId ? updated : p));
  saveStoredProjects(next);
  return updated;
}

/**
 * Delete a project from storage.
 */
export function deleteStoredProject(projectId: string): void {
  const current = getStoredProjects();
  const next = current.filter((p) => p.id !== projectId);
  saveStoredProjects(next);
}

/**
 * Bridge helper converting a ProfileProjectItem to ProfileDisplayProject
 * for rendering on public profile and ProjectDetailModal.
 */
export function toProfileDisplayProject(
  item: ProfileProjectItem,
  creatorFallback?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  }
): ProfileDisplayProject {
  const meta = (item.metadata || {}) as Record<string, unknown>;

  // Convert gallery assets into project assets format if present
  const galleryAssets = item.galleryAssets || (meta.galleryAssets as ProjectGalleryAsset[]) || [];

  return {
    id: item.id,
    title: item.title,
    description: item.description,
    discipline: item.discipline,
    status: item.status,
    versionTag: item.versionTag,
    featured: item.featured,
    coverUrl: item.coverUrl,
    coverAlt: item.coverAlt,
    tags: item.tags || [],
    tools: item.tools || [],
    updatedAt: item.updatedAt,
    createdAt: item.completionDate || item.updatedAt,
    metadata: {
      ...meta,
      fullDescription: item.fullDescription || meta.fullDescription,
      background: item.background || meta.background,
      objectives: item.objectives || meta.objectives,
      creativeApproach: item.creativeApproach || meta.creativeApproach,
      projectType: item.projectType || meta.projectType,
      style: item.style || meta.style,
      duration: item.duration || meta.duration,
      completionDate: item.completionDate || meta.completionDate,
      canvasDimensions: item.canvasDimensions || meta.canvasDimensions,
      colorProfile: item.colorProfile || meta.colorProfile,
      projectUrl: item.externalUrl || meta.projectUrl || meta.externalUrl,
      externalUrl: item.externalUrl || meta.externalUrl,
      externalUrlLabel: item.externalUrlLabel || meta.externalUrlLabel,
      skills: item.skills || meta.skills || item.tags,
      tools: item.tools || meta.tools,
      software: item.tools || meta.software,
      galleryAssets,
      credits: item.contributors || meta.credits || meta.contributors,
      contributors: item.contributors || meta.contributors,
      publishedAt: item.isPublished ? meta.publishedAt || item.updatedAt : undefined,
    },
    likeCount: item.likeCount,
    commentCount: item.commentCount,
    collaborators: (item.collaborators || []).map((c) => ({
      name: c.name,
      username: c.username,
      initials: c.initials,
      tone: c.tone,
      accent: c.accent,
      role: c.role,
      url: c.url,
      urlLabel: c.urlLabel,
    })),
    versions: (item.versions || []).map((v, i) => ({
      id: `${item.id}-v-${i}`,
      version: v.version,
      label: v.label,
      date: v.date,
      status: v.status,
      note: v.note,
    })),
    creator: creatorFallback || {
      id: "user-anya-art",
      username: "anya_art",
      displayName: "Anya Sharma",
      avatarUrl: "/images/landing/artwork-illustration.jpg",
      bio: "Editorial Illustrator & Botanical Printmaker",
      disciplines: ["Illustration", "Graphic Design", "Ceramics & Print"],
    },
  };
}
