"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  Briefcase,
  Calendar,
  Check,
  Clock,
  Compass,
  FolderPlus,
  GitBranch,
  Lightbulb,
  MessageSquare,
  MessageSquarePlus,
  Plus,
  Sparkles,
  User,
  Users,
  X,
} from "lucide-react";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";
import type {
  DashboardBookingItem,
  DashboardIdeaItem,
} from "@/data/mockDashboard";
import type {
  ProfileProjectItem,
  ProfileServiceItem,
  ProfilePostItem,
} from "@/data/mockProfiles";

/* ========================================================================= */
/* 1. CREATE PROJECT MODAL                                                   */
/* ========================================================================= */

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: Partial<ProfileProjectItem>) => void;
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
];

export function CreateProjectModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateProjectModalProps) {
  const [title, setTitle] = useState("");
  const [discipline, setDiscipline] = useState("Illustration");
  const [description, setDescription] = useState("");
  const [versionTag, setVersionTag] = useState("v1.0 · Initial Spark");
  const [status, setStatus] = useState<ProfileProjectItem["status"]>("InProgress");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      id: `proj-${Date.now()}`,
      title: title.trim(),
      discipline,
      description: description.trim() || "New project created in workspace.",
      versionTag,
      status,
      featured: false,
      coverUrl: "/images/landing/artwork-illustration.jpg",
      coverAlt: title.trim(),
      tags: [discipline.toLowerCase().replace(/\s+/g, "-"), "studio"],
      tools: ["CreativeSpace Atelier"],
      updatedAt: "Just now",
      likeCount: 0,
      commentCount: 0,
      collaborators: [],
      versions: [
        {
          version: versionTag.split(" ")[0] || "v1.0",
          label: "Initial Spark",
          date: "Today",
          status: "Draft",
          note: "Project opened in personal atelier.",
        },
      ],
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
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#203B35] text-[#FAF8F3]">
            <FolderPlus className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-normal text-[#203B35]">
              Create New Project
            </h2>
            <p className="text-xs text-[#5D635F]">
              Start tracking artwork iterations and version history.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#203B35] mb-1">
              Project Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Celestial Horizon Studies"
              className="w-full rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3.5 py-2.5 text-xs text-[#203B35] placeholder:text-[#5D635F]/60 focus:border-[#203B35] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#203B35] mb-1">
                Discipline
              </label>
              <select
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
                className="w-full rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3 py-2.5 text-xs text-[#203B35] focus:border-[#203B35] focus:outline-none"
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
                Initial Version Tag
              </label>
              <input
                type="text"
                value={versionTag}
                onChange={(e) => setVersionTag(e.target.value)}
                className="w-full rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3 py-2.5 text-xs text-[#203B35] font-mono focus:border-[#203B35] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#203B35] mb-1">
              Short Description / Brief
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the medium, concept, materials, or intended focus..."
              className="w-full rounded-xl border border-[#203B35]/20 bg-[#FAF8F3] px-3.5 py-2 text-xs text-[#203B35] placeholder:text-[#5D635F]/60 focus:border-[#203B35] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#203B35] mb-1">
              Starting Status
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStatus("InProgress")}
                className={`flex-1 rounded-xl border py-2 text-xs font-medium transition-colors ${
                  status === "InProgress"
                    ? "border-[#203B35] bg-[#203B35] text-[#FAF8F3]"
                    : "border-[#203B35]/20 bg-[#FAF8F3] text-[#203B35]"
                }`}
              >
                In Progress
              </button>
              <button
                type="button"
                onClick={() => setStatus("InReview")}
                className={`flex-1 rounded-xl border py-2 text-xs font-medium transition-colors ${
                  status === "InReview"
                    ? "border-[#E5A93C] bg-[#E5A93C] text-black"
                    : "border-[#203B35]/20 bg-[#FAF8F3] text-[#203B35]"
                }`}
              >
                In Review
              </button>
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
              Create Project
            </button>
          </div>
        </form>
      </div>
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
  booking: DashboardBookingItem | null;
  onClose: () => void;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}

export function BookingDetailModal({
  booking,
  onClose,
  onAccept,
  onDecline,
}: BookingDetailModalProps) {
  if (!booking) return null;

  const isPending = booking.status === "Pending";

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

        {/* Client summary */}
        <div className="flex items-center gap-3.5 border-b border-[#203B35]/10 pb-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl text-base font-serif font-semibold text-[#FAF8F3]"
            style={{ backgroundColor: booking.clientAvatarTone }}
          >
            {booking.clientInitials}
          </div>
          <div>
            <h3 className="font-serif text-lg font-normal text-[#203B35]">
              {booking.clientName}
            </h3>
            <p className="text-xs text-[#5D635F]">
              @{booking.clientHandle} • {booking.clientRole}
            </p>
          </div>
        </div>

        {/* Service requested */}
        <div className="space-y-2">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#5D635F]">
            Service Requested
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
            Client Project Brief
          </span>
          <p className="rounded-xl border border-[#203B35]/10 bg-[#FAF8F3] p-3.5 text-xs text-[#282B2A]/90 leading-relaxed italic">
            &ldquo;{booking.clientNote}&rdquo;
          </p>
        </div>

        {/* Schedule & Deliverables */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-[#203B35]/10 bg-[#EFECE2]/40 p-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#5D635F]">
              Scheduled Date
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

        {/* Actions */}
        <div className="pt-2 flex items-center justify-between border-t border-[#203B35]/10">
          <span className="font-mono text-[11px] text-[#5D635F]">
            Requested {booking.dateRequested}
          </span>

          <div className="flex items-center gap-2">
            {isPending ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onDecline(booking.id);
                    onClose();
                  }}
                  className="rounded-full px-3.5 py-1.5 text-xs font-medium text-[#5D635F] hover:bg-[#EFECE2] hover:text-[#ae361c]"
                >
                  Decline
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onAccept(booking.id);
                    onClose();
                  }}
                  className="rounded-full bg-[#203B35] px-4 py-2 text-xs font-semibold text-[#FAF8F3] hover:bg-[#162A26] transition-colors"
                >
                  Accept Booking
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-[#203B35] px-5 py-2 text-xs font-semibold text-[#FAF8F3] hover:bg-[#162A26] transition-colors"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
