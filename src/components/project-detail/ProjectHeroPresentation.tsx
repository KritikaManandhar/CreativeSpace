"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Download,
  Calendar,
  Layers,
  Sparkles,
  Music,
  Video as VideoIcon,
  Eye,
  CheckCircle2,
  Lock,
  Globe,
  Users,
} from "lucide-react";
import {
  CelestialSpark,
  CreatorAvatar,
} from "@/components/landing/CreativeSpaceBrand";
import {
  ProjectAsset,
  ProjectCreator,
  ProjectStatus,
  Visibility,
  getCategoryArtwork,
  formatRelativeDate,
  formatFileSize,
} from "./projectTypes";

interface ProjectHeroPresentationProps {
  title: string;
  description: string | null;
  category: string;
  status: ProjectStatus;
  visibility: Visibility;
  createdAt: string;
  creator: ProjectCreator;
  assets: ProjectAsset[];
  selectedVersionNumber?: number;
  onOpenLightbox: (assetIndex: number) => void;
}

export function ProjectHeroPresentation({
  title,
  description,
  category,
  status,
  visibility,
  createdAt,
  creator,
  assets,
  selectedVersionNumber,
  onOpenLightbox,
}: ProjectHeroPresentationProps) {
  // Current active media index in carousel
  const [activeAssetIndex, setActiveAssetIndex] = useState(0);

  // Audio Player State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Video Player State
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Fallback artwork if no assets exist
  const fallbackCoverUrl = getCategoryArtwork(category);

  // Keep active index within bounds if assets list changes (e.g., when switching versions)
  useEffect(() => {
    setActiveAssetIndex(0);
    setIsPlayingAudio(false);
    setIsPlayingVideo(false);
  }, [assets]);

  const activeAsset = assets[activeAssetIndex];
  const hasMultipleAssets = assets.length > 1;

  // Determine media category of active asset
  const getMediaType = (asset?: ProjectAsset): "image" | "video" | "audio" | "document" => {
    if (!asset) return "image";
    const mime = asset.mimeType?.toLowerCase() || "";
    const name = asset.fileName?.toLowerCase() || "";

    if (mime.startsWith("video/") || /\.(mp4|webm|mov|mkv)$/i.test(name)) return "video";
    if (mime.startsWith("audio/") || /\.(mp3|wav|ogg|flac|m4a)$/i.test(name)) return "audio";
    if (
      mime.includes("pdf") ||
      mime.includes("document") ||
      mime.includes("zip") ||
      /\.(pdf|doc|docx|ai|psd|fig|zip)$/i.test(name)
    ) {
      return "document";
    }
    return "image";
  };

  const activeMediaType = getMediaType(activeAsset);
  const activeMediaUrl = activeAsset?.downloadUrl || fallbackCoverUrl;

  // Carousel navigation
  const handlePrev = () => {
    setActiveAssetIndex((prev) => (prev > 0 ? prev - 1 : assets.length - 1));
  };

  const handleNext = () => {
    setActiveAssetIndex((prev) => (prev < assets.length - 1 ? prev + 1 : 0));
  };

  // Audio Handlers
  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlayingAudio(true);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (!audioRef.current) return;
    setAudioCurrentTime(audioRef.current.currentTime);
    if (audioRef.current.duration) {
      setAudioProgress(
        (audioRef.current.currentTime / audioRef.current.duration) * 100
      );
    }
  };

  const handleAudioSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const seekTime = (parseFloat(e.target.value) / 100) * (audioRef.current.duration || 0);
    audioRef.current.currentTime = seekTime;
    setAudioProgress(parseFloat(e.target.value));
  };

  // Video Handlers
  const togglePlayVideo = () => {
    if (!videoRef.current) return;
    if (isPlayingVideo) {
      videoRef.current.pause();
      setIsPlayingVideo(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlayingVideo(true);
    }
  };

  const handleVideoTimeUpdate = () => {
    if (!videoRef.current) return;
    setVideoCurrentTime(videoRef.current.currentTime);
    if (videoRef.current.duration) {
      setVideoProgress(
        (videoRef.current.currentTime / videoRef.current.duration) * 100
      );
    }
  };

  const handleVideoSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const seekTime = (parseFloat(e.target.value) / 100) * (videoRef.current.duration || 0);
    videoRef.current.currentTime = seekTime;
    setVideoProgress(parseFloat(e.target.value));
  };

  const toggleVideoMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isVideoMuted;
    setIsVideoMuted(!isVideoMuted);
  };

  const formatPlaybackTime = (seconds: number) => {
    if (isNaN(seconds) || seconds <= 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Status Badge Formatting
  const getStatusBadge = () => {
    if (status === "Completed") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#203B35] text-[#FAF8F3] text-[11px] font-mono tracking-wider font-semibold shadow-sm">
          <CheckCircle2 className="w-3 h-3 text-[#9DB5A5]" />
          <span>FINAL EXHIBITION</span>
        </span>
      );
    }
    if (status === "InProgress" || status === "InReview") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#C8BDE0]/40 text-[#203B35] text-[11px] font-mono tracking-wider font-semibold border border-[#203B35]/15">
          <Sparkles className="w-3 h-3 text-[#203B35]" />
          <span>WORK IN PROGRESS</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#EFECE2] text-[#5D635F] text-[11px] font-mono tracking-wider border border-[#203B35]/10">
        <Layers className="w-3 h-3 text-[#5D635F]" />
        <span>CONCEPT DRAFT</span>
      </span>
    );
  };

  // Visibility Badge
  const getVisibilityBadge = () => {
    if (visibility === "Public") {
      return (
        <span
          className="inline-flex items-center gap-1 text-[11px] font-mono text-[#5D635F]"
          title="Visible to the public creative community"
        >
          <Globe className="w-3 h-3 text-[#203B35]" />
          <span>Public</span>
        </span>
      );
    }
    if (visibility === "CollaboratorsOnly") {
      return (
        <span
          className="inline-flex items-center gap-1 text-[11px] font-mono text-[#5D635F]"
          title="Restricted to project collaborators and client reviewers"
        >
          <Users className="w-3 h-3 text-[#203B35]" />
          <span>Collaborators Only</span>
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center gap-1 text-[11px] font-mono text-[#92958F]"
        title="Private workspace draft"
      >
        <Lock className="w-3 h-3 text-[#92958F]" />
        <span>Private</span>
      </span>
    );
  };

  return (
    <section className="relative w-full pt-6 pb-10">
      {/* ============================================================ */}
      {/* 1. EDITORIAL HEADER & METADATA OVERVIEW                      */}
      {/* ============================================================ */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-8 text-center space-y-4">
        {/* Category & Status Row */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <Link
            href={`/explore?category=${encodeURIComponent(category)}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FAF8F3] text-xs font-mono uppercase tracking-wider text-[#203B35] font-semibold border border-[#203B35]/15 shadow-sm hover:bg-[#EFECE2] transition-colors"
          >
            <CelestialSpark className="w-3 h-3 text-[#203B35]" />
            <span>{category}</span>
          </Link>

          {getStatusBadge()}
          {getVisibilityBadge()}

          {selectedVersionNumber !== undefined && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF8F3] text-[11px] font-mono text-[#203B35] border border-[#203B35]/15">
              <span>Iter: v{selectedVersionNumber}</span>
            </span>
          )}
        </div>

        {/* Project Title (Editorial Headline) */}
        <h1 className="font-serif italic font-normal text-3xl sm:text-5xl md:text-6xl text-[#203B35] tracking-tight leading-[1.08] text-balance">
          {title}
        </h1>

        {/* Creator Byline */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-xs text-[#5D635F]">
          <Link
            href={`/profile/${creator.username}`}
            className="inline-flex items-center gap-2 group/creator text-[#203B35] font-semibold hover:text-[#162A26] transition-colors"
          >
            <div className="h-7 w-7 rounded-full bg-[#203B35] text-[#F6F3EB] flex items-center justify-center text-xs overflow-hidden ring-1 ring-[#203B35]/15">
              {creator.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={creator.avatarUrl}
                  alt={creator.displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <CreatorAvatar
                  name={creator.displayName}
                  initials={creator.displayName.slice(0, 2).toUpperCase()}
                  tone="#203B35"
                  accent="#C8BDE0"
                  size="xs"
                />
              )}
            </div>
            <span className="group-hover/creator:underline">{creator.displayName}</span>
            <span className="text-[11px] font-mono text-[#92958F]">@{creator.username}</span>
          </Link>

          <span className="text-[#203B35]/20">•</span>

          <span className="inline-flex items-center gap-1.5 font-mono text-[11.5px]">
            <Calendar className="w-3.5 h-3.5 text-[#92958F]" />
            <span>{formatRelativeDate(createdAt)}</span>
          </span>

          {assets.length > 0 && (
            <>
              <span className="text-[#203B35]/20">•</span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[11.5px]">
                <Layers className="w-3.5 h-3.5 text-[#92958F]" />
                <span>
                  {assets.length} {assets.length === 1 ? "work asset" : "work assets"}
                </span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. IMMERSIVE MEDIA VIEWPORT                                  */}
      {/* ============================================================ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="relative w-full rounded-3xl bg-[#FAF8F3] border border-[#203B35]/15 shadow-[0_8px_32px_rgba(32,59,53,0.06)] overflow-hidden group/stage">
          {/* Top Stage Bar with Carousel Index & Fullscreen Trigger */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
            {hasMultipleAssets && (
              <span className="pointer-events-auto rounded-full bg-[#FAF8F3]/90 backdrop-blur-md px-3 py-1 text-xs font-mono font-medium text-[#203B35] border border-[#203B35]/10 shadow-sm">
                {activeAssetIndex + 1} / {assets.length}
              </span>
            )}
            <div className="ml-auto pointer-events-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenLightbox(activeAssetIndex)}
                className="h-9 w-9 rounded-full bg-[#FAF8F3]/90 hover:bg-white text-[#203B35] flex items-center justify-center backdrop-blur-md border border-[#203B35]/12 shadow-sm transition-all hover:scale-105"
                title="Open immersive fullscreen lightbox"
                aria-label="Expand fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Media Presentation Container */}
          <div className="relative w-full min-h-[380px] sm:min-h-[520px] md:min-h-[620px] max-h-[82vh] bg-[#162A26] flex items-center justify-center overflow-hidden">
            {/* A. IMAGE PRESENTATION */}
            {activeMediaType === "image" && (
              <div
                onClick={() => onOpenLightbox(activeAssetIndex)}
                className="relative w-full h-full min-h-[380px] sm:min-h-[520px] md:min-h-[620px] cursor-zoom-in flex items-center justify-center p-2 sm:p-6"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeMediaUrl}
                  alt={activeAsset?.fileName || title}
                  className="max-h-[78vh] w-auto max-w-full object-contain rounded-xl shadow-2xl transition-transform duration-500 hover:scale-[1.01]"
                />
              </div>
            )}

            {/* B. VIDEO PRESENTATION */}
            {activeMediaType === "video" && (
              <div className="relative w-full h-full min-h-[380px] sm:min-h-[520px] md:min-h-[620px] flex items-center justify-center bg-black/90 p-4">
                <video
                  ref={videoRef}
                  src={activeAsset?.downloadUrl}
                  onTimeUpdate={handleVideoTimeUpdate}
                  onLoadedMetadata={() => {
                    if (videoRef.current) setVideoDuration(videoRef.current.duration);
                  }}
                  onEnded={() => setIsPlayingVideo(false)}
                  className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
                  playsInline
                />

                {/* Custom Overlay Video Controls */}
                <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-black/70 backdrop-blur-md p-3 text-white border border-white/10 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={togglePlayVideo}
                    className="h-9 w-9 rounded-full bg-white text-[#203B35] flex items-center justify-center shadow hover:bg-slate-100 transition-colors shrink-0"
                    aria-label={isPlayingVideo ? "Pause video" : "Play video"}
                  >
                    {isPlayingVideo ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>

                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-300 w-10 text-right">
                      {formatPlaybackTime(videoCurrentTime)}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={videoProgress}
                      onChange={handleVideoSeek}
                      className="flex-1 h-1.5 rounded-lg bg-white/20 accent-[#E85D3F] cursor-pointer"
                    />
                    <span className="text-[11px] font-mono text-slate-300 w-10">
                      {formatPlaybackTime(videoDuration)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={toggleVideoMute}
                    className="p-2 text-white/80 hover:text-white transition-colors"
                    aria-label={isVideoMuted ? "Unmute" : "Mute"}
                  >
                    {isVideoMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* C. AUDIO PRESENTATION */}
            {activeMediaType === "audio" && (
              <div className="relative w-full py-16 px-6 sm:px-12 flex flex-col items-center justify-center text-center space-y-6 bg-gradient-to-b from-[#162A26] to-[#203B35]">
                <div className="relative h-28 w-28 rounded-2xl bg-[#FAF8F3] text-[#203B35] flex items-center justify-center shadow-2xl ring-4 ring-white/10">
                  <Music className="w-12 h-12" />
                  {isPlayingAudio && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9DB5A5] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-[#9DB5A5]"></span>
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-serif text-[#FAF8F3]">
                    {activeAsset?.fileName || "Audio Work"}
                  </h3>
                  <p className="text-xs font-mono text-[#9DB5A5]">
                    {creator.displayName} · {formatFileSize(activeAsset?.fileSize || 0)}
                  </p>
                </div>

                <audio
                  ref={audioRef}
                  src={activeAsset?.downloadUrl}
                  onTimeUpdate={handleAudioTimeUpdate}
                  onLoadedMetadata={() => {
                    if (audioRef.current) setAudioDuration(audioRef.current.duration);
                  }}
                  onEnded={() => setIsPlayingAudio(false)}
                />

                {/* Audio Scrubber & Controls */}
                <div className="w-full max-w-md bg-[#FAF8F3]/95 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-xl space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-[#203B35]">
                    <span>{formatPlaybackTime(audioCurrentTime)}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      <span>{isPlayingAudio ? "Playing" : "Paused"}</span>
                    </div>
                    <span>{formatPlaybackTime(audioDuration)}</span>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={audioProgress}
                    onChange={handleAudioSeek}
                    className="w-full h-2 rounded-lg bg-[#EFECE2] accent-[#203B35] cursor-pointer"
                  />

                  <div className="flex items-center justify-center gap-4 pt-1">
                    <button
                      type="button"
                      onClick={togglePlayAudio}
                      className="h-11 w-11 rounded-full bg-[#203B35] text-[#FAF8F3] hover:bg-[#162A26] flex items-center justify-center shadow-md transition-all hover:scale-105"
                      aria-label={isPlayingAudio ? "Pause audio" : "Play audio"}
                    >
                      {isPlayingAudio ? (
                        <Pause className="w-5 h-5 fill-current" />
                      ) : (
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      )}
                    </button>

                    {activeAsset?.downloadUrl && (
                      <a
                        href={activeAsset.downloadUrl}
                        download={activeAsset.fileName}
                        className="p-2.5 rounded-full bg-[#EFECE2] text-[#203B35] hover:bg-white transition-colors"
                        title="Download track"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* D. DOCUMENT / DESIGN ASSET PRESENTATION */}
            {activeMediaType === "document" && (
              <div className="relative w-full py-16 px-6 sm:px-12 flex flex-col items-center justify-center text-center space-y-6 bg-gradient-to-b from-[#162A26] to-[#203B35]">
                <div className="h-24 w-24 rounded-2xl bg-[#FAF8F3] text-[#203B35] flex items-center justify-center shadow-2xl ring-4 ring-white/10">
                  <FileText className="w-12 h-12" />
                </div>

                <div className="space-y-1.5 max-w-md">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#9DB5A5] bg-[#9DB5A5]/20 px-2.5 py-0.5 rounded-full">
                    Document Deliverable
                  </span>
                  <h3 className="text-xl sm:text-2xl font-serif text-[#FAF8F3] truncate">
                    {activeAsset?.fileName || "Creative Deliverable"}
                  </h3>
                  <p className="text-xs font-mono text-[#FAF8F3]/70">
                    {activeAsset?.mimeType} · {formatFileSize(activeAsset?.fileSize || 0)}
                  </p>
                </div>

                {activeAsset?.downloadUrl && (
                  <a
                    href={activeAsset.downloadUrl}
                    download={activeAsset.fileName}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#FAF8F3] text-[#203B35] hover:bg-white text-xs font-semibold shadow-lg transition-all hover:scale-105"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Project File</span>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Carousel Next / Prev Controls */}
          {hasMultipleAssets && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-[#FAF8F3]/90 hover:bg-white text-[#203B35] flex items-center justify-center shadow-lg transition-all hover:scale-105 border border-[#203B35]/10"
                aria-label="Previous artwork asset"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-[#FAF8F3]/90 hover:bg-white text-[#203B35] flex items-center justify-center shadow-lg transition-all hover:scale-105 border border-[#203B35]/10"
                aria-label="Next artwork asset"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Multi-Asset Thumbnail Strip */}
          {hasMultipleAssets && (
            <div className="p-3 sm:p-4 bg-[#FAF8F3] border-t border-[#203B35]/10 flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto">
              {assets.map((item, idx) => {
                const isSelected = idx === activeAssetIndex;
                const itemType = getMediaType(item);
                const thumbUrl = item.downloadUrl || fallbackCoverUrl;

                return (
                  <button
                    key={item.id || idx}
                    type="button"
                    onClick={() => setActiveAssetIndex(idx)}
                    className={`relative h-14 w-20 sm:h-16 sm:w-24 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                      isSelected
                        ? "border-[#203B35] ring-2 ring-[#203B35]/20 scale-105 shadow-md"
                        : "border-transparent opacity-70 hover:opacity-100 hover:border-[#203B35]/40"
                    }`}
                  >
                    {itemType === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbUrl}
                        alt={item.fileName}
                        className="h-full w-full object-cover"
                      />
                    ) : itemType === "video" ? (
                      <div className="h-full w-full bg-[#162A26] flex items-center justify-center text-[#FAF8F3]">
                        <VideoIcon className="w-5 h-5" />
                      </div>
                    ) : itemType === "audio" ? (
                      <div className="h-full w-full bg-[#203B35] flex items-center justify-center text-[#FAF8F3]">
                        <Music className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="h-full w-full bg-[#EFECE2] flex items-center justify-center text-[#203B35]">
                        <FileText className="w-5 h-5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Short Project Description / Artist Statement (Editorial Lead) */}
        {description && (
          <div className="mt-8 max-w-3xl mx-auto text-center px-4">
            <p className="font-sans text-base sm:text-lg text-[#282B2A]/90 leading-relaxed font-normal">
              {description}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
