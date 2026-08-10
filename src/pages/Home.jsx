import { useState, useEffect } from "react";
import { api } from "@/api/firebaseClient";
import { createPageUrl, getCategoryPhoto, CATEGORY_PRICING, getFallbackTaskerPhoto } from "@/utils";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Search, ArrowRight, Briefcase, MessageCircle, CheckCircle, Star,
  ShieldCheck, Clock, Award, PlusCircle, MapPin, Sparkles, DollarSign,
  TrendingUp, Calendar, AlertCircle, ChevronRight, Zap, FileText
} from "lucide-react";
import { taskCategories } from "@/components/shared/CategoryBadge";
import { useAuth } from "@/lib/AuthContext";
import { useAppMode } from "@/lib/AppModeContext";

const HERO_IMAGE = "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1600&auto=format&fit=crop";

const DEMO_TASKERS = [
  {
    id: "demo-1",
    full_name: "Dawit Abebe",
    city: "addis_ababa",
    hourly_rate: 450,
    avg_rating: 4.9,
    rating_count: 38,
    skills: ["repair", "event", "cleaning"],
    bio: "Experienced handyman and electrician with 6+ years fixing home plumbing, wiring, and carpentry across Addis Ababa.",
    photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop",
    is_verified: true,
    tasks_completed: 42
  },
  {
    id: "demo-2",
    full_name: "Tigist Tadesse",
    city: "addis_ababa",
    hourly_rate: 350,
    avg_rating: 4.8,
    rating_count: 52,
    skills: ["cleaning", "errand", "market"],
    bio: "Reliable house cleaning and errand specialist. Thorough deep cleaning, market grocery shopping, and home organizing.",
    photo_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop",
    is_verified: true,
    tasks_completed: 68
  },
  {
    id: "demo-3",
    full_name: "Yonas Mekonnen",
    city: "hawassa",
    hourly_rate: 500,
    avg_rating: 5.0,
    rating_count: 24,
    skills: ["delivery", "repair", "farming"],
    bio: "Fast delivery courier and equipment repair technician. Punctual, courteous, and background verified.",
    photo_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
    is_verified: true,
    tasks_completed: 31
  },
  {
    id: "demo-4",
    full_name: "Hana Girma",
    city: "addis_ababa",
    hourly_rate: 400,
    avg_rating: 4.9,
    rating_count: 41,
    skills: ["event", "market", "other"],
    bio: "Event setup, catering assistance, and market purchasing. Highly rated by over 40 families and businesses.",
    photo_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop",
    is_verified: true,
    tasks_completed: 53
  }
];

