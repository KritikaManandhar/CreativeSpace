"use client";

import React, { useState } from "react";
import { MotionConfig, motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChevronRight, Sparkles, X } from "lucide-react";
import { AuthenticatedNavbar } from "@/components/navigation/AuthenticatedNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { WelcomeOverviewSection } from "./WelcomeOverviewSection";
import { QuickActionsSection } from "./QuickActionsSection";
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
import {
  INITIAL_DASHBOARD_BOOKINGS,
  INITIAL_DASHBOARD_IDEAS,
  INITIAL_DASHBOARD_ACTIVITY,
  INITIAL_DASHBOARD_PROJECTS,
  INITIAL_DASHBOARD_SERVICES,
  INITIAL_DASHBOARD_POSTS,
  type DashboardBookingItem,
  type DashboardIdeaItem,
  type DashboardActivityItem,
} from "@/data/mockDashboard";
import { MOCK_PROFILES, type ProfileProjectItem, type ProfileServiceItem, type ProfilePostItem } from "@/data/mockProfiles";

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
  const [projects, setProjects] = useState<ProfileProjectItem[]>(INITIAL_DASHBOARD_PROJECTS);
  const [services, setServices] = useState<ProfileServiceItem[]>(INITIAL_DASHBOARD_SERVICES);
  const [bookings, setBookings] = useState<DashboardBookingItem[]>(INITIAL_DASHBOARD_BOOKINGS);
  const [ideas, setIdeas] = useState<DashboardIdeaItem[]>(INITIAL_DASHBOARD_IDEAS);
  const [posts, setPosts] = useState<ProfilePostItem[]>(INITIAL_DASHBOARD_POSTS);
  const [activity, setActivity] = useState<DashboardActivityItem[]>(INITIAL_DASHBOARD_ACTIVITY);

  // Active view tab
  const [activeTab, setActiveTab] = useState<string>("all");

  // Modals state
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [publishPostOpen, setPublishPostOpen] = useState(false);
  const [createServiceOpen, setCreateServiceOpen] = useState(false);
  const [startIdeaOpen, setStartIdeaOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<DashboardBookingItem | null>(null);

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
  const handleCreateProject = (newProj: Partial<ProfileProjectItem>) => {
    const created = newProj as ProfileProjectItem;
    setProjects((prev) => [created, ...prev]);
    setActivity((prev) => [
      {
        id: `act-${Date.now()}`,
        category: "project",
        title: "New project created",
        description: `Created '${created.title}' in your personal atelier.`,
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
    showToast("Project Created", `'${created.title}' has been added to your workspace.`);
  };

  const handleUpdateProjectStatus = (
    projectId: string,
    newStatus: ProfileProjectItem["status"]
  ) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p))
    );
    showToast("Status Updated", `Project status shifted to ${newStatus}.`);
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
  // Handlers for Bookings
  // =========================================================================
  const handleAcceptBooking = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "Confirmed" } : b))
    );
    setActivity((prev) => [
      {
        id: `act-${Date.now()}`,
        category: "booking",
        title: "Booking accepted",
        description: "You accepted the request and confirmed the milestone slot.",
        timestamp: "Just now",
        actorName: user.displayName,
        actorHandle: user.username,
        actorInitials: "AS",
        actorTone: "#203B35",
        actorAccent: "#C8BDE0",
        targetSection: "bookings",
      },
      ...prev,
    ]);
    showToast("Booking Confirmed", "Client has been notified and session milestone is locked.");
  };

  const handleDeclineBooking = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "Declined" } : b))
    );
    showToast("Booking Declined", "Request has been archived.");
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

  // Smooth jump to anchor
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

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
            projects={projects}
            services={services}
            bookings={bookings}
            ideas={ideas}
            posts={posts}
            onNavigateSection={scrollToSection}
          />

          {/* Section 2: Quick Actions */}
          <QuickActionsSection
            onCreateProject={() => setCreateProjectOpen(true)}
            onPublishPost={() => setPublishPostOpen(true)}
            onCreateService={() => setCreateServiceOpen(true)}
            onStartIdea={() => setStartIdeaOpen(true)}
          />

          {/* Workspace Sections Anchor Bar */}
          <div className="sticky top-20 z-20 -mx-4 sm:-mx-8 lg:-mx-12 px-4 sm:px-8 lg:px-12 py-2.5 bg-[#F6F3EB]/95 backdrop-blur-md border-y border-[#203B35]/08">
            <div className="mx-auto max-w-[1320px] flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#5D635F] mr-2 shrink-0 hidden md:inline">
                Jump To:
              </span>
              {[
                { id: "projects", label: "My Projects", count: projects.length },
                { id: "services", label: "My Services", count: services.length },
                { id: "bookings", label: "Bookings", count: bookings.length },
                { id: "posts", label: "My Posts", count: posts.length },
                { id: "ideas", label: "Ideas & Collabs", count: ideas.length },
                { id: "activity", label: "Recent Activity", count: activity.length },
              ].map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => scrollToSection(link.id)}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#203B35]/12 bg-[#FAF8F3] px-3.5 py-1.5 text-xs font-medium text-[#203B35] hover:bg-[#203B35] hover:text-[#FAF8F3] hover:border-[#203B35] transition-all shrink-0"
                >
                  <span>{link.label}</span>
                  <span className="font-mono text-[10px] opacity-70">
                    ({link.count})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: My Projects */}
          <MyProjectsSection
            projects={projects}
            onCreateProject={() => setCreateProjectOpen(true)}
            onUpdateProjectStatus={handleUpdateProjectStatus}
            onSelectProject={(p) =>
              showToast("Project Workspace", `Opening management workspace for '${p.title}'.`)
            }
          />

          {/* Section 4: My Services */}
          <MyServicesSection
            services={services}
            onCreateService={() => setCreateServiceOpen(true)}
            onTogglePublication={handleToggleServicePublication}
            onEditService={(s) =>
              showToast("Edit Service", `Opening settings for '${s.title}'.`)
            }
          />

          {/* Section 5: Bookings */}
          <BookingsSection
            bookings={bookings}
            onAcceptBooking={handleAcceptBooking}
            onDeclineBooking={handleDeclineBooking}
            onSelectBooking={(b) => setSelectedBooking(b)}
          />

          {/* Section 6: My Posts */}
          <MyPostsSection
            posts={posts}
            onPublishPost={() => setPublishPostOpen(true)}
            onDeletePost={handleDeletePost}
            onEditPost={(p) =>
              showToast("Edit Post", `Editing '${p.title || p.kind}'.`)
            }
          />

          {/* Section 7: Ideas & Collaborations */}
          <IdeasCollaborationsSection
            ideas={ideas}
            onStartIdea={() => setStartIdeaOpen(true)}
            onAdvanceStage={handleAdvanceIdeaStage}
            onSelectIdea={(i) =>
              showToast("Collaborative Space", `Entering shared canvas for '${i.title}'.`)
            }
          />

          {/* Section 8: Recent Activity */}
          <RecentActivitySection
            activity={activity}
            onNavigateSection={scrollToSection}
          />
        </main>

        {/* ======================================================== */}
        {/* Modals                                                   */}
        {/* ======================================================== */}
        <CreateProjectModal
          isOpen={createProjectOpen}
          onClose={() => setCreateProjectOpen(false)}
          onSubmit={handleCreateProject}
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
          onAccept={handleAcceptBooking}
          onDecline={handleDeclineBooking}
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
