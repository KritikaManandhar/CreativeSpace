"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ExternalLink,
  GitBranch,
  Heart,
  MessageCircle,
  MoreHorizontal,
  PenTool,
  Pin,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { ProfilePostItem, PostKind } from "@/data/mockProfiles";

interface MyPostsSectionProps {
  posts: ProfilePostItem[];
  onPublishPost: () => void;
  onDeletePost?: (postId: string) => void;
  onEditPost?: (post: ProfilePostItem) => void;
}

export function MyPostsSection({
  posts,
  onPublishPost,
  onDeletePost,
  onEditPost,
}: MyPostsSectionProps) {
  const [filter, setFilter] = useState<string>("All");
  const [pinnedPostId, setPinnedPostId] = useState<string | null>("post-anya-1");

  const filterTabs = useMemo(() => {
    return [
      { key: "All", label: "All Posts", count: posts.length },
      {
        key: "Studio Note",
        label: "Studio Notes",
        count: posts.filter((p) => p.kind === "Studio Note").length,
      },
      {
        key: "Process Log",
        label: "Process Logs",
        count: posts.filter((p) => p.kind === "Process Log").length,
      },
      {
        key: "Critique Request",
        label: "Critiques",
        count: posts.filter((p) => p.kind === "Critique Request").length,
      },
    ];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (filter === "All") return posts;
    return posts.filter((p) => p.kind === filter);
  }, [posts, filter]);

  const renderKindBadge = (kind: PostKind) => {
    switch (kind) {
      case "Process Log":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#9DB5A5]/60 bg-[#9DB5A5]/25 px-2.5 py-0.5 text-[11px] font-semibold text-[#203B35]">
            <PenTool className="h-3 w-3 text-[#4E9F76]" />
            Process Log
          </span>
        );
      case "Critique Request":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#C8BDE0]/60 bg-[#C8BDE0]/30 px-2.5 py-0.5 text-[11px] font-semibold text-[#203B35]">
            <Sparkles className="h-3 w-3 text-[#504E63]" />
            Critique Request
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#203B35]/15 bg-[#EFECE2] px-2.5 py-0.5 text-[11px] font-medium text-[#203B35]">
            Studio Note
          </span>
        );
    }
  };

  return (
    <section id="posts" aria-label="My Posts" className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#203B35]/10 pb-3.5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-serif text-xl sm:text-2xl font-normal tracking-tight text-[#203B35]">
              My Posts
            </h2>
            <span className="inline-flex items-center rounded-full bg-[#EFECE2] px-2.5 py-0.5 font-mono text-[11px] font-medium text-[#203B35]">
              {posts.length}
            </span>
          </div>
          <p className="mt-0.5 text-xs sm:text-[13px] text-[#5D635F]">
            Recently published posts, process updates, and access to manage them.
          </p>
        </div>

        <button
          type="button"
          onClick={onPublishPost}
          className="inline-flex items-center gap-2 self-start sm:self-auto rounded-full bg-[#203B35] px-4 py-2 text-xs font-semibold text-[#FAF8F3] hover:bg-[#162A26] transition-colors shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Publish Post</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filterTabs.map((tab) => {
          const isActive = filter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                isActive
                  ? "bg-[#203B35] text-[#FAF8F3]"
                  : "bg-[#EFECE2]/70 text-[#203B35]/80 hover:bg-[#EFECE2]"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`font-mono text-[10px] rounded-full px-1.5 py-0.2 ${
                  isActive
                    ? "bg-[#FAF8F3]/20 text-[#FAF8F3]"
                    : "bg-[#203B35]/10 text-[#203B35]"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#203B35]/20 bg-[#FAF8F3] p-10 text-center">
          <p className="text-sm text-[#5D635F]">No posts in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPosts.map((post) => {
            const isPinned = pinnedPostId === post.id;

            return (
              <div
                key={post.id}
                className="group flex flex-col justify-between rounded-2xl border border-[#203B35]/12 bg-[#FAF8F3] p-5 sm:p-6 transition-all shadow-sm hover:border-[#203B35]/30 hover:shadow-md"
              >
                <div className="space-y-3">
                  {/* Top bar: Kind + Pinned badge + Date */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {renderKindBadge(post.kind)}
                      {isPinned && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#E5A93C]/20 border border-[#E5A93C]/40 px-2 py-0.5 text-[10.5px] font-semibold text-[#8E5A1C]">
                          <Pin className="h-2.5 w-2.5" />
                          <span>Pinned</span>
                        </span>
                      )}
                    </div>

                    <span className="font-mono text-[11px] text-[#5D635F]">
                      {post.createdAt}
                    </span>
                  </div>

                  {/* Post Title */}
                  {post.title && (
                    <h3 className="font-serif text-lg font-normal text-[#203B35] leading-snug group-hover:text-[#162A26] transition-colors">
                      {post.title}
                    </h3>
                  )}

                  {/* Content snippet */}
                  <p className="text-xs sm:text-[13.5px] text-[#282B2A]/85 leading-relaxed line-clamp-3">
                    {post.content}
                  </p>

                  {/* Optional Linked Project Pill */}
                  {post.projectRef && (
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-[#203B35]/12 bg-[#EFECE2]/70 px-2.5 py-1 text-xs text-[#203B35]">
                      <GitBranch className="h-3.5 w-3.5 text-[#4E9F76]" />
                      <span className="font-medium">{post.projectRef.title}</span>
                      {post.projectRef.versionTag && (
                        <span className="font-mono text-[10px] text-[#5D635F]">
                          ({post.projectRef.versionTag})
                        </span>
                      )}
                    </div>
                  )}

                  {/* Optional thumbnail image if attached */}
                  {post.imageUrl && (
                    <div className="relative aspect-[16/8] w-full rounded-xl overflow-hidden border border-[#203B35]/10 bg-[#EFECE2]">
                      <Image
                        src={post.imageUrl}
                        alt={post.imageAlt || post.title || "Post image"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  )}
                </div>

                {/* Bottom Bar: Engagement stats & Management Controls */}
                <div className="mt-4 pt-3.5 border-t border-[#203B35]/08 flex items-center justify-between gap-3 text-xs text-[#5D635F]">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 font-medium text-[#203B35]/80">
                      <Heart className="h-3.5 w-3.5 text-[#e85d3f]" />
                      <span>{post.likeCount} appreciations</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#5D635F]">
                      <MessageCircle className="h-3.5 w-3.5 text-[#203B35]/60" />
                      <span>{post.comments?.length || 0}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setPinnedPostId(isPinned ? null : post.id)
                      }
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-colors ${
                        isPinned
                          ? "bg-[#E5A93C]/20 text-[#8E5A1C]"
                          : "text-[#5D635F] hover:bg-[#EFECE2] hover:text-[#203B35]"
                      }`}
                      title={isPinned ? "Unpin post" : "Pin post to top"}
                    >
                      <Pin className="h-3 w-3" />
                      <span className="hidden sm:inline">
                        {isPinned ? "Pinned" : "Pin"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onEditPost?.(post)}
                      className="inline-flex items-center gap-1 rounded-full border border-[#203B35]/15 bg-[#FAF8F3] px-2.5 py-1 text-xs font-medium text-[#203B35] hover:bg-[#EFECE2] transition-colors"
                    >
                      <span>Edit</span>
                    </button>

                    {onDeletePost && (
                      <button
                        type="button"
                        onClick={() => onDeletePost(post.id)}
                        className="inline-flex items-center p-1 rounded-full text-[#5D635F] hover:text-[#ae361c] hover:bg-[#e85d3f]/10 transition-colors"
                        title="Delete post"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
