"use client";

import React, { useState } from "react";
import { MotionConfig, motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Feather,
  Layers,
  Lightbulb,
  X,
} from "lucide-react";
import { AuthenticatedNavbar } from "@/components/navigation/AuthenticatedNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { WelcomeOverviewSection } from "./WelcomeOverviewSection";
import { MyProjectsSection } from "./MyProjectsSection";
import { MyServicesSection } from "./MyServicesSection";
import { BookingsSection } from "./BookingsSection";
import { MyPostsSection } from "./MyPostsSection";
import { IdeasCollaborationsSection } from "./IdeasCollaborationsSection";
import { RecentActivitySection } from "./RecentActivitySection";
import {
  CreateProjectModal,
  PublishPostModal,
  CreateServiceModal,
  StartIdeaModal,
  BookingDetailModal,
} from "./DashboardModals";
import { AlternativeTimeModal } from "./AlternativeTimeModal";
import { BookingMessagingModal } from "./BookingMessagingModal";
import {
  getStoredBookings,
  saveStoredBookings,
  confirmBookingAndCloseCompeting,
  type BookingMessage,
  type UnifiedBookingItem,
} from "@/lib/bookingStore";
import {
  getStoredProjects,
  saveStoredProjects,
  createStoredProject,
  updateStoredProject,
  subscribeToProjects,
} from "@/lib/projectStore";
import {
  INITIAL_DASHBOARD_IDEAS,
  INITIAL_DASHBOARD_ACTIVITY,
  INITIAL_DASHBOARD_SERVICES,
  INITIAL_DASHBOARD_POSTS,
  type DashboardIdeaItem,
  type DashboardActivityItem,
} from "@/data/mockDashboard";
import { MOCK_PROFILES, type ProfileProjectItem, type ProfileServiceItem, type ProfilePostItem } from "@/data/mockProfiles";

export type DashboardSectionTab =
  | "projects"
  | "services"
  | "bookings"
  | "posts"
  | "ideas"
  | "activity";

interface DashboardClientProps {
  currentUser?: {
    id?: string;
    name?: string | null;
    displayName?: string | null;
    username?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
  } | null;
}

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
}

