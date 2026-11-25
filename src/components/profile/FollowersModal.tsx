"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Users, X, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingState";

interface SafeUserItem {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio?: string | null;
  disciplines?: string[];
}

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorId: string;
  username: string;
  type: "followers" | "following";
}

export function FollowersModal({
  isOpen,
  onClose,
  creatorId,
  username,
  type,
}: FollowersModalProps) {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const loadList = async (nextCursor?: string | null) => {
    setIsLoading(true);
    try {
      const qs = new URLSearchParams({ limit: "20" });
      if (nextCursor) qs.set("cursor", nextCursor);
      const res = await fetch(`/api/users/${creatorId}/${type}?${qs.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        const nextItems = json.data.items || [];
        setItems((prev) => (nextCursor ? [...prev, ...nextItems] : nextItems));
        setHasMore(Boolean(json.data.hasMore));
        setCursor(json.data.nextCursor ?? null);
      }
    } catch {
      // Safe fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setItems([]);
    setCursor(null);
    setHasMore(false);
    loadList(null);
  }, [isOpen, creatorId, type]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-up">
      <div className="relative w-full max-w-md rounded-3xl bg-[#FAF8F3] border border-[#203B35]/20 shadow-2xl p-6 text-[#282B2A]">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-[#5D635F] hover:text-[#203B35] hover:bg-[#203B35]/10 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[#203B35]/10">
          <div className="w-8 h-8 rounded-full bg-[#203B35]/10 flex items-center justify-center text-[#203B35]">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-serif text-[#203B35] font-bold">
              {type === "followers" ? "Followers" : "Following"}
            </h3>
            <p className="text-[11px] font-mono text-[#5D635F]">
              {type === "followers" ? `Creators following @${username}` : `Creators followed by @${username}`}
            </p>
          </div>
        </div>

        {/* List Content */}
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {isLoading && items.length === 0 ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner className="w-6 h-6 text-[#203B35]" />
            </div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#92958F]">
              {type === "followers"
                ? `@${username} doesn't have any followers yet.`
                : `@${username} is not following any creators yet.`}
            </div>
          ) : (
            <>
              {items.map((entry) => {
                const user = entry.user;
                return (
                  <Link
                    key={user.id}
                    href={`/profile/${user.username}`}
                    onClick={onClose}
                    className="flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-[#203B35]/10 hover:border-[#203B35]/30 hover:bg-[#EFECE2]/50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#203B35] text-[#F6F3EB] flex items-center justify-center text-xs font-bold overflow-hidden shrink-0">
                      {user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.avatarUrl}
                          alt={user.displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user.displayName?.charAt(0) || user.username?.charAt(0) || "C"
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#203B35] truncate group-hover:text-[#162A26]">
                        {user.displayName}
                      </p>
                      <p className="text-[11px] font-mono text-[#5D635F] truncate">
                        @{user.username}
                      </p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-[#9DB5A5] group-hover:text-[#203B35] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                  </Link>
                );
              })}

              {hasMore && cursor && (
                <div className="pt-2 flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    isLoading={isLoading}
                    onClick={() => loadList(cursor)}
                    className="rounded-full text-xs"
                  >
                    Load More Creators
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
