"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Briefcase,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  Eye,
  FileArchive,
  FileCode,
  FileText,
  Film,
  FolderPlus,
  GitBranch,
  Globe,
  Image as ImageIcon,
  Layers,
  Lightbulb,
  Maximize2,
  MessageSquare,
  MessageSquarePlus,
  Music,
  Palette,
  Plus,
  Sliders,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  User,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";
import type {
  DashboardBookingItem,
  DashboardIdeaItem,
} from "@/data/mockDashboard";
import type {
  UnifiedBookingItem,
} from "@/lib/bookingStore";
import type {
  ProfileProjectItem,
  ProfileServiceItem,
  ProfilePostItem,
  ProjectGalleryAsset,
  ProjectContributorItem,
} from "@/data/mockProfiles";

/* ========================================================================= */
/* 1. STRUCTURED PROJECT CREATOR & MANAGEMENT MODAL                          */
/* ========================================================================= */

export interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: ProfileProjectItem) => void;
  initialProject?: ProfileProjectItem | null;
}

const DISCIPLINE_OPTIONS = [
  "Illustration",
  "Photography",
  "Graphic Design",
  "Animation",
  "Ceramics & Print",
  "Writing",
  "UI/UX",
  "Digital Art",
  "Architecture",
  "Music & Audio",
  "Mixed Media",
];

const COVER_PRESETS = [
  { label: "Botanical Illustration", url: "/images/landing/artwork-illustration.jpg" },
  { label: "Astral Motion", url: "/images/landing/artwork-animation.jpg" },
  { label: "Ceramics & Glaze", url: "/images/landing/artwork-ceramics.jpg" },
  { label: "Solstice 3D Study", url: "/images/landing/artwork-3d.jpg" },
];

