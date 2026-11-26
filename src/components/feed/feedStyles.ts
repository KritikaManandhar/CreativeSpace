import type { FeedCommentItem, FeedPostKind } from "@/data/mockFeed";

/** Returns editorial badge classes aligned with `ProfileShowcaseTabs` post kind styles. */
export function getFeedPostKindBadgeClass(kind: FeedPostKind): string {
  switch (kind) {
    case "Process Log":
      return "bg-[#9DB5A5]/25 text-[#203B35] border-[#9DB5A5]/50";
    case "Critique Request":
      return "bg-[#C8BDE0]/30 text-[#203B35] border-[#C8BDE0]/60";
    case "Milestone":
      return "bg-[#203B35] text-[#F6F3EB] border-[#203B35]";
    case "Project Update":
      return "bg-[#F6F3EB] text-[#203B35] border-[#203B35]/25";
    default:
      return "bg-[#EFECE2] text-[#203B35] border-[#203B35]/15";
  }
}

/** Counts top-level comments plus any nested replies on a post. */
export function countPostDiscussionEntries(comments: FeedCommentItem[]): number {
  return comments.reduce((total, comment) => total + 1 + comment.replies.length, 0);
}