const SAMPLE_LEAD_REQUESTS = [
  {
    id: "lead-101",
    title: "Complete 3-Bedroom Deep House Cleaning",
    city: "addis_ababa",
    category: "cleaning",
    budget: 1500,
    date_needed: "2026-08-11",
    poster_name: "Selam W."
  },
  {
    id: "lead-102",
    title: "Emergency Plumbing Repair & Bathroom Pipe Leak",
    city: "addis_ababa",
    category: "repair",
    budget: 2000,
    date_needed: "2026-08-10",
    poster_name: "Abebe K."
  },
  {
    id: "lead-103",
    title: "Event Tent & Chair Setup for Family Celebration",
    city: "addis_ababa",
    category: "event",
    budget: 3500,
    date_needed: "2026-08-15",
    poster_name: "Mekdes T."
  }
];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isTaskerMode, isClientMode, toggleMode } = useAppMode();
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredTaskers, setFeaturedTaskers] = useState(DEMO_TASKERS);
  const [openLeads, setOpenLeads] = useState(SAMPLE_LEAD_REQUESTS);
  const [isLoadingTaskers, setIsLoadingTaskers] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoadingTaskers(true);
      try {
        const users = await api.entities.User.filter({ is_tasker: true }, "", 10);
        if (users && users.length >= 2) {
          setFeaturedTaskers(users.slice(0, 4));
        }
        const tasks = await api.entities.Task.filter({ status: "open" }, "-created_date", 5);
        if (tasks && tasks.length > 0) {
          setOpenLeads(tasks.slice(0, 3));
        }
      } catch (err) {
        console.log("Using fallback demo taskers & leads:", err);
      } finally {
        setIsLoadingTaskers(false);
      }
    }
    loadData();
  }, []);

  const quickCategories = [
    { id: "cleaning", name: "Cleaning", icon: "✨" },
    { id: "repair",   name: "Repairs",  icon: "🔧" },
    { id: "delivery", name: "Delivery", icon: "📦" },
    { id: "market",   name: "Shopping", icon: "🛒" },
    { id: "event",    name: "Events",   icon: "🎉" },
    { id: "farming",  name: "Farming",  icon: "🌱" },
  ];

  const categoryKeywordMap = {
    cleaning: ["clean", "cleaning", "maid", "home cleaning", "deep clean"],
    repair: ["repair", "fix", "plumbing", "electric", "carpentry", "maintenance"],
    delivery: ["delivery", "deliver", "courier", "pickup", "drop off", "transport"],
    market: ["market", "shopping", "buy", "grocery", "supplies"],
    event: ["event", "setup", "decorate", "dj", "photo", "videography"],
    farming: ["farm", "farming", "harvest", "planting", "irrigation"],
    errand: ["errand", "assistant", "personal help", "queue", "paperwork"],
  };

  const inferCategoryFromQuery = (query) => {
    const q = query.toLowerCase();
    for (const [category, keywords] of Object.entries(categoryKeywordMap)) {
      if (keywords.some((k) => q.includes(k))) {
        return category;
      }
    }
    return null;
  };

  const goToBrowseWithQuery = (query) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      navigate(createPageUrl("BrowseTaskers"));
      return;
    }

    const params = new URLSearchParams();
    params.set("search", trimmedQuery);

    const inferredCategory = inferCategoryFromQuery(trimmedQuery);
    if (inferredCategory) {
      params.set("category", inferredCategory);
    }

    navigate(`${createPageUrl("BrowseTaskers")}?${params.toString()}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    goToBrowseWithQuery(searchQuery);
  };

  // =========================================================================
  // TASKER PRO MODE: WORKER BUSINESS DASHBOARD & THUMBTACK LEAD FEED
  // =========================================================================
  if (isTaskerMode) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
        {/* Pro Worker Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-teal-900 border-b border-indigo-800/60 py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 text-xs font-bold uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  Verified Tasker Pro Dashboard
                </span>
                <h1 className="text-3xl sm:text-4xl font-black text-white">
                  Welcome back, {user?.full_name?.split(" ")[0] || "Tasker"}
                </h1>
                <p className="text-indigo-200 text-sm mt-1">
                  Manage your work schedule, earnings, and respond to incoming client project leads
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to={createPageUrl("BrowseTasks")}
                  className="px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-lg transition-all flex items-center gap-2"
                >
                  <Zap className="w-4 h-4 text-yellow-300" />
                  <span>Browse Live Leads ({openLeads.length})</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Financial KPI & Performance Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/90 border border-indigo-900/80 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Net Earnings (This Month)</span>
                <DollarSign className="w-5 h-5 text-teal-400" />
              </div>
              <p className="text-3xl font-extrabold text-white">14,250 <span className="text-sm font-semibold text-teal-400">ETB</span></p>
              <p className="text-xs text-indigo-300 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
                <span>+18% from previous month</span>
              </p>
            </div>

            <div className="bg-slate-900/90 border border-indigo-900/80 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed Tasks</span>
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-3xl font-extrabold text-white">28 <span className="text-sm font-semibold text-slate-400">jobs</span></p>
              <p className="text-xs text-indigo-300 mt-1">
                98% completion rate
              </p>
            </div>

            <div className="bg-slate-900/90 border border-indigo-900/80 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Client Rating</span>
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              </div>
              <p className="text-3xl font-extrabold text-white">4.9 <span className="text-sm font-semibold text-slate-400">★</span></p>
              <p className="text-xs text-indigo-300 mt-1">
                Based on 42 verified reviews
              </p>
            </div>
          </div>

          {/* Main Worker Content: Today's Schedule & Thumbtack-Style Lead Match Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            {/* Left 2 Cols: Schedule & Thumbtack Lead Feed */}
            <div className="lg:col-span-2 space-y-6">
              {/* Today's Schedule */}
              <div className="bg-slate-900 border border-indigo-900/70 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-teal-400" />
                    <span>Today's Scheduled Jobs</span>
                  </h2>
                  <Link to={createPageUrl("MyBookings")} className="text-xs font-bold text-teal-400 hover:underline">
                    View all bookings →
                  </Link>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-indigo-900/50 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-sm shrink-0">
                        09:00
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Furniture Repair & Carpentry</p>
                        <p className="text-xs text-slate-400">Client: Dawit Abebe • Bole, Addis Ababa</p>
                      </div>
                    </div>
                    <Link
                      to={createPageUrl("MyBookings")}
                      className="px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-bold transition-colors shrink-0"
                    >
                      Manage Job
                    </Link>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/80 border border-indigo-900/50 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-sm shrink-0">
                        14:00
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Deep House Cleaning (3 Rooms)</p>
                        <p className="text-xs text-slate-400">Client: Tigist Tadesse • Kazanchis</p>
                      </div>
                    </div>
                    <Link
                      to={createPageUrl("MyBookings")}
                      className="px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-bold transition-colors shrink-0"
                    >
                      Manage Job
                    </Link>
                  </div>
                </div>
              </div>

              {/* Thumbtack-Style Lead Match Feed (Open Client Project Requests) */}
              <div className="bg-slate-900 border border-indigo-900/70 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Thumbtack Pro Match</span>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-300" />
                      <span>New Client Project Requests Near You</span>
                    </h2>
                  </div>
                  <Link to={createPageUrl("BrowseTasks")} className="text-xs font-bold text-teal-400 hover:underline">
                    View all leads →
                  </Link>
                </div>

                <div className="space-y-3">
                  {openLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="p-4 rounded-xl bg-slate-950 border border-indigo-900/50 hover:border-teal-500/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase">
                            {lead.category || "Project"}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            {lead.city?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Addis Ababa"}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white">{lead.title}</h3>
                        <p className="text-xs text-slate-400 mt-1">
                          Budget: <strong className="text-teal-400 font-extrabold">{lead.budget || 1500} ETB</strong> • Needed: {lead.date_needed || "Flexible"}
                        </p>
                      </div>

                      <Link
                        to={`${createPageUrl("TaskDetail")}?id=${lead.id}`}
                        className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold text-center shrink-0 shadow-sm transition-colors"
                      >
                        Submit Quote / Bid
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Business Settings & Quick Action Center */}
            <div className="bg-slate-900 border border-indigo-900/70 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold text-white mb-4">Business Tools</h2>
                <div className="space-y-2.5">
                  <Link
                    to={createPageUrl("BrowseTasks")}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-indigo-900/50 text-sm font-semibold text-slate-200 transition-colors"
                  >
                    <span>Browse Open Job Leads</span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </Link>
                  <Link
                    to={createPageUrl("Profile")}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-indigo-900/50 text-sm font-semibold text-slate-200 transition-colors"
                  >
                    <span>Edit Skills & Hourly Rates</span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </Link>
                  <Link
                    to={createPageUrl("Profile")}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-indigo-900/50 text-sm font-semibold text-slate-200 transition-colors"
                  >
                    <span>Geofenced Operating Radius</span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </Link>
                </div>
              </div>

              <div className="pt-6 border-t border-indigo-900/50 mt-6">
                <button
                  onClick={() => toggleMode('client')}
                  className="w-full py-3 rounded-xl border border-indigo-600/80 hover:bg-indigo-900/40 text-indigo-300 font-bold text-xs transition-colors"
                >
                  Switch back to Client Marketplace
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // CLIENT MODE: TASKRABBIT + THUMBTACK ALL-IN-ONE MARKETPLACE
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* High-Impact "What's on your to-do list?" Hero Section (Thumbtack Inspired) */}
      <section className="relative text-white overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-slate-900/50 z-10" />
        <div
          className="h-[530px] sm:h-[550px] bg-center bg-cover scale-105 transition-transform duration-1000"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        />
        <div className="absolute inset-0 flex items-center z-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-400/30">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Vetted Local Professionals in Ethiopia
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4 leading-tight tracking-tight text-white drop-shadow-md">
                What's on your home to-do list?
              </h1>
              <p className="text-lg sm:text-xl text-slate-200 mb-8 leading-relaxed max-w-2xl mx-auto drop-shadow">
                Book vetted Taskers instantly at fixed hourly rates, or request free quotes for custom home improvement projects.
              </p>

              {/* Thumbtack + TaskRabbit Search Bar */}
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto mb-5 bg-white/10 p-2 rounded-2xl backdrop-blur-md border border-white/20 shadow-2xl">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder="Search any project... (e.g. House cleaning, electrical)"
                    className="pl-12 h-14 text-base bg-white border-0 rounded-xl shadow-inner text-slate-900 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-emerald-600"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-14 px-8 font-bold rounded-xl shadow-lg transition-all text-base shrink-0"
                >
                  Find Pros & Taskers
                </Button>
              </form>

              {/* Tappable Category Icon Chips */}
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
                <span className="text-xs font-bold text-slate-300 mr-1">Popular:</span>
                {quickCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => goToBrowseWithQuery(cat.name)}
                    className="px-3.5 py-1.5 bg-white/15 hover:bg-white hover:text-slate-900 text-white text-xs font-bold rounded-full border border-white/20 transition-all duration-200 backdrop-blur-sm flex items-center gap-1.5 shadow-sm"
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TaskRabbit & Thumbtack Trust Bar */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Vetted & Background Checked</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Identity verified & reviewed by Ethiopian homeowners</p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Upfront Hourly Rates or Quotes</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">See prices before you hire—no hidden fees</p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Escrow Payment Protection</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Funds held securely until your job is completed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* THUMBTACK + TASKRABBIT PROJECTS: Upfront Prices & Choice of Instant Book vs Get Quotes */}
      <section className="py-12 md:py-16 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-3 py-1 rounded-full mb-2 inline-block">
                Project Categories
              </span>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                Explore Home Services & Pricing
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-base">
                Hire a Tasker immediately at fixed hourly rates, or request free quotes for larger projects
              </p>
            </div>
            <Link
              to={createPageUrl("BrowseTaskers")}
              className="inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold hover:text-emerald-800 text-sm group"
            >
              <span>View all categories</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {taskCategories.map((category) => {
              const Icon = category.icon;
              const imgSrc = getCategoryPhoto(category.id);
              const priceLabel = CATEGORY_PRICING[category.id] || "From 350 ETB/hr";
              const displayName = i18n.language === 'am' ? category.nameAm : category.nameEn;

              return (
                <div
                  key={category.id}
                  className="group flex flex-col h-full"
                >
                  <Card className="hover:shadow-xl transition-all duration-300 border border-slate-200/80 dark:border-slate-800 overflow-hidden h-full flex flex-col bg-white dark:bg-slate-900 rounded-2xl group-hover:border-emerald-500">
                    <div className="relative h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <img
                        src={imgSrc}
                        alt={displayName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-black text-slate-900 dark:text-white shadow-md border border-slate-200 dark:border-slate-700">
                        {priceLabel}
                      </div>
                    </div>
                    <CardContent className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex p-2 rounded-xl ${category.color}`}>
                            <Icon className="w-4 h-4" />
                          </span>
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                            {displayName}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                          Verified local pros for {displayName.toLowerCase()} projects across Addis Ababa.
                        </p>
                      </div>

                      {/* Dual Action Bottom Bar: Instant Book (TaskRabbit) or Get Quotes (Thumbtack) */}
                      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <Link
                          to={`${createPageUrl("BrowseTaskers")}?service=${category.id}`}
                          className="py-2 text-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-colors"
                        >
                          Instant Book
                        </Link>
                        <Link
                          to={`${createPageUrl("PostTask")}?category=${category.id}`}
                          className="py-2 text-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
                        >
                          Get 3 Quotes
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Dual Marketplace Call to Action (Clients & Taskers) */}
      <section className="py-14 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 mb-2 inline-block">
                For Homeowners & Clients
              </span>
              <h3 className="text-2xl font-black mb-3">
                Need a project completed today?
              </h3>
              <p className="text-sm text-slate-200 mb-6 leading-relaxed">
                Whether you need home cleaning, repair work, or event assistance, hire an experienced Tasker at upfront rates or request quotes in minutes.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to={createPageUrl("BrowseTaskers")}
                  className="px-6 py-3 rounded-xl bg-white text-slate-900 font-bold text-sm hover:bg-slate-100 transition-colors shadow"
                >
                  Instant Book Taskers
                </Link>
                <Link
                  to={createPageUrl("PostTask")}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm border border-emerald-500 shadow-md transition-colors"
                >
                  Request 3 Free Quotes
                </Link>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-300 mb-2 inline-block">
                For Workers & Professionals
              </span>
              <h3 className="text-2xl font-black mb-3">
                Earn money on your own schedule
              </h3>
              <p className="text-sm text-slate-200 mb-6 leading-relaxed">
                Join our marketplace as a Tasker. Set your hourly rates, choose the jobs you want, and grow your local business.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => toggleMode('tasker')}
                  className="px-6 py-3 rounded-xl bg-white text-indigo-900 font-bold text-sm hover:bg-slate-100 transition-colors shadow"
                >
                  Switch to Pro Dashboard
                </button>
                <Link
                  to="/signup"
                  className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm border border-teal-500 transition-colors"
                >
                  Become a Tasker Pro
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