export function CreateProjectModal({
  isOpen,
  onClose,
  onSubmit,
  initialProject,
}: CreateProjectModalProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<
    "basic" | "overview" | "media" | "skills" | "details" | "links"
  >("basic");

  // Basic Information
  const [title, setTitle] = useState("");
  const [discipline, setDiscipline] = useState("Illustration");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("/images/landing/artwork-illustration.jpg");
  const [coverAlt, setCoverAlt] = useState("");
  const [versionTag, setVersionTag] = useState("v1.0 · Initial Release");

  // Project Overview
  const [fullDescription, setFullDescription] = useState("");
  const [background, setBackground] = useState("");
  const [objectives, setObjectives] = useState("");
  const [creativeApproach, setCreativeApproach] = useState("");

  // Media / Gallery
  const [galleryAssets, setGalleryAssets] = useState<ProjectGalleryAsset[]>([]);
  const [newAssetType, setNewAssetType] = useState<ProjectGalleryAsset["mediaType"]>("image");
  const [newAssetFileName, setNewAssetFileName] = useState("");
  const [newAssetUrl, setNewAssetUrl] = useState("");
  const [previewingAsset, setPreviewingAsset] = useState<ProjectGalleryAsset | null>(null);

  // Skills & Tools
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [tools, setTools] = useState<string[]>([]);
  const [toolInput, setToolInput] = useState("");

  // Optional Project Details
  const [projectType, setProjectType] = useState<"Personal" | "Client" | "Academic">("Personal");
  const [status, setStatus] = useState<ProfileProjectItem["status"]>("InProgress");
  const [style, setStyle] = useState("");
  const [duration, setDuration] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [canvasDimensions, setCanvasDimensions] = useState("");
  const [colorProfile, setColorProfile] = useState("Display P3");

  // External Project Link
  const [externalUrl, setExternalUrl] = useState("");
  const [externalUrlLabel, setExternalUrlLabel] = useState("");

  // Credits & Contributors
  const [contributors, setContributors] = useState<ProjectContributorItem[]>([]);
  const [contribName, setContribName] = useState("");
  const [contribRole, setContribRole] = useState("");
  const [contribUrl, setContribUrl] = useState("");
  const [contribUrlLabel, setContribUrlLabel] = useState("");

  // Form error message
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Sync state whenever initialProject changes or modal re-opens
  React.useEffect(() => {
    if (!isOpen) return;

    if (initialProject) {
      const meta = (initialProject.metadata || {}) as Record<string, unknown>;
      setTitle(initialProject.title || "");
      setDiscipline(initialProject.discipline || "Illustration");
      setDescription(initialProject.description || "");
      setCoverUrl(initialProject.coverUrl || "/images/landing/artwork-illustration.jpg");
      setCoverAlt(initialProject.coverAlt || initialProject.title || "");
      setVersionTag(initialProject.versionTag || "v1.0 · Initial Release");

      setFullDescription(
        initialProject.fullDescription || (meta.fullDescription as string) || ""
      );
      setBackground(
        initialProject.background || (meta.background as string) || ""
      );
      setObjectives(
        initialProject.objectives || (meta.objectives as string) || ""
      );
      setCreativeApproach(
        initialProject.creativeApproach || (meta.creativeApproach as string) || ""
      );

      const assets =
        initialProject.galleryAssets ||
        (meta.galleryAssets as ProjectGalleryAsset[]) ||
        [];
      setGalleryAssets(assets);

      setSkills(initialProject.skills || (meta.skills as string[]) || initialProject.tags || []);
      setTools(initialProject.tools || (meta.tools as string[]) || []);

      setProjectType(
        (initialProject.projectType ||
          (meta.projectType as "Personal" | "Client" | "Academic")) ||
          "Personal"
      );
      setStatus(initialProject.status || "InProgress");
      setStyle(initialProject.style || (meta.style as string) || "");
      setDuration(initialProject.duration || (meta.duration as string) || "");
      setCompletionDate(
        initialProject.completionDate || (meta.completionDate as string) || ""
      );
      setCanvasDimensions(
        initialProject.canvasDimensions || (meta.canvasDimensions as string) || ""
      );
      setColorProfile(
        initialProject.colorProfile || (meta.colorProfile as string) || "Display P3"
      );

      setExternalUrl(
        initialProject.externalUrl ||
          (meta.externalUrl as string) ||
          (meta.projectUrl as string) ||
          ""
      );
      setExternalUrlLabel(
        initialProject.externalUrlLabel ||
          (meta.externalUrlLabel as string) ||
          (meta.projectUrlLabel as string) ||
          ""
      );

      const contribs =
        initialProject.contributors ||
        (meta.credits as ProjectContributorItem[]) ||
        (meta.contributors as ProjectContributorItem[]) ||
        (initialProject.collaborators || []).map((c) => ({
          name: c.name,
          role: c.role,
          username: c.username,
          url: c.url,
          urlLabel: c.urlLabel,
        }));
      setContributors(contribs);
    } else {
      // Clean slate for new project
      setTitle("");
      setDiscipline("Illustration");
      setDescription("");
      setCoverUrl("/images/landing/artwork-illustration.jpg");
      setCoverAlt("");
      setVersionTag("v1.0 · Initial Spark");
      setFullDescription("");
      setBackground("");
      setObjectives("");
      setCreativeApproach("");
      setGalleryAssets([]);
      setSkills(["Botanical Study", "Color Grading"]);
      setTools(["Procreate", "Cotton Rag 300gsm"]);
      setProjectType("Personal");
      setStatus("InProgress");
      setStyle("Botanical & Celestial");
      setDuration("");
      setCompletionDate("");
      setCanvasDimensions("3840 × 2160 px");
      setColorProfile("Display P3");
      setExternalUrl("");
      setExternalUrlLabel("");
      setContributors([]);
    }
    setErrorNotice(null);
    setActiveTab("basic");
  }, [isOpen, initialProject]);

  if (!isOpen) return null;

  // File upload reader for custom cover image
  const handleCoverFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === "string") {
        setCoverUrl(result);
        if (!coverAlt) setCoverAlt(file.name.replace(/\.[^/.]+$/, ""));
      }
    };
    reader.readAsDataURL(file);
  };

  // Gallery Asset Handlers
  const handleAddGalleryAsset = () => {
    if (!newAssetUrl.trim() && !newAssetFileName.trim()) return;

    const id = `asset-${Date.now()}`;
    const fileName =
      newAssetFileName.trim() ||
      `${title.toLowerCase().replace(/[^a-z0-9]/g, "-") || "asset"}-${galleryAssets.length + 1}`;
    const url = newAssetUrl.trim() || coverUrl;

    const newAsset: ProjectGalleryAsset = {
      id,
      mediaType: newAssetType,
      fileName,
      mediaUrl: url,
      fileSize: 1500000,
      mimeType:
        newAssetType === "video"
          ? "video/mp4"
          : newAssetType === "audio"
          ? "audio/mp3"
          : newAssetType === "document"
          ? "application/pdf"
          : "image/jpeg",
    };

    setGalleryAssets((prev) => [...prev, newAsset]);
    setNewAssetFileName("");
    setNewAssetUrl("");
  };

  const handleAssetFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let inferredType: ProjectGalleryAsset["mediaType"] = "image";
    if (file.type.startsWith("video/")) inferredType = "video";
    else if (file.type.startsWith("audio/")) inferredType = "audio";
    else if (
      file.type === "application/pdf" ||
      file.name.endsWith(".pdf") ||
      file.name.endsWith(".zip") ||
      file.name.endsWith(".json") ||
      file.name.endsWith(".md")
    ) {
      inferredType = "document";
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === "string") {
        const newAsset: ProjectGalleryAsset = {
          id: `asset-${Date.now()}`,
          mediaType: inferredType,
          fileName: file.name,
          mediaUrl: result,
          fileSize: file.size,
          mimeType: file.type || "application/octet-stream",
        };
        setGalleryAssets((prev) => [...prev, newAsset]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleMoveAsset = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= galleryAssets.length) return;
    const copy = [...galleryAssets];
    const item = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = item;
    setGalleryAssets(copy);
  };

  const handleRemoveAsset = (id: string) => {
    setGalleryAssets((prev) => prev.filter((a) => a.id !== id));
  };

  // Skills & Tools tag handlers
  const handleAddSkill = () => {
    const val = skillInput.trim();
    if (!val || skills.includes(val)) return;
    setSkills((prev) => [...prev, val]);
    setSkillInput("");
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
  };

  const handleAddTool = () => {
    const val = toolInput.trim();
    if (!val || tools.includes(val)) return;
    setTools((prev) => [...prev, val]);
    setToolInput("");
  };

  const handleRemoveTool = (tool: string) => {
    setTools((prev) => prev.filter((t) => t !== tool));
  };

  // Contributors handler
  const handleAddContributor = () => {
    if (!contribName.trim()) return;
    const newContrib: ProjectContributorItem = {
      id: `contrib-${Date.now()}`,
      name: contribName.trim(),
      role: contribRole.trim() || "Collaborator",
      url: contribUrl.trim() || undefined,
      urlLabel: contribUrlLabel.trim() || undefined,
    };
    setContributors((prev) => [...prev, newContrib]);
    setContribName("");
    setContribRole("");
    setContribUrl("");
    setContribUrlLabel("");
  };

  const handleRemoveContributor = (idx: number) => {
    setContributors((prev) => prev.filter((_, i) => i !== idx));
  };

  // Save / Publish submit handler
  const handleSaveProject = (isPublished: boolean) => {
    if (!title.trim()) {
      setErrorNotice("Please provide a project title before saving.");
      setActiveTab("basic");
      return;
    }

    const projectId = initialProject?.id || `proj-${Date.now()}`;
    const now = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const assembledProject: ProfileProjectItem = {
      id: projectId,
      title: title.trim(),
      discipline,
      description: description.trim() || "New project created in workspace.",
      versionTag: versionTag.trim() || "v1.0",
      status,
      featured: initialProject?.featured || false,
      coverUrl: coverUrl.trim() || "/images/landing/artwork-illustration.jpg",
      coverAlt: coverAlt.trim() || title.trim(),
      tags: skills.length > 0 ? skills.map((s) => s.toLowerCase().replace(/\s+/g, "-")) : [discipline.toLowerCase()],
      tools: tools.length > 0 ? tools : ["CreativeSpace Atelier"],
      updatedAt: "Just now",
      likeCount: initialProject?.likeCount || 0,
      commentCount: initialProject?.commentCount || 0,
      collaborators: contributors.map((c) => ({
        name: c.name,
        username: c.username || c.name.toLowerCase().replace(/[^a-z0-9]/g, "_"),
        initials: c.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "CO",
        tone: "#203B35",
        accent: "#C8BDE0",
        role: c.role,
        url: c.url,
        urlLabel: c.urlLabel,
      })),
      versions: initialProject?.versions || [
        {
          version: versionTag.split(" ")[0] || "v1.0",
          label: "Initial Spark",
          date: "Today",
          status: isPublished ? "Approved" : "Draft",
          note: "Project archived in atelier.",
        },
      ],
      isPublished,
      fullDescription: fullDescription.trim() || undefined,
      background: background.trim() || undefined,
      objectives: objectives.trim() || undefined,
      creativeApproach: creativeApproach.trim() || undefined,
      galleryAssets,
      skills,
      projectType,
      style: style.trim() || undefined,
      duration: duration.trim() || undefined,
      completionDate: completionDate.trim() || undefined,
      canvasDimensions: canvasDimensions.trim() || undefined,
      colorProfile: colorProfile.trim() || undefined,
      externalUrl: externalUrl.trim() || undefined,
      externalUrlLabel: externalUrlLabel.trim() || undefined,
      contributors,
      metadata: {
        ...(initialProject?.metadata || {}),
        fullDescription: fullDescription.trim() || undefined,
        background: background.trim() || undefined,
        objectives: objectives.trim() || undefined,
        creativeApproach: creativeApproach.trim() || undefined,
        projectType,
        style: style.trim() || undefined,
        duration: duration.trim() || undefined,
        completionDate: completionDate.trim() || undefined,
        canvasDimensions: canvasDimensions.trim() || undefined,
        colorProfile: colorProfile.trim() || undefined,
        projectUrl: externalUrl.trim() || undefined,
        externalUrl: externalUrl.trim() || undefined,
        externalUrlLabel: externalUrlLabel.trim() || undefined,
        skills,
        tools,
        software: tools,
        galleryAssets,
        credits: contributors,
        contributors,
        publishedAt: isPublished ? now : undefined,
      },
    };

    onSubmit(assembledProject);
    onClose();
  };

  interface NavTabItem {
    key: "basic" | "overview" | "media" | "skills" | "details" | "links";
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }

  const navTabs: NavTabItem[] = [
    { key: "basic", label: "Basic Info", icon: FolderPlus },
    { key: "overview", label: "Overview", icon: FileText },
    { key: "media", label: "Gallery", icon: ImageIcon, badge: galleryAssets.length },
    { key: "skills", label: "Skills & Tools", icon: Wrench },
    { key: "details", label: "Details", icon: Sliders },
    { key: "links", label: "Links & Credits", icon: Users, badge: contributors.length },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl rounded-3xl border border-[#203B35]/20 bg-[#FAF8F3] text-[#203B35] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#203B35]/12 bg-[#FAF8F3] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#203B35] text-[#FAF8F3] shadow-sm">
              <FolderPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#203B35]">
                {initialProject ? "Manage Creative Project" : "Create New Project"}
              </h2>
              <p className="text-xs text-[#5D635F]">
                Structure project details, media gallery, credits, and public profile visibility.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#5D635F] hover:bg-[#EFECE2] hover:text-[#203B35] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex shrink-0 items-center gap-1 border-b border-[#203B35]/10 bg-[#EFECE2]/50 px-6 py-2 overflow-x-auto scrollbar-none">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[#203B35] text-[#FAF8F3] shadow-sm"
                    : "text-[#5D635F] hover:bg-[#FAF8F3] hover:text-[#203B35]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
                {typeof tab.badge === "number" && tab.badge > 0 && (
                  <span
                    className={`ml-0.5 rounded-full px-1.5 py-0.2 font-mono text-[10px] ${
                      isActive ? "bg-white/20 text-white" : "bg-[#203B35]/10 text-[#203B35]"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Error Notice */}
        {errorNotice && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs text-amber-900">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}

        {/* Scrollable Tab Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* TAB 1: BASIC INFORMATION */}
          {activeTab === "basic" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#203B35] mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Nocturne Flora & Orbit"
                  className="w-full rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3.5 py-2.5 text-sm text-[#203B35] placeholder:text-[#5D635F]/60 focus:border-[#203B35] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#203B35] mb-1">
                    Category / Discipline *
                  </label>
                  <select
                    value={discipline}
                    onChange={(e) => setDiscipline(e.target.value)}
                    className="w-full rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3.5 py-2.5 text-xs text-[#203B35] focus:border-[#203B35] focus:outline-none"
                  >
                    {DISCIPLINE_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#203B35] mb-1">
                    Version Tag
                  </label>
                  <input
                    type="text"
                    value={versionTag}
                    onChange={(e) => setVersionTag(e.target.value)}
                    placeholder="e.g. v2.1 · Exhibition Final"
                    className="w-full rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3.5 py-2.5 text-xs font-mono text-[#203B35] focus:border-[#203B35] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#203B35] mb-1">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A concise summary of the artwork or project displayed on cards..."
                  className="w-full rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3.5 py-2 text-xs text-[#203B35] placeholder:text-[#5D635F]/60 focus:border-[#203B35] focus:outline-none"
                />
              </div>

              {/* Cover Image Selector */}
              <div className="space-y-3 pt-2 border-t border-[#203B35]/10">
                <label className="block text-xs font-semibold text-[#203B35]">
                  Cover Image
                </label>

                {/* Preview Thumbnail */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="relative aspect-[16/10] w-36 overflow-hidden rounded-xl border border-[#203B35]/20 bg-[#EFECE2] shrink-0">
                    <img
                      src={coverUrl}
                      alt={coverAlt || title || "Cover preview"}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={coverUrl}
                        onChange={(e) => setCoverUrl(e.target.value)}
                        placeholder="Image URL (or choose preset / file below)..."
                        className="flex-1 rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3 py-1.5 text-xs text-[#203B35] font-mono focus:border-[#203B35] focus:outline-none"
                      />
                      <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-[#203B35]/20 bg-[#EFECE2] px-3 py-1.5 text-xs font-medium text-[#203B35] hover:bg-[#FAF8F3] transition-colors shrink-0">
                        <Upload className="h-3.5 w-3.5" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleCoverFileUpload}
                        />
                      </label>
                    </div>

                    {/* Presets */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-[#5D635F]">Presets:</span>
                      {COVER_PRESETS.map((preset) => (
                        <button
                          key={preset.url}
                          type="button"
                          onClick={() => setCoverUrl(preset.url)}
                          className={`rounded-full px-2.5 py-0.5 text-[10.5px] border transition-colors ${
                            coverUrl === preset.url
                              ? "bg-[#203B35] text-[#FAF8F3] border-[#203B35]"
                              : "bg-[#FAF8F3] text-[#5D635F] border-[#203B35]/15 hover:border-[#203B35]/40"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROJECT OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#203B35] mb-1">
                  Full Project Description
                </label>
                <textarea
                  rows={4}
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                  placeholder="In-depth narrative describing the project theme, concepts, and exploration..."
                  className="w-full rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3.5 py-2.5 text-xs text-[#203B35] placeholder:text-[#5D635F]/60 focus:border-[#203B35] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#203B35] mb-1">
                  Background &amp; Context
                </label>
                <textarea
                  rows={3}
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  placeholder="Inspirations, historical roots, residency context, or creative problem..."
                  className="w-full rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3.5 py-2.5 text-xs text-[#203B35] placeholder:text-[#5D635F]/60 focus:border-[#203B35] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#203B35] mb-1">
                  Objectives &amp; Goals
                </label>
                <textarea
                  rows={3}
                  value={objectives}
                  onChange={(e) => setObjectives(e.target.value)}
                  placeholder="Core aims, aesthetic milestones, or experimental hypotheses to test..."
                  className="w-full rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3.5 py-2.5 text-xs text-[#203B35] placeholder:text-[#5D635F]/60 focus:border-[#203B35] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#203B35] mb-1">
                  Creative Approach &amp; Process
                </label>
                <textarea
                  rows={3}
                  value={creativeApproach}
                  onChange={(e) => setCreativeApproach(e.target.value)}
                  placeholder="Step-by-step techniques, tactile materials, drafting workflow, or software pipelines..."
                  className="w-full rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3.5 py-2.5 text-xs text-[#203B35] placeholder:text-[#5D635F]/60 focus:border-[#203B35] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 3: MEDIA & GALLERY */}
          {activeTab === "media" && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-[#203B35]/15 bg-[#EFECE2]/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-sm font-normal text-[#203B35]">
                    Add Asset to Gallery
                  </h3>
                  <span className="text-[11px] text-[#5D635F]">
                    Images, Videos, Audio tracks, Documents
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <select
                    value={newAssetType}
                    onChange={(e) =>
                      setNewAssetType(e.target.value as ProjectGalleryAsset["mediaType"])
                    }
                    className="rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3 py-2 text-xs text-[#203B35] focus:border-[#203B35] focus:outline-none"
                  >
                    <option value="image">Image Asset</option>
                    <option value="video">Video / Motion</option>
                    <option value="audio">Audio Track</option>
                    <option value="document">Document (PDF/Zip)</option>
                  </select>

                  <input
                    type="text"
                    value={newAssetFileName}
                    onChange={(e) => setNewAssetFileName(e.target.value)}
                    placeholder="File Title or Name..."
                    className="sm:col-span-1 rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3 py-2 text-xs text-[#203B35] focus:border-[#203B35] focus:outline-none"
                  />

                  <input
                    type="text"
                    value={newAssetUrl}
                    onChange={(e) => setNewAssetUrl(e.target.value)}
                    placeholder="Media URL..."
                    className="sm:col-span-2 rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3 py-2 text-xs text-[#203B35] font-mono focus:border-[#203B35] focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-full border border-[#203B35]/20 bg-[#FAF8F3] px-3 py-1.5 text-xs font-medium text-[#203B35] hover:bg-[#EFECE2] transition-colors">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload Local File</span>
                    <input
                      type="file"
                      accept="image/*,video/*,audio/*,.pdf,.zip,.json,.md"
                      className="hidden"
                      onChange={handleAssetFileUpload}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleAddGalleryAsset}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#203B35] px-4 py-1.5 text-xs font-semibold text-[#FAF8F3] hover:bg-[#162A26] transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add to Gallery</span>
                  </button>
                </div>
              </div>

              {/* Gallery Assets List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-[#203B35]">
                    Exhibition Assets ({galleryAssets.length})
                  </h4>
                  <span className="text-[11px] text-[#5D635F]">
                    Use arrows to reorder assets on public exhibition
                  </span>
                </div>

                {galleryAssets.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#203B35]/20 bg-[#FAF8F3] p-8 text-center">
                    <ImageIcon className="mx-auto h-6 w-6 text-[#5D635F]/60 mb-2" />
                    <p className="text-xs text-[#5D635F]">
                      No gallery assets added yet. Add multiple images, video reels, audio recordings, or PDF specs above.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {galleryAssets.map((asset, idx) => (
                      <div
                        key={asset.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-[#203B35]/12 bg-[#FAF8F3] p-3 shadow-sm hover:border-[#203B35]/30 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-mono text-xs text-[#5D635F] w-4 text-center">
                            {idx + 1}
                          </span>

                          <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-[#EFECE2] shrink-0 border border-[#203B35]/10 flex items-center justify-center">
                            {asset.mediaType === "image" ? (
                              <img
                                src={asset.mediaUrl}
                                alt={asset.fileName}
                                className="h-full w-full object-cover"
                              />
                            ) : asset.mediaType === "video" ? (
                              <Film className="h-5 w-5 text-[#203B35]" />
                            ) : asset.mediaType === "audio" ? (
                              <Music className="h-5 w-5 text-[#203B35]" />
                            ) : (
                              <FileText className="h-5 w-5 text-[#203B35]" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-[#203B35]">
                              {asset.fileName}
                            </p>
                            <div className="flex items-center gap-2 font-mono text-[10px] text-[#5D635F]">
                              <span className="uppercase">{asset.mediaType}</span>
                              <span>·</span>
                              <span className="truncate max-w-[200px]">{asset.mediaUrl}</span>
                            </div>
                          </div>
                        </div>

                        {/* Controls: Reorder, Preview, Remove */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveAsset(idx, "up")}
                            disabled={idx === 0}
                            aria-label="Move asset up"
                            className="p-1.5 rounded-lg text-[#5D635F] hover:bg-[#EFECE2] disabled:opacity-30 disabled:hover:bg-transparent"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveAsset(idx, "down")}
                            disabled={idx === galleryAssets.length - 1}
                            aria-label="Move asset down"
                            className="p-1.5 rounded-lg text-[#5D635F] hover:bg-[#EFECE2] disabled:opacity-30 disabled:hover:bg-transparent"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewingAsset(asset)}
                            aria-label="Preview asset"
                            className="p-1.5 rounded-lg text-[#203B35] hover:bg-[#EFECE2]"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveAsset(asset.id)}
                            aria-label="Remove asset"
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SKILLS & TOOLS/SOFTWARE */}
          {activeTab === "skills" && (
            <div className="space-y-6">
              {/* Skills Demonstrated */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#203B35] mb-1">
                    Skills Demonstrated
                  </label>
                  <p className="text-[11px] text-[#5D635F]">
                    Discipline skills displayed in this project (e.g. Botanical Illustration, Visual Hierarchy, Shading).
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    placeholder="Type skill & press Enter or Add..."
                    className="flex-1 rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3.5 py-2 text-xs text-[#203B35] focus:border-[#203B35] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="rounded-full bg-[#203B35] px-4 py-2 text-xs font-semibold text-[#FAF8F3] hover:bg-[#162A26] transition-colors"
                  >
                    Add Skill
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#203B35]/15 bg-[#EFECE2]/70 px-3 py-1 text-xs text-[#203B35]"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-[#5D635F] hover:text-[#203B35]"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {skills.length === 0 && (
                    <span className="text-xs text-[#5D635F]/70 italic">
                      No skills added yet.
                    </span>
                  )}
                </div>
              </div>

              {/* Tools & Software Used */}
              <div className="space-y-3 pt-4 border-t border-[#203B35]/10">
                <div>
                  <label className="block text-xs font-semibold text-[#203B35] mb-1">
                    Tools &amp; Software Used
                  </label>
                  <p className="text-[11px] text-[#5D635F]">
                    Software, traditional mediums, hardware rigs, or camera equipment (e.g. Procreate, Cotton Rag, Ableton).
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={toolInput}
                    onChange={(e) => setToolInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTool();
                      }
                    }}
                    placeholder="Type tool / software & press Enter..."
                    className="flex-1 rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3.5 py-2 text-xs text-[#203B35] focus:border-[#203B35] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddTool}
                    className="rounded-full bg-[#203B35] px-4 py-2 text-xs font-semibold text-[#FAF8F3] hover:bg-[#162A26] transition-colors"
                  >
                    Add Tool
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {tools.map((tool) => (
                    <span
                      key={tool}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#9DB5A5]/60 bg-[#9DB5A5]/25 px-3 py-1 text-xs text-[#203B35]"
                    >
                      <Wrench className="h-3 w-3 text-[#203B35]/60" />
                      <span>{tool}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTool(tool)}
                        className="text-[#203B35]/60 hover:text-[#203B35]"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {tools.length === 0 && (
                    <span className="text-xs text-[#5D635F]/70 italic">
                      No tools added yet.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: OPTIONAL PROJECT DETAILS */}
          {activeTab === "details" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Project Type */}
                <div>
                  <label className="block text-xs font-semibold text-[#203B35] mb-1.5">
                    Project Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Personal", "Client", "Academic"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setProjectType(type)}
                        className={`rounded-xl border py-2 text-xs font-medium transition-colors ${
                          projectType === type
                            ? "border-[#203B35] bg-[#203B35] text-[#FAF8F3]"
                            : "border-[#203B35]/20 bg-[#FAF8F3] text-[#203B35] hover:bg-[#EFECE2]"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Progress Status */}
                <div>
                  <label className="block text-xs font-semibold text-[#203B35] mb-1.5">
                    Progress Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStatus("InProgress")}
                      className={`rounded-xl border py-2 text-xs font-medium transition-colors ${
                        status === "InProgress"
                          ? "border-[#203B35] bg-[#203B35] text-[#FAF8F3]"
                          : "border-[#203B35]/20 bg-[#FAF8F3] text-[#203B35] hover:bg-[#EFECE2]"
                      }`}
                    >
                      In Progress
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus("Completed")}
                      className={`rounded-xl border py-2 text-xs font-medium transition-colors ${
                        status === "Completed"
                          ? "border-[#203B35] bg-[#203B35] text-[#FAF8F3]"
                          : "border-[#203B35]/20 bg-[#FAF8F3] text-[#203B35] hover:bg-[#EFECE2]"
                      }`}
                    >
                      Completed
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#203B35] mb-1">
                    Visual Style
                  </label>
                  <input
                    type="text"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    placeholder="e.g. Minimalist Swiss, Surreal Botanical"
                    className="w-full rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3.5 py-2.5 text-xs text-[#203B35] focus:border-[#203B35] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#203B35] mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 6 weeks, 4 months"
                    className="w-full rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3.5 py-2.5 text-xs text-[#203B35] focus:border-[#203B35] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#203B35] mb-1">
                    Completion Date
                  </label>
                  <input
                    type="date"
                    value={completionDate}
                    onChange={(e) => setCompletionDate(e.target.value)}
                    className="w-full rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3.5 py-2.5 text-xs text-[#203B35] focus:border-[#203B35] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#203B35] mb-1">
                    Canvas Dimensions
                  </label>
                  <input
                    type="text"
                    value={canvasDimensions}
                    onChange={(e) => setCanvasDimensions(e.target.value)}
                    placeholder="e.g. 3840 × 2160 px, A3"
                    className="w-full rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3.5 py-2.5 text-xs text-[#203B35] focus:border-[#203B35] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#203B35] mb-1">
                    Color Profile
                  </label>
                  <input
                    type="text"
                    value={colorProfile}
                    onChange={(e) => setColorProfile(e.target.value)}
                    placeholder="e.g. Display P3, sRGB, CMYK"
                    className="w-full rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3.5 py-2.5 text-xs text-[#203B35] focus:border-[#203B35] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: EXTERNAL LINK & CREDITS/CONTRIBUTORS */}
          {activeTab === "links" && (
            <div className="space-y-6">
              {/* External Project URL with customizable link label */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#203B35] mb-1">
                    External Project Link
                  </label>
                  <p className="text-[11px] text-[#5D635F]">
                    Attach an interactive experience, live repository, or exhibition site.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#5D635F] mb-1 font-mono">
                      Target URL
                    </label>
                    <input
                      type="url"
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                      placeholder="https://example.com/exhibit"
                      className="w-full rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3.5 py-2 text-xs font-mono text-[#203B35] focus:border-[#203B35] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#5D635F] mb-1">
                      Custom Link Label
                    </label>
                    <input
                      type="text"
                      value={externalUrlLabel}
                      onChange={(e) => setExternalUrlLabel(e.target.value)}
                      placeholder="e.g. Live Interactive Experience, Read Monograph"
                      className="w-full rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3.5 py-2 text-xs text-[#203B35] focus:border-[#203B35] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Credits & Contributors Section */}
              <div className="space-y-4 pt-4 border-t border-[#203B35]/10">
                <div>
                  <label className="block text-xs font-semibold text-[#203B35] mb-1">
                    Credits &amp; Contributors
                  </label>
                  <p className="text-[11px] text-[#5D635F]">
                    Acknowledge fellow creatives, animators, typographers, or sound designers who collaborated.
                  </p>
                </div>

                {/* Add Contributor Row */}
                <div className="rounded-2xl border border-[#203B35]/15 bg-[#EFECE2]/40 p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    <input
                      type="text"
                      value={contribName}
                      onChange={(e) => setContribName(e.target.value)}
                      placeholder="Contributor Name *"
                      className="rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3 py-2 text-xs text-[#203B35] focus:border-[#203B35] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={contribRole}
                      onChange={(e) => setContribRole(e.target.value)}
                      placeholder="Role (e.g. Art Director)"
                      className="rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3 py-2 text-xs text-[#203B35] focus:border-[#203B35] focus:outline-none"
                    />
                    <input
                      type="url"
                      value={contribUrl}
                      onChange={(e) => setContribUrl(e.target.value)}
                      placeholder="Portfolio / Link URL"
                      className="rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3 py-2 text-xs font-mono text-[#203B35] focus:border-[#203B35] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={contribUrlLabel}
                      onChange={(e) => setContribUrlLabel(e.target.value)}
                      placeholder="Link Label (e.g. View Portfolio)"
                      className="rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3 py-2 text-xs text-[#203B35] focus:border-[#203B35] focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleAddContributor}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#203B35] px-4 py-1.5 text-xs font-semibold text-[#FAF8F3] hover:bg-[#162A26] transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Contributor</span>
                    </button>
                  </div>
                </div>

                {/* Contributors List */}
                {contributors.length > 0 && (
                  <div className="space-y-2">
                    {contributors.map((contrib, idx) => (
                      <div
                        key={contrib.id || idx}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-[#203B35]/12 bg-[#FAF8F3] p-3 shadow-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#203B35] text-[#FAF8F3] text-xs font-semibold shrink-0">
                            {contrib.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-[#203B35]">
                              {contrib.name}
                            </p>
                            <p className="truncate text-[11px] text-[#5D635F]">
                              {contrib.role}
                              {contrib.url && (
                                <span className="ml-2 font-mono text-[10px] text-[#4E9F76]">
                                  ({contrib.urlLabel || "Link attached"})
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveContributor(idx)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Chrome */}
        <div className="flex shrink-0 items-center justify-between border-t border-[#203B35]/12 bg-[#FAF8F3] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-xs font-medium text-[#5D635F] hover:bg-[#EFECE2] hover:text-[#203B35] transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleSaveProject(false)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#203B35]/25 bg-[#FAF8F3] px-4 py-2 text-xs font-semibold text-[#203B35] hover:bg-[#EFECE2] transition-colors shadow-sm"
            >
              <span>Save as Draft</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaveProject(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#203B35] px-5 py-2 text-xs font-semibold text-[#FAF8F3] hover:bg-[#162A26] transition-colors shadow-sm"
            >
              <Check className="h-3.5 w-3.5 text-[#9DB5A5]" />
              <span>Publish to Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Asset Preview Lightbox Modal */}
      {previewingAsset && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setPreviewingAsset(null)}
        >
          <div
            className="relative max-w-2xl w-full rounded-3xl bg-[#FAF8F3] overflow-hidden shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#203B35]/10 pb-3">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#5D635F]">
                  {previewingAsset.mediaType}
                </span>
                <h3 className="font-serif text-lg text-[#203B35]">
                  {previewingAsset.fileName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewingAsset(null)}
                className="p-1 rounded-full text-[#5D635F] hover:text-[#203B35]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[60vh] flex items-center justify-center overflow-hidden rounded-2xl bg-[#162A26]">
              {previewingAsset.mediaType === "image" ? (
                <img
                  src={previewingAsset.mediaUrl}
                  alt={previewingAsset.fileName}
                  className="max-h-[55vh] w-auto object-contain"
                />
              ) : previewingAsset.mediaType === "video" ? (
                <video
                  src={previewingAsset.mediaUrl}
                  controls
                  className="max-h-[55vh] w-full"
                />
              ) : previewingAsset.mediaType === "audio" ? (
                <div className="p-8 w-full bg-[#FAF8F3]">
                  <audio
                    src={previewingAsset.mediaUrl}
                    controls
                    className="w-full"
                  />
                </div>
              ) : (
                <div className="p-12 text-center text-[#FAF8F3] space-y-2">
                  <FileText className="mx-auto h-12 w-12 text-[#9DB5A5]" />
                  <p className="text-sm font-medium">{previewingAsset.fileName}</p>
                  <a
                    href={previewingAsset.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#9DB5A5] underline"
                  >
                    <span>Open Document</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========================================================================= */
/* 2. PUBLISH POST MODAL                                                     */
/* ========================================================================= */

interface PublishPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (post: Partial<ProfilePostItem>) => void;
  availableProjects: ProfileProjectItem[];
}

export function PublishPostModal({
  isOpen,
  onClose,
  onSubmit,
  availableProjects,
}: PublishPostModalProps) {
  const [kind, setKind] = useState<ProfilePostItem["kind"]>("Studio Note");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [tagsInput, setTagsInput] = useState("process, gouache");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const projectRef = availableProjects.find((p) => p.id === selectedProjectId);

    onSubmit({
      id: `post-${Date.now()}`,
      kind,
      title: title.trim() || undefined,
      content: content.trim(),
      createdAt: "Just now",
      likeCount: 0,
      comments: [],
      tags: tagsInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      projectRef: projectRef
        ? {
            id: projectRef.id,
            title: projectRef.title,
            versionTag: projectRef.versionTag,
          }
        : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-[#203B35]/15 bg-[#FAF8F3] p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#5D635F] hover:bg-[#EFECE2] hover:text-[#203B35] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#9DB5A5]/30 text-[#203B35]">
            <MessageSquarePlus className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-normal text-[#203B35]">
              Publish Studio Post
            </h2>
            <p className="text-xs text-[#5D635F]">
              Share insights, sketchbook updates, or solicit peer critique.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#203B35] mb-1.5">
              Post Kind
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["Studio Note", "Process Log", "Critique Request"] as const).map(
                (k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={`rounded-xl border py-2 text-xs font-medium transition-colors ${
                      kind === k
                        ? "border-[#203B35] bg-[#203B35] text-[#FAF8F3]"
                        : "border-[#203B35]/15 bg-[#FAF8F3] text-[#203B35] hover:bg-[#EFECE2]"
                    }`}
                  >
                    {k}
                  </button>
                )
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#203B35] mb-1">
              Headline / Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Observations on nocturnal palette contrast..."
              className="w-full rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3.5 py-2.5 text-xs text-[#203B35] placeholder:text-[#5D635F]/60 focus:border-[#203B35] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#203B35] mb-1">
              Content *
            </label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What are you currently exploring or looking for feedback on?"
              className="w-full rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3.5 py-2.5 text-xs text-[#203B35] placeholder:text-[#5D635F]/60 focus:border-[#203B35] focus:outline-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#203B35] mb-1">
                Link to Project (Optional)
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3 py-2 text-xs text-[#203B35] focus:border-[#203B35] focus:outline-none"
              >
                <option value="">No linked project</option>
                {availableProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#203B35] mb-1">
                Tags (Comma-separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3 py-2 text-xs text-[#203B35] focus:border-[#203B35] focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-xs font-medium text-[#5D635F] hover:bg-[#EFECE2]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-[#203B35] px-5 py-2 text-xs font-semibold text-[#FAF8F3] hover:bg-[#162A26] transition-colors shadow-sm"
            >
              Publish Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* 3. CREATE SERVICE MODAL                                                   */
/* ========================================================================= */

interface CreateServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (service: Partial<ProfileServiceItem>) => void;
}

export function CreateServiceModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateServiceModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Illustration");
  const [priceAmount, setPriceAmount] = useState<number>(450);
  const [pricingModel, setPricingModel] = useState<ProfileServiceItem["pricingModel"]>("Fixed price");
  const [duration, setDuration] = useState("1-2 weeks");
  const [shortDesc, setShortDesc] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      id: `srv-${Date.now()}`,
      title: title.trim(),
      category,
      shortDescription:
        shortDesc.trim() || "Commission offering crafted in studio atelier.",
      fullDescription:
        "Comprehensive service package tailored to creative commissions.",
      coverUrl: "/images/landing/artwork-illustration.jpg",
      coverAlt: title.trim(),
      pricingModel,
      priceAmount,
      currency: "USD",
      estimatedDuration: duration,
      availabilityStatus: "Available",
      availabilityDetail: "Booking active slots this quarter",
      sessionFormat: "Async milestone reviews + kickoff call",
      minNotice: "72 hours notice",
      revisionsIncluded: "2 structured review rounds",
      deliverables: [
        "High-resolution production files",
        "Color-graded print plates",
        "Commercial usage summary",
      ],
      isPublished,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-[#203B35]/15 bg-[#FAF8F3] p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#5D635F] hover:bg-[#EFECE2] hover:text-[#203B35] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C8BDE0]/40 text-[#203B35]">
            <Briefcase className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-normal text-[#203B35]">
              Create Creative Service
            </h2>
            <p className="text-xs text-[#5D635F]">
              Define a bookable offering for clients and collaborators.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#203B35] mb-1">
              Service Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Editorial Cover Series & Spot Plates"
              className="w-full rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3.5 py-2.5 text-xs text-[#203B35] placeholder:text-[#5D635F]/60 focus:border-[#203B35] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#203B35] mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3 py-2 text-xs text-[#203B35] focus:border-[#203B35] focus:outline-none"
              >
                {DISCIPLINE_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#203B35] mb-1">
                Pricing Model
              </label>
              <select
                value={pricingModel}
                onChange={(e) =>
                  setPricingModel(
                    e.target.value as ProfileServiceItem["pricingModel"]
                  )
                }
                className="w-full rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3 py-2 text-xs text-[#203B35] focus:border-[#203B35] focus:outline-none"
              >
                <option value="Fixed price">Fixed price</option>
                <option value="Starting at">Starting at</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#203B35] mb-1">
                Price Amount (USD) *
              </label>
              <input
                type="number"
                required
                min={10}
                value={priceAmount}
                onChange={(e) => setPriceAmount(Number(e.target.value))}
                className="w-full rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3.5 py-2 text-xs text-[#203B35] font-mono focus:border-[#203B35] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#203B35] mb-1">
                Estimated Turnaround
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 1-2 weeks"
                className="w-full rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3 py-2 text-xs text-[#203B35] focus:border-[#203B35] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#203B35] mb-1">
              Short Summary
            </label>
            <textarea
              rows={2}
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              placeholder="What does this service include? (One or two concise sentences)"
              className="w-full rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3.5 py-2 text-xs text-[#203B35] placeholder:text-[#5D635F]/60 focus:border-[#203B35] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-[#203B35]/12 bg-[#EFECE2]/60 p-3">
            <div>
              <p className="text-xs font-semibold text-[#203B35]">
                Publish Immediately
              </p>
              <p className="text-[11px] text-[#5D635F]">
                Make this service visible on your public studio profile.
              </p>
            </div>
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 rounded border-[#203B35]/30 text-[#203B35] focus:ring-0"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-xs font-medium text-[#5D635F] hover:bg-[#EFECE2]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-[#203B35] px-5 py-2 text-xs font-semibold text-[#FAF8F3] hover:bg-[#162A26] transition-colors shadow-sm"
            >
              Create Service
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* 4. START IDEA MODAL                                                       */
/* ========================================================================= */

interface StartIdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (idea: Partial<DashboardIdeaItem>) => void;
}

export function StartIdeaModal({
  isOpen,
  onClose,
  onSubmit,
}: StartIdeaModalProps) {
  const [title, setTitle] = useState("");
  const [discipline, setDiscipline] = useState("Animation & Sound");
  const [spark, setSpark] = useState("");
  const [tagsInput, setTagsInput] = useState("collaboration, experimental");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !spark.trim()) return;

    onSubmit({
      id: `idea-${Date.now()}`,
      title: title.trim(),
      discipline,
      spark: spark.trim(),
      stage: "Spark",
      stageProgress: 20,
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
          role: "Lead & Visuals",
        },
      ],
      tags: tagsInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      lastUpdate: "Spark initiated just now",
      nextMilestone: "Milestone: Gather concept moodboard & seed first collaborator",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-[#203B35]/15 bg-[#FAF8F3] p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#5D635F] hover:bg-[#EFECE2] hover:text-[#203B35] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E5A93C]/25 text-[#8E5A1C]">
            <Lightbulb className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-normal text-[#203B35]">
              Start an Idea / Collaboration
            </h2>
            <p className="text-xs text-[#5D635F]">
              Seed an early spark and assemble peers across disciplines.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#203B35] mb-1">
              Idea Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Kyoto Shadow & Sound Study"
              className="w-full rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3.5 py-2.5 text-xs text-[#203B35] placeholder:text-[#5D635F]/60 focus:border-[#203B35] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#203B35] mb-1">
              Primary Creative Field
            </label>
            <select
              value={discipline}
              onChange={(e) => setDiscipline(e.target.value)}
              className="w-full rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3 py-2 text-xs text-[#203B35] focus:border-[#203B35] focus:outline-none"
            >
              <option value="Animation & Sound">Animation & Sound</option>
              <option value="Graphic Design & Print">Graphic Design & Print</option>
              <option value="Digital Art & Film">Digital Art & Film</option>
              <option value="Ceramics & Mixed Media">Ceramics & Mixed Media</option>
              <option value="Interactive & Web">Interactive & Web</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#203B35] mb-1">
              The Creative Spark / Pitch *
            </label>
            <textarea
              required
              rows={3}
              value={spark}
              onChange={(e) => setSpark(e.target.value)}
              placeholder="What is the concept? What excites you about exploring this with others?"
              className="w-full rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3.5 py-2 text-xs text-[#203B35] placeholder:text-[#5D635F]/60 focus:border-[#203B35] focus:outline-none leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#203B35] mb-1">
              Tags
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3 py-2 text-xs text-[#203B35] focus:border-[#203B35] focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-xs font-medium text-[#5D635F] hover:bg-[#EFECE2]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-[#203B35] px-5 py-2 text-xs font-semibold text-[#FAF8F3] hover:bg-[#162A26] transition-colors shadow-sm"
            >
              Start Idea
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* 5. BOOKING DETAIL MODAL                                                   */
/* ========================================================================= */

interface BookingDetailModalProps {
  booking: UnifiedBookingItem | null;
  onClose: () => void;
  onSelectToProceed?: (id: string) => void;
  onReleaseSelection?: (id: string) => void;
  onConfirmBooking?: (id: string) => void;
  onDecline: (id: string) => void;
  onOpenAlternative?: (booking: UnifiedBookingItem, actorRole: "creator" | "client") => void;
  onAcceptAlternative?: (id: string, actor: "creator" | "client") => void;
  onDeclineAlternative?: (id: string, actor: "creator" | "client") => void;
  onOpenMessaging?: (booking: UnifiedBookingItem) => void;
}

export function BookingDetailModal({
  booking,
  onClose,
  onSelectToProceed,
  onReleaseSelection,
  onConfirmBooking,
  onDecline,
  onOpenAlternative,
  onAcceptAlternative,
  onDeclineAlternative,
  onOpenMessaging,
}: BookingDetailModalProps) {
  if (!booking) return null;

  const isIncoming = booking.direction === "incoming";
  const isPending = booking.status === "Pending";
  const isSelected = booking.status === "Selected";
  const isNegotiating =
    booking.proposalStatus === "ProposedByCreator" ||
    booking.proposalStatus === "ProposedByClient";
  const isConfirmed = booking.status === "Confirmed";
  const isCompleted = booking.status === "Completed";

  const otherPartyName = isIncoming ? booking.clientName : booking.creatorName;
  const otherPartyHandle = isIncoming ? booking.clientHandle : booking.creatorHandle;
  const otherPartyRole = isIncoming
    ? booking.clientRole
    : booking.creatorRole || "Service Creator";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in text-[#282B2A]">
      <div className="relative w-full max-w-xl rounded-3xl border border-[#203B35]/15 bg-[#FAF8F3] p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#5D635F] hover:bg-[#EFECE2] hover:text-[#203B35] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header Summary */}
        <div className="flex items-center gap-3.5 border-b border-[#203B35]/10 pb-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-base font-serif font-semibold text-[#FAF8F3] shadow-sm shrink-0"
            style={{
              backgroundColor: isIncoming
                ? booking.clientAvatarTone || "#203B35"
                : booking.creatorAvatarTone || "#3B4A44",
            }}
          >
            {isIncoming
              ? booking.clientInitials
              : booking.creatorName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-[#5D635F]">
              <span>{isIncoming ? "Client Inquiry" : "Outgoing Request"}</span>
              <span>·</span>
              <span>Ref: {booking.id}</span>
            </div>
            <h3 className="font-serif text-lg sm:text-xl font-normal text-[#203B35]">
              {otherPartyName}
            </h3>
            <p className="text-xs text-[#5D635F]">
              @{otherPartyHandle} · {otherPartyRole}
            </p>
          </div>
        </div>

        {/* 48-Hour Informational Notice if selected */}
        {isSelected && booking.has48HourReminder && (
          <div className="flex items-start gap-2.5 rounded-xl border border-[#E5A93C]/60 bg-[#E5A93C]/20 p-3 text-xs text-[#8E5A1C]">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">48-Hour Selection Reminder</p>
              <p className="text-[11.5px] text-[#8E5A1C]/90 mt-0.5">
                48 hours have elapsed since selecting this client. Please proceed with external arrangements or release selection. (No automatic cancellation will occur).
              </p>
            </div>
          </div>
        )}

        {/* Service requested */}
        <div className="space-y-1.5">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#5D635F]">
            Service Details
          </span>
          <div className="flex items-baseline justify-between rounded-xl border border-[#203B35]/12 bg-[#EFECE2]/60 p-3.5">
            <div>
              <p className="font-serif text-base font-medium text-[#203B35]">
                {booking.serviceTitle}
              </p>
              <p className="text-xs text-[#5D635F]">{booking.serviceCategory}</p>
            </div>
            <div className="text-right">
              <span className="font-serif text-xl font-medium text-[#203B35]">
                ${booking.priceAmount}
              </span>
              <span className="ml-1 text-[11px] text-[#5D635F]">{booking.currency}</span>
            </div>
          </div>
        </div>

        {/* Client Brief */}
        <div className="space-y-1.5">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#5D635F]">
            Project Scope &amp; Creative Brief
          </span>
          <p className="rounded-xl border border-[#203B35]/10 bg-[#FAF8F3] p-3.5 text-xs text-[#282B2A]/90 leading-relaxed italic">
            &ldquo;{booking.clientNote}&rdquo;
          </p>
        </div>

        {/* Schedule & Deliverables */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-[#203B35]/10 bg-[#EFECE2]/40 p-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#5D635F]">
              Scheduled Date (Active)
            </span>
            <p className="mt-1 font-medium text-[#203B35]">{booking.scheduledDate}</p>
            <p className="text-[11px] text-[#5D635F]">{booking.timeSlot}</p>
          </div>
          <div className="rounded-xl border border-[#203B35]/10 bg-[#EFECE2]/40 p-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#5D635F]">
              Session Format
            </span>
            <p className="mt-1 font-medium text-[#203B35]">{booking.sessionFormat}</p>
          </div>
        </div>

        {/* Selected State Informational Banner */}
        {isSelected && (
          <div className="rounded-2xl border border-[#203B35]/20 bg-[#F6F3EB] p-3.5 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-[#203B35]">
              <Sparkles className="h-3.5 w-3.5 text-[#203B35]" />
              <span>Client Selected · Awaiting Arrangement</span>
            </div>
            <p className="text-[11.5px] text-[#5D635F] leading-relaxed">
              This client has been selected to proceed. Competing requests remain pending.
              Private booking messaging unlocks exclusively once the booking is confirmed.
            </p>
          </div>
        )}

        {/* Dual Slot Holds Info (if negotiating) */}
        {isNegotiating && (
          <div className="rounded-2xl border border-[#C8BDE0] bg-[#C8BDE0]/20 p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between font-semibold text-[#203B35]">
              <span>Active Negotiation Dual Slot Holds</span>
              <span className="font-mono text-[10px] bg-[#FAF8F3] px-2 py-0.5 rounded-full border border-[#203B35]/10">
                24-Hour Timer Active
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11.5px]">
              <div className="p-2 rounded-xl bg-[#FAF8F3] border border-[#203B35]/10">
                <span className="block font-mono text-[9.5px] uppercase text-[#5D635F]">
                  Original Slot S1 (Protected)
                </span>
                <span className="font-medium text-[#203B35]">
                  {booking.originalDate} ({booking.originalSlot})
                </span>
              </div>
              <div className="p-2 rounded-xl bg-[#FAF8F3] border border-[#C8BDE0]">
                <span className="block font-mono text-[9.5px] uppercase text-[#8E5A1C]">
                  Proposed Slot S2 (Protected)
                </span>
                <span className="font-medium text-[#8E5A1C]">
                  {booking.proposedAlternativeDate} ({booking.proposedAlternativeSlot})
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Deliverables */}
        <div className="space-y-1.5">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#5D635F]">
            Deliverables ({booking.deliverables.length})
          </span>
          <ul className="space-y-1">
            {booking.deliverables.map((del, i) => (
              <li
                key={i}
                className="flex items-center gap-2 text-xs text-[#282B2A]/85"
              >
                <Check className="h-3.5 w-3.5 text-[#4E9F76] shrink-0" />
                <span>{del}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Negotiation History Thread */}
        {booking.negotiationHistory && booking.negotiationHistory.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-[#203B35]/10">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#5D635F]">
              Negotiation History Log
            </span>
            <div className="space-y-2">
              {booking.negotiationHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-xl border border-[#203B35]/10 bg-[#EFECE2]/35 p-3 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#203B35]">
                      {entry.actorName} ({entry.actor === "creator" ? "Provider" : "Client"})
                    </span>
                    <span className="font-mono text-[10px] text-[#5D635F]">
                      {entry.timestamp}
                    </span>
                  </div>
                  <p className="text-[11.5px] text-[#282B2A]">
                    Proposed date: <strong>{entry.proposedDate}</strong> ({entry.proposedSlot})
                  </p>
                  {entry.note && (
                    <p className="text-[11px] italic text-[#5D635F]">
                      &ldquo;{entry.note}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#203B35]/10">
          <span className="font-mono text-[11px] text-[#5D635F]">
            Requested {booking.dateRequested}
          </span>

          <div className="flex flex-wrap items-center gap-2">
            {/* INCOMING PERSPECTIVE ACTIONS */}
            {isIncoming && (
              <>
                {isPending && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        onDecline(booking.id);
                        onClose();
                      }}
                      className="rounded-full px-3.5 py-1.5 text-xs font-medium text-[#5D635F] hover:text-[#ae361c]"
                    >
                      Decline
                    </button>

                    {onOpenAlternative && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenAlternative(booking, "creator");
                          onClose();
                        }}
                        className="rounded-full border border-[#203B35]/15 bg-[#FAF8F3] px-3.5 py-1.5 text-xs font-medium text-[#203B35] hover:bg-[#EFECE2]"
                      >
                        Alternative Time
                      </button>
                    )}

                    {onSelectToProceed && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectToProceed(booking.id);
                          onClose();
                        }}
                        className="rounded-full bg-[#203B35] px-4 py-2 text-xs font-semibold text-[#FAF8F3] hover:bg-[#162A26] transition-colors"
                      >
                        Select Client
                      </button>
                    )}
                  </>
                )}

                {isSelected && (
                  <>
                    {onConfirmBooking && (
                      <button
                        type="button"
                        onClick={() => {
                          onConfirmBooking(booking.id);
                          onClose();
                        }}
                        className="rounded-full bg-[#203B35] px-4 py-2 text-xs font-semibold text-[#FAF8F3] hover:bg-[#162A26] transition-colors"
                      >
                        Confirm Booking
                      </button>
                    )}

                    {onReleaseSelection && (
                      <button
                        type="button"
                        onClick={() => {
                          onReleaseSelection(booking.id);
                          onClose();
                        }}
                        className="rounded-full border border-[#203B35]/25 bg-[#FAF8F3] px-3.5 py-1.5 text-xs font-medium text-[#203B35] hover:bg-[#EFECE2]"
                      >
                        Release Selection
                      </button>
                    )}

                    {onOpenAlternative && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenAlternative(booking, "creator");
                          onClose();
                        }}
                        className="rounded-full border border-[#203B35]/15 bg-[#FAF8F3] px-3.5 py-1.5 text-xs font-medium text-[#203B35] hover:bg-[#EFECE2]"
                      >
                        Alternative Time
                      </button>
                    )}
                  </>
                )}

                {booking.proposalStatus === "ProposedByClient" && (
                  <>
                    {onDeclineAlternative && (
                      <button
                        type="button"
                        onClick={() => {
                          onDeclineAlternative(booking.id, "creator");
                          onClose();
                        }}
                        className="rounded-full px-3 py-1.5 text-xs text-[#ae361c]"
                      >
                        Decline
                      </button>
                    )}

                    {onOpenAlternative && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenAlternative(booking, "creator");
                          onClose();
                        }}
                        className="rounded-full border border-[#203B35]/15 px-3 py-1.5 text-xs font-medium text-[#203B35]"
                      >
                        Counter-Propose
                      </button>
                    )}

                    {onAcceptAlternative && (
                      <button
                        type="button"
                        onClick={() => {
                          onAcceptAlternative(booking.id, "creator");
                          onClose();
                        }}
                        className="rounded-full bg-[#203B35] px-4 py-1.5 text-xs font-semibold text-[#FAF8F3]"
                      >
                        Accept Proposal
                      </button>
                    )}
                  </>
                )}
              </>
            )}

            {/* OUTGOING PERSPECTIVE ACTIONS */}
            {!isIncoming && (
              <>
                {booking.proposalStatus === "ProposedByCreator" && (
                  <>
                    {onDeclineAlternative && (
                      <button
                        type="button"
                        onClick={() => {
                          onDeclineAlternative(booking.id, "client");
                          onClose();
                        }}
                        className="rounded-full px-3 py-1.5 text-xs text-[#ae361c]"
                      >
                        Decline
                      </button>
                    )}

                    {onOpenAlternative && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenAlternative(booking, "client");
                          onClose();
                        }}
                        className="rounded-full border border-[#203B35]/15 px-3 py-1.5 text-xs font-medium text-[#203B35]"
                      >
                        Counter-Propose
                      </button>
                    )}

                    {onAcceptAlternative && (
                      <button
                        type="button"
                        onClick={() => {
                          onAcceptAlternative(booking.id, "client");
                          onClose();
                        }}
                        className="rounded-full bg-[#203B35] px-4 py-1.5 text-xs font-semibold text-[#FAF8F3]"
                      >
                        Accept Proposed Time
                      </button>
                    )}
                  </>
                )}
              </>
            )}

            {/* MESSAGE ACTION (FOR SELECTED, CONFIRMED, OR COMPLETED) */}
            {(isSelected || isConfirmed || isCompleted) && onOpenMessaging && (
              <button
                type="button"
                onClick={() => {
                  onOpenMessaging(booking);
                  onClose();
                }}
                className="rounded-full bg-[#203B35] px-4 py-1.5 text-xs font-semibold text-[#FAF8F3] hover:bg-[#162A26] transition-colors"
              >
                {isCompleted
                  ? "View Archived Messages"
                  : isSelected
                  ? "Open Session Chat (Payment)"
                  : "Open Session Chat"}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#203B35]/15 px-4 py-1.5 text-xs font-medium text-[#5D635F] hover:bg-[#EFECE2]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
