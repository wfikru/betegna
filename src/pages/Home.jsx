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
  TrendingUp, Calendar, AlertCircle, ChevronRight
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

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isTaskerMode, isClientMode, themeTokens, toggleMode } = useAppMode();
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredTaskers, setFeaturedTaskers] = useState(DEMO_TASKERS);
  const [isLoadingTaskers, setIsLoadingTaskers] = useState(false);

  useEffect(() => {
    async function loadTaskers() {
      setIsLoadingTaskers(true);
      try {
        const users = await api.entities.User.filter({ is_tasker: true }, "", 10);
        if (users && users.length >= 2) {
          setFeaturedTaskers(users.slice(0, 4));
        }
      } catch (err) {
        console.log("Using fallback demo taskers:", err);
      } finally {
        setIsLoadingTaskers(false);
      }
    }
    loadTaskers();
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
  // TASKER MODE: WORKER BUSINESS DASHBOARD (Indigo / Teal Theme)
  // =========================================================================
  if (isTaskerMode) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
        {/* Worker Dashboard Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-teal-900 border-b border-indigo-800/60 py-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 text-xs font-bold uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  Verified Business Dashboard
                </span>
                <h1 className="text-3xl sm:text-4xl font-black text-white">
                  Welcome back, {user?.full_name?.split(" ")[0] || "Tasker"}
                </h1>
                <p className="text-indigo-200 text-sm mt-1">
                  Manage your schedule, earnings, and incoming job requests
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to={createPageUrl("BrowseTasks")}
                  className="px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-lg transition-all flex items-center gap-2"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Find New Jobs</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Financial & Job Performance Summary KPI Cards */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-6">
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

          {/* Today's Schedule & Quick Action Center */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <div className="lg:col-span-2 bg-slate-900 border border-indigo-900/70 rounded-2xl p-6 shadow-xl">
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
                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-sm">
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
                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-sm">
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

            {/* Quick Actions Center */}
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
  // CLIENT MODE: E-COMMERCE SERVICES MARKETPLACE (Slate & Emerald Theme)
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* High-Impact Hero Section */}
      <section className="relative text-white overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-slate-900/50 z-10" />
        <div
          className="h-[520px] sm:h-[540px] bg-center bg-cover scale-105 transition-transform duration-1000"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        />
        <div className="absolute inset-0 flex items-center z-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-400/30">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Vetted Local Professionals in Ethiopia
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4 leading-tight tracking-tight text-white drop-shadow-md">
                Everyday tasks, done by trusted local Taskers
              </h1>
              <p className="text-lg sm:text-xl text-slate-200 mb-8 leading-relaxed max-w-2xl mx-auto drop-shadow">
                Book experienced professionals for home cleaning, furniture repairs, delivery, errands, and more—with upfront pricing.
              </p>

              {/* Persistent Top Search Bar */}
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto mb-5 bg-white/10 p-2 rounded-2xl backdrop-blur-md border border-white/20">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder="What do you need help with? (e.g. House cleaning)"
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
                  Find Taskers
                </Button>
              </form>

              {/* Tappable Category Icon Chips to Eliminate Typing Friction */}
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
                <span className="text-xs font-bold text-slate-300 mr-1">Top categories:</span>
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

      {/* TaskRabbit Trust Bar */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Vetted Local Taskers</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Identity verified & customer reviewed</p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Transparent Pricing</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Upfront hourly rates with no hidden fees</p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Fast & Flexible</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Book for today or schedule in advance</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories Grid (TaskRabbit Visual Cards) */}
      <section className="py-12 md:py-16 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                Explore Popular Projects
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-base">
                Select a category to view qualified local Taskers and hourly rates
              </p>
            </div>
            <Link
              to={createPageUrl("BrowseTaskers")}
              className="inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold hover:text-emerald-800 text-sm group"
            >
              <span>View all services</span>
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
                <Link
                  key={category.id}
                  to={`${createPageUrl("BrowseTaskers")}?service=${category.id}`}
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
                      <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-slate-900 dark:text-white shadow-sm">
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
                          Verified local help for {displayName.toLowerCase()} jobs in Addis Ababa and major cities.
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        <span>Book a Tasker</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* PROVIDER CARD UI: Featured Top-Rated Taskers (Vertical Data Callouts) */}
      <section className="py-12 md:py-16 bg-slate-50 dark:bg-slate-950 border-t border-b border-slate-200/60 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-3 py-1 rounded-full mb-2 inline-block">
                Trusted Professionals
              </span>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                Featured Elite Taskers
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-base">
                Background-checked local Taskers ready to get your jobs done today
              </p>
            </div>
            <Link
              to={createPageUrl("BrowseTaskers")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span>See all Taskers</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredTaskers.map((tasker) => {
              const photo = tasker.photo_url || getFallbackTaskerPhoto(tasker.id);
              const skills = (tasker.skills || []).slice(0, 3);
              const cityLabel = tasker.city ? tasker.city.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : "Addis Ababa";

              return (
                <div
                  key={tasker.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    {/* Vertical Provider Headshot & Callout Banner */}
                    <div className="relative h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <img
                        src={photo}
                        alt={tasker.full_name || "Tasker"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      {tasker.is_verified && (
                        <div className="absolute top-3 left-3 bg-emerald-700/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </div>
                      )}
                      {/* Bold Hourly Rate Callout */}
                      <div className="absolute bottom-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-3.5 py-1 rounded-full text-xs font-black text-slate-900 dark:text-white shadow-md border border-slate-200 dark:border-slate-700">
                        {tasker.hourly_rate || 400} ETB/hr
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                          {tasker.full_name || "Skilled Tasker"}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {(tasker.avg_rating || 4.9).toFixed(1)}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            ({tasker.rating_count || 30} reviews)
                          </span>
                        </div>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{cityLabel}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                        {tasker.bio || "Experienced local professional dedicated to reliable, high-quality work."}
                      </p>

                      <div className="flex flex-wrap gap-1 mb-2">
                        {skills.map((skillId) => {
                          const cat = taskCategories.find((c) => c.id === skillId);
                          if (!cat) return null;
                          return (
                            <span
                              key={skillId}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold ${cat.color}`}
                            >
                              {cat.nameEn}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0 flex gap-2">
                    <Link
                      to={`${createPageUrl("TaskerProfile")}?id=${tasker.id}`}
                      className="w-full text-center py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm"
                    >
                      Book {tasker.full_name ? tasker.full_name.split(' ')[0] : "Tasker"}
                    </Link>
                  </div>
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
                For Clients
              </span>
              <h3 className="text-2xl font-black mb-3">
                Need a task done today?
              </h3>
              <p className="text-sm text-slate-200 mb-6 leading-relaxed">
                Whether you need home cleaning, repair work, or event assistance, hire an experienced Tasker in minutes.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to={createPageUrl("BrowseTaskers")}
                  className="px-6 py-3 rounded-xl bg-white text-slate-900 font-bold text-sm hover:bg-slate-100 transition-colors shadow"
                >
                  Hire a Tasker
                </Link>
                <Link
                  to={createPageUrl("PostTask")}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm border border-emerald-500 shadow-md transition-colors"
                >
                  Post an Open Task
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
                  Switch to Tasker Dashboard
                </button>
                <Link
                  to="/signup"
                  className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm border border-teal-500 transition-colors"
                >
                  Become a Tasker
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