export function DashboardClient({ currentUser }: DashboardClientProps) {
  // Use session user or default to Anya Sharma persona
  const defaultUser = MOCK_PROFILES.anya_art;
  const user = {
    displayName: currentUser?.displayName || currentUser?.name || defaultUser.displayName,
    username: currentUser?.username || defaultUser.username,
    avatarUrl: currentUser?.avatarUrl || defaultUser.avatarUrl,
    headline: defaultUser.headline,
    location: defaultUser.location,
  };

  // State collections
  const [projects, setProjects] = useState<ProfileProjectItem[]>(() => getStoredProjects());
  const [editingProject, setEditingProject] = useState<ProfileProjectItem | null>(null);
  const [services, setServices] = useState<ProfileServiceItem[]>(INITIAL_DASHBOARD_SERVICES);
  const [bookings, setBookings] = useState<UnifiedBookingItem[]>(() => getStoredBookings());
  const [ideas, setIdeas] = useState<DashboardIdeaItem[]>(INITIAL_DASHBOARD_IDEAS);
  const [posts, setPosts] = useState<ProfilePostItem[]>(INITIAL_DASHBOARD_POSTS);
  const [activity, setActivity] = useState<DashboardActivityItem[]>(INITIAL_DASHBOARD_ACTIVITY);

  // Subscribe to persistent project store
  React.useEffect(() => {
    const unsubscribe = subscribeToProjects((updatedProjects) => {
      setProjects(updatedProjects);
    });
    return unsubscribe;
  }, []);

  // Active view tab
  const [activeTab, setActiveTab] = useState<DashboardSectionTab>("projects");

  // Modals state
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [publishPostOpen, setPublishPostOpen] = useState(false);
  const [createServiceOpen, setCreateServiceOpen] = useState(false);
  const [startIdeaOpen, setStartIdeaOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<UnifiedBookingItem | null>(null);
  const [alternativeModalData, setAlternativeModalData] = useState<{
    booking: UnifiedBookingItem;
    actorRole: "creator" | "client";
  } | null>(null);
  const [messagingBooking, setMessagingBooking] = useState<UnifiedBookingItem | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (title: string, description?: string) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // =========================================================================
  // Handlers for Projects
  // =========================================================================
  const handleCreateOrUpdateProject = (proj: ProfileProjectItem) => {
    const exists = projects.some((p) => p.id === proj.id);
    let saved: ProfileProjectItem;

    if (exists) {
      saved = updateStoredProject(proj.id, proj) || proj;
      setProjects((prev) => prev.map((p) => (p.id === proj.id ? saved : p)));
      showToast(
        saved.isPublished ? "Project Updated & Published" : "Draft Updated",
        `'${saved.title}' has been updated ${saved.isPublished ? "and is live on your profile" : "in your draft workspace"}.`
      );
    } else {
      saved = createStoredProject(proj);
      setProjects((prev) => [saved, ...prev.filter((p) => p.id !== saved.id)]);
      setActivity((prev) => [
        {
          id: `act-${Date.now()}`,
          category: "project",
          title: saved.isPublished ? "New project published" : "New project drafted",
          description: `${saved.isPublished ? "Published" : "Drafted"} '${saved.title}' in your personal atelier.`,
          timestamp: "Just now",
          actorName: user.displayName,
          actorHandle: user.username,
          actorInitials: "AS",
          actorTone: "#203B35",
          actorAccent: "#C8BDE0",
          targetSection: "projects",
          unread: true,
        },
        ...prev,
      ]);
      showToast(
        saved.isPublished ? "Project Published" : "Draft Saved",
        `'${saved.title}' has been ${saved.isPublished ? "published to your public profile" : "saved as draft in your atelier"}.`
      );
    }
  };

  const handleUpdateProjectStatus = (
    projectId: string,
    newStatus: ProfileProjectItem["status"]
  ) => {
    const updated = updateStoredProject(projectId, { status: newStatus });
    if (updated) {
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? updated : p))
      );
      showToast("Status Updated", `Project status shifted to ${newStatus}.`);
    } else {
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p))
      );
    }
  };

  // =========================================================================
  // Handlers for Services
  // =========================================================================
  const handleCreateService = (newSrv: Partial<ProfileServiceItem>) => {
    const created = newSrv as ProfileServiceItem;
    setServices((prev) => [created, ...prev]);
    setActivity((prev) => [
      {
        id: `act-${Date.now()}`,
        category: "service",
        title: "New service created",
        description: `Added '${created.title}' to your offerings.`,
        timestamp: "Just now",
        actorName: user.displayName,
        actorHandle: user.username,
        actorInitials: "AS",
        actorTone: "#203B35",
        actorAccent: "#C8BDE0",
        targetSection: "services",
        unread: true,
      },
      ...prev,
    ]);
    showToast("Service Created", `'${created.title}' is now ${created.isPublished ? "live on your profile" : "in draft mode"}.`);
  };

  const handleToggleServicePublication = (serviceId: string) => {
    let nowLive = false;
    let srvTitle = "";

    setServices((prev) =>
      prev.map((s) => {
        if (s.id === serviceId) {
          nowLive = !s.isPublished;
          srvTitle = s.title;
          return { ...s, isPublished: !s.isPublished };
        }
        return s;
      })
    );

    showToast(
      nowLive ? "Service Published" : "Service Set to Draft",
      `'${srvTitle}' is ${nowLive ? "now visible to prospective clients" : "hidden from public view"}.`
    );
  };

  // =========================================================================
  // Handlers for Unified Bookings Architecture
  // =========================================================================
  const updateBookingsAndPersist = (
    updater: (prev: UnifiedBookingItem[]) => UnifiedBookingItem[]
  ) => {
    setBookings((prev) => {
      const next = updater(prev);
      saveStoredBookings(next);
      return next;
    });
  };

  const handleSelectBookingToProceed = (bookingId: string) => {
    updateBookingsAndPersist((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: "Selected",
              selectedAt: new Date().toISOString(),
              has48HourReminder: false,
            }
          : b
      )
    );
    showToast(
      "Client Selected to Proceed",
      "Request marked as selected. Competing requests remain pending until confirmed."
    );
  };

  const handleReleaseSelection = (bookingId: string) => {
    updateBookingsAndPersist((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, status: "Pending", selectedAt: undefined, has48HourReminder: false }
          : b
      )
    );
    showToast(
      "Selection Released",
      "Request returned to pending queue. Competing requests remain active."
    );
  };

  const handleDeclineBooking = (bookingId: string) => {
    updateBookingsAndPersist((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "Declined" } : b))
    );
    showToast("Booking Declined", "Request has been archived.");
  };

  const handleSubmitAlternativeProposal = (
    bookingId: string,
    proposedDate: string,
    proposedSlot: string,
    note?: string
  ) => {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const actorRole = alternativeModalData?.actorRole || "creator";

    updateBookingsAndPersist((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;

        const newEntry = {
          id: `neg-${Date.now()}`,
          actor: actorRole,
          actorName: user.displayName,
          actorHandle: user.username,
          action:
            b.proposalStatus === "ProposedByCreator" ||
            b.proposalStatus === "ProposedByClient"
              ? ("counter_proposed" as const)
              : ("proposed" as const),
          proposedDate,
          proposedSlot,
          note,
          timestamp: "Just now",
          expiresAt,
        };

        return {
          ...b,
          proposalStatus:
            actorRole === "creator"
              ? ("ProposedByCreator" as const)
              : ("ProposedByClient" as const),
          proposedAlternativeDate: proposedDate,
          proposedAlternativeSlot: proposedSlot,
          proposalExpiresAt: expiresAt,
          negotiationHistory: [newEntry, ...b.negotiationHistory],
        };
      })
    );

    showToast(
      "Alternative Proposal Sent",
      "Dual slot holds (S1 & S2) active. 24-hour response timer reset for recipient."
    );
  };

  const handleAcceptAlternative = (
    bookingId: string,
    actor: "creator" | "client"
  ) => {
    updateBookingsAndPersist((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;

        const newEntry = {
          id: `neg-${Date.now()}`,
          actor,
          actorName: user.displayName,
          actorHandle: user.username,
          action: "accepted" as const,
          proposedDate: b.proposedAlternativeDate || b.scheduledDate,
          proposedSlot: b.proposedAlternativeSlot || b.timeSlot,
          timestamp: "Just now",
          expiresAt: "",
        };

        return {
          ...b,
          scheduledDate: b.proposedAlternativeDate || b.scheduledDate,
          timeSlot: b.proposedAlternativeSlot || b.timeSlot,
          proposalStatus: "Accepted" as const,
          negotiationHistory: [newEntry, ...b.negotiationHistory],
        };
      })
    );

    showToast(
      "Alternative Time Accepted",
      "Booking time updated to agreed slot. Original slot released."
    );
  };

  const handleDeclineAlternative = (
    bookingId: string,
    actor: "creator" | "client"
  ) => {
    updateBookingsAndPersist((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;

        const newEntry = {
          id: `neg-${Date.now()}`,
          actor,
          actorName: user.displayName,
          actorHandle: user.username,
          action: "declined" as const,
          proposedDate: b.proposedAlternativeDate || "",
          proposedSlot: b.proposedAlternativeSlot || "",
          timestamp: "Just now",
          expiresAt: "",
        };

        return {
          ...b,
          proposalStatus: "Declined" as const,
          proposedAlternativeDate: undefined,
          proposedAlternativeSlot: undefined,
          negotiationHistory: [newEntry, ...b.negotiationHistory],
        };
      })
    );

    showToast(
      "Alternative Declined",
      "Alternative slot released. Original booking slot and selection state restored."
    );
  };

  const handleConfirmBooking = (bookingId: string) => {
    let closedCount = 0;
    updateBookingsAndPersist((prev) => {
      const res = confirmBookingAndCloseCompeting(prev, bookingId);
      closedCount = res.closedCount;
      return res.updatedBookings;
    });

    showToast(
      "Booking Confirmed",
      closedCount > 0
        ? `Agreed slot reserved. ${closedCount} competing pending request(s) closed.`
        : "Agreed slot reserved. Competing pending requests closed."
    );
  };

  const handleSendMessage = (
    bookingId: string,
    content: string,
    attachment?: {
      url: string;
      type: "image" | "qr_code" | "file";
      caption?: string;
    }
  ) => {
    updateBookingsAndPersist((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        const newMsg: BookingMessage = {
          id: `msg-${Date.now()}`,
          senderId: user.username,
          senderName: user.displayName,
          senderHandle: user.username,
          senderRole: (b.direction === "incoming" ? "creator" : "client") as
            | "creator"
            | "client",
          content,
          timestamp: "Just now",
          attachmentUrl: attachment?.url,
          attachmentType: attachment?.type,
          attachmentCaption: attachment?.caption,
        };
        const updated = {
          ...b,
          messages: [...b.messages, newMsg],
        };
        if (messagingBooking && messagingBooking.id === bookingId) {
          setMessagingBooking(updated);
        }
        return updated;
      })
    );
  };

  const handleOpenMessaging = (booking: UnifiedBookingItem) => {
    // Messaging becomes available when a booking reaches Selected status, not only Confirmed.
    if (booking.status === "Pending") {
      showToast(
        "Messaging Inactive",
        "Private messaging is enabled after a booking is selected to proceed or confirmed."
      );
      return;
    }
    setMessagingBooking(booking);
  };

  // =========================================================================
  // Handlers for Posts
  // =========================================================================
  const handlePublishPost = (newPost: Partial<ProfilePostItem>) => {
    const created = newPost as ProfilePostItem;
    setPosts((prev) => [created, ...prev]);
    setActivity((prev) => [
      {
        id: `act-${Date.now()}`,
        category: "post",
        title: "Post published to community",
        description: `Shared '${created.title || created.kind}' to the community feed.`,
        timestamp: "Just now",
        actorName: user.displayName,
        actorHandle: user.username,
        actorInitials: "AS",
        actorTone: "#203B35",
        actorAccent: "#C8BDE0",
        targetSection: "posts",
      },
      ...prev,
    ]);
    showToast("Post Published", "Your studio update is now live on the Community Feed.");
  };

  const handleDeletePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    showToast("Post Removed", "The post has been deleted from your studio.");
  };

  // =========================================================================
  // Handlers for Ideas & Collaborations
  // =========================================================================
  const handleStartIdea = (newIdea: Partial<DashboardIdeaItem>) => {
    const created = newIdea as DashboardIdeaItem;
    setIdeas((prev) => [created, ...prev]);
    setActivity((prev) => [
      {
        id: `act-${Date.now()}`,
        category: "idea",
        title: "New idea initiated",
        description: `Started '${created.title}' in the collaborative spaces.`,
        timestamp: "Just now",
        actorName: user.displayName,
        actorHandle: user.username,
        actorInitials: "AS",
        actorTone: "#203B35",
        actorAccent: "#C8BDE0",
        targetSection: "ideas",
      },
      ...prev,
    ]);
    showToast("Idea Spark Seeded", `'${created.title}' is now open for collaboration.`);
  };

  const handleAdvanceIdeaStage = (ideaId: string) => {
    const STAGES: DashboardIdeaItem["stage"][] = [
      "Spark",
      "Concept & Moodboard",
      "Active Production",
      "Review & Polish",
      "Completed",
    ];

    let nextStageName = "";
    setIdeas((prev) =>
      prev.map((item) => {
        if (item.id === ideaId) {
          const curIdx = STAGES.indexOf(item.stage);
          const nextIdx = (curIdx + 1) % STAGES.length;
          const nextStage = STAGES[nextIdx];
          nextStageName = nextStage;
          const progressMap: Record<string, number> = {
            Spark: 20,
            "Concept & Moodboard": 45,
            "Active Production": 70,
            "Review & Polish": 90,
            Completed: 100,
          };
          return {
            ...item,
            stage: nextStage,
            stageProgress: progressMap[nextStage] || 50,
            lastUpdate: `Stage advanced to ${nextStage} just now`,
          };
        }
        return item;
      })
    );

    showToast("Stage Advanced", `Journey updated to '${nextStageName}'.`);
  };

  // Handle tab switching & section navigation
  const handleNavigateSection = (sectionId: string) => {
    if (
      sectionId === "projects" ||
      sectionId === "services" ||
      sectionId === "bookings" ||
      sectionId === "posts" ||
      sectionId === "ideas" ||
      sectionId === "activity"
    ) {
      setActiveTab(sectionId as DashboardSectionTab);
    }
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 40);
  };

  const dashboardTabs: {
    id: DashboardSectionTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count: number;
  }[] = [
    {
      id: "projects",
      label: "My Projects",
      icon: Layers,
      count: projects.length,
    },
    {
      id: "services",
      label: "My Services",
      icon: Briefcase,
      count: services.length,
    },
    {
      id: "bookings",
      label: "Bookings",
      icon: Calendar,
      count: bookings.length,
    },
    {
      id: "posts",
      label: "My Posts",
      icon: Feather,
      count: posts.length,
    },
    {
      id: "ideas",
      label: "Ideas & Collabs",
      icon: Lightbulb,
      count: ideas.length,
    },
    {
      id: "activity",
      label: "Recent Activity",
      icon: Clock,
      count: activity.length,
    },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen w-full bg-[#F6F3EB] text-[#282B2A] selection:bg-[#203B35] selection:text-[#F6F3EB] overflow-x-clip flex flex-col justify-between">
        {/* ======================================================== */}
        {/* Platform Navigation Bar                                   */}
        {/* ======================================================== */}
        <AuthenticatedNavbar
          activeNav="dashboard"
          onCreatePost={() => setPublishPostOpen(true)}
        />

        {/* ======================================================== */}
        {/* Main Dashboard Workspace                                 */}
        {/* ======================================================== */}
        <main className="relative z-10 mx-auto w-full max-w-[1320px] px-4 sm:px-8 lg:px-12 py-7 sm:py-10 space-y-10 sm:space-y-12">
          {/* Section 1: Welcome Overview */}
          <WelcomeOverviewSection
            user={user}
            bookings={bookings}
          />

          {/* Workspace Sections Filter Bar */}
          <div className="sticky top-20 z-20 -mx-4 sm:-mx-8 lg:-mx-12 px-4 sm:px-8 lg:px-12 py-2.5 bg-[#F6F3EB]/95 backdrop-blur-md border-y border-[#203B35]/08">
            <div className="mx-auto max-w-[1320px] flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
              <div
                role="tablist"
                aria-label="Dashboard sections filter"
                className="flex items-center overflow-x-auto rounded-full border border-[#203B35]/15 bg-[#FAF8F3] p-1 gap-1 scrollbar-none"
              >
                {dashboardTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      id={`tab-${tab.id}`}
                      aria-selected={isActive}
                      aria-controls={`panel-${tab.id}`}
                      onClick={() => setActiveTab(tab.id)}
                      className={`inline-flex shrink-0 whitespace-nowrap items-center justify-center gap-1.5 sm:gap-2 rounded-full px-3.5 sm:px-4 py-2 text-[12px] sm:text-[13px] font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
                        isActive
                          ? "bg-[#203B35] text-[#F6F3EB] shadow-sm"
                          : "text-[#5D635F] hover:text-[#203B35] hover:bg-[#EFECE2]/70"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span>{tab.label}</span>
                      <span
                        className={`rounded-full px-1.5 sm:px-2 py-0.5 font-mono text-[10px] sm:text-[10.5px] tabular-nums ${
                          isActive
                            ? "bg-[#F6F3EB]/20 text-[#F6F3EB]"
                            : "bg-[#EFECE2] text-[#203B35]"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 2: My Projects */}
          {activeTab === "projects" && (
            <MyProjectsSection
              projects={projects}
              onCreateProject={() => {
                setEditingProject(null);
                setCreateProjectOpen(true);
              }}
              onUpdateProjectStatus={handleUpdateProjectStatus}
              onSelectProject={(p) => {
                setEditingProject(p);
                setCreateProjectOpen(true);
              }}
            />
          )}

          {/* Section 3: My Services */}
          {activeTab === "services" && (
            <MyServicesSection
              services={services}
              onCreateService={() => setCreateServiceOpen(true)}
              onTogglePublication={handleToggleServicePublication}
              onEditService={(s) =>
                showToast("Edit Service", `Opening settings for '${s.title}'.`)
              }
            />
          )}

          {/* Section 4: Bookings */}
          {activeTab === "bookings" && (
            <BookingsSection
              bookings={bookings}
              currentUserHandle={user.username}
              onSelectBookingToProceed={handleSelectBookingToProceed}
              onReleaseSelection={handleReleaseSelection}
              onDeclineBooking={handleDeclineBooking}
              onConfirmBooking={handleConfirmBooking}
              onOpenBookingDetail={(b) => setSelectedBooking(b)}
              onOpenAlternativeModal={(booking, actorRole) =>
                setAlternativeModalData({ booking, actorRole })
              }
              onAcceptAlternative={handleAcceptAlternative}
              onDeclineAlternative={handleDeclineAlternative}
              onOpenMessaging={handleOpenMessaging}
            />
          )}

          {/* Section 5: My Posts */}
          {activeTab === "posts" && (
            <MyPostsSection
              posts={posts}
              onPublishPost={() => setPublishPostOpen(true)}
              onDeletePost={handleDeletePost}
              onEditPost={(p) =>
                showToast("Edit Post", `Editing '${p.title || p.kind}'.`)
              }
            />
          )}

          {/* Section 6: Ideas & Collaborations */}
          {activeTab === "ideas" && (
            <IdeasCollaborationsSection
              ideas={ideas}
              onStartIdea={() => setStartIdeaOpen(true)}
              onAdvanceStage={handleAdvanceIdeaStage}
              onSelectIdea={(i) =>
                showToast("Collaborative Space", `Entering shared canvas for '${i.title}'.`)
              }
            />
          )}

          {/* Section 7: Recent Activity */}
          {activeTab === "activity" && (
            <RecentActivitySection
              activity={activity}
              onNavigateSection={handleNavigateSection}
            />
          )}
        </main>

        {/* ======================================================== */}
        {/* Modals                                                   */}
        {/* ======================================================== */}
        <CreateProjectModal
          isOpen={createProjectOpen}
          onClose={() => {
            setCreateProjectOpen(false);
            setEditingProject(null);
          }}
          onSubmit={handleCreateOrUpdateProject}
          initialProject={editingProject}
        />

        <PublishPostModal
          isOpen={publishPostOpen}
          onClose={() => setPublishPostOpen(false)}
          onSubmit={handlePublishPost}
          availableProjects={projects}
        />

        <CreateServiceModal
          isOpen={createServiceOpen}
          onClose={() => setCreateServiceOpen(false)}
          onSubmit={handleCreateService}
        />

        <StartIdeaModal
          isOpen={startIdeaOpen}
          onClose={() => setStartIdeaOpen(false)}
          onSubmit={handleStartIdea}
        />

        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onSelectToProceed={handleSelectBookingToProceed}
          onReleaseSelection={handleReleaseSelection}
          onConfirmBooking={handleConfirmBooking}
          onDecline={handleDeclineBooking}
          onOpenAlternative={(booking, actorRole) =>
            setAlternativeModalData({ booking, actorRole })
          }
          onAcceptAlternative={handleAcceptAlternative}
          onDeclineAlternative={handleDeclineAlternative}
          onOpenMessaging={handleOpenMessaging}
        />

        <AlternativeTimeModal
          booking={alternativeModalData?.booking || null}
          actorRole={alternativeModalData?.actorRole || "creator"}
          isOpen={Boolean(alternativeModalData)}
          onClose={() => setAlternativeModalData(null)}
          onSubmitProposal={handleSubmitAlternativeProposal}
        />

        <BookingMessagingModal
          booking={messagingBooking}
          currentUserId={user.username}
          currentUserName={user.displayName}
          currentUserHandle={user.username}
          isOpen={Boolean(messagingBooking)}
          onClose={() => setMessagingBooking(null)}
          onSendMessage={handleSendMessage}
        />

        {/* ======================================================== */}
        {/* Floating Toast Notification Container                   */}
        {/* ======================================================== */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-[#203B35]/20 bg-[#203B35] text-[#FAF8F3] px-4 py-3 shadow-2xl max-w-sm"
              >
                <CheckCircle2 className="h-4 w-4 text-[#4E9F76] shrink-0 mt-0.5" />
                <div className="space-y-0.5 flex-1">
                  <p className="text-xs font-semibold">{toast.title}</p>
                  {toast.description && (
                    <p className="text-[11.5px] text-[#FAF8F3]/80 leading-relaxed">
                      {toast.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="p-0.5 text-[#FAF8F3]/60 hover:text-[#FAF8F3]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Platform Footer */}
        <LandingFooter />
      </div>
    </MotionConfig>
  );
}
