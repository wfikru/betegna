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
  ShieldCheck, Clock, Award, PlusCircle, MapPin, Sparkles, Wrench
} from "lucide-react";
import { taskCategories } from "@/components/shared/CategoryBadge";
import { useAuth } from "@/lib/AuthContext";

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
    is_verified: true
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
    is_verified: true
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
    is_verified: true
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
    is_verified: true
  }
];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const quickSearches = [
    "House cleaning",
    "Furniture repair",
    "Delivery",
    "Market shopping",
    "Event setup",
    "Farming help",
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

  const handleQuickSearch = (term) => {
    setSearchQuery(term);
    goToBrowseWithQuery(term);
  };

  const howItWorks = [
    { step: "1", icon: Search, title: "Browse or Post", description: "Search by service category or describe what you need done" },
    { step: "2", icon: Briefcase, title: "Compare & Book", description: "Review hourly rates, skills, and verified reviews" },
    { step: "3", icon: MessageCircle, title: "Chat & Coordinate", description: "Connect with your Tasker directly to confirm details" },
    { step: "4", icon: CheckCircle, title: "Job Complete", description: "Work gets done reliably, then you pay and review" },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* TaskRabbit-Style Hero Section */}
      <section className="relative text-white overflow-hidden bg-gray-900">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950/80 via-gray-900/70 to-gray-900/40 z-10" />
        <div
          className="h-[500px] sm:h-[540px] bg-center bg-cover scale-105 transition-transform duration-1000"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        />
        <div className="absolute inset-0 flex items-center z-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-semibold uppercase tracking-wider mb-4 border border-green-400/30">
                <ShieldCheck className="w-4 h-4 text-green-400" />
                Vetted Local Professionals in Ethiopia
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight tracking-tight text-white drop-shadow-md">
                Everyday tasks, done by trusted local Taskers
              </h1>
              <p className="text-lg sm:text-xl text-gray-200 mb-8 leading-relaxed max-w-2xl mx-auto drop-shadow">
                Book experienced professionals for home cleaning, furniture repairs, delivery, errands, and more—with upfront pricing.
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto mb-5 bg-white/10 p-2 rounded-2xl backdrop-blur-md border border-white/20">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="What do you need help with? (e.g. House cleaning)"
                    className="pl-12 h-14 text-base bg-white border-0 rounded-xl shadow-inner text-gray-900 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-green-600"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="bg-green-700 hover:bg-green-800 text-white h-14 px-8 font-bold rounded-xl shadow-lg transition-all text-base shrink-0"
                >
                  Find Taskers
                </Button>
              </form>

              {/* Quick Searches */}
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto mb-6">
                <span className="text-xs font-semibold text-gray-300 mr-1">Popular:</span>
                {quickSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleQuickSearch(term)}
                    className="px-3.5 py-1.5 bg-white/15 hover:bg-white hover:text-gray-900 text-white text-xs font-medium rounded-full border border-white/20 transition-all duration-200 backdrop-blur-sm"
                  >
                    {term}
                  </button>
                ))}
              </div>

              {/* Dual Action CTA Banner */}
              <div className="flex flex-wrap justify-center items-center gap-3 pt-2">
                <Link
                  to={createPageUrl("BrowseTaskers")}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-gray-900 font-bold text-sm shadow hover:bg-gray-100 transition-colors"
                >
                  <Search className="w-4 h-4 text-green-700" />
                  Browse All Taskers
                </Link>
                <Link
                  to={createPageUrl("PostTask")}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-green-600/90 hover:bg-green-600 text-white font-bold text-sm border border-green-500 shadow-md transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  Post a Custom Task
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TaskRabbit Trust Bar */}
      <section className="bg-white border-b border-gray-200/80 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Vetted Local Taskers</h4>
                <p className="text-xs text-gray-500">Identity verified & customer reviewed</p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Transparent Pricing</h4>
                <p className="text-xs text-gray-500">Upfront hourly rates with no hidden fees</p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Fast & Flexible</h4>
                <p className="text-xs text-gray-500">Book for today or schedule in advance</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories Grid (TaskRabbit Visual Cards) */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                Explore Popular Projects
              </h2>
              <p className="text-gray-600 text-base">
                Select a category to view qualified local Taskers and hourly rates
              </p>
            </div>
            <Link
              to={createPageUrl("BrowseTaskers")}
              className="inline-flex items-center gap-2 text-green-700 font-bold hover:text-green-800 text-sm group"
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
                  <Card className="hover:shadow-xl transition-all duration-300 border border-gray-200/80 overflow-hidden h-full flex flex-col bg-white rounded-2xl group-hover:border-green-300">
                    <div className="relative h-44 bg-gray-100 overflow-hidden">
                      <img
                        src={imgSrc}
                        alt={displayName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-gray-900 shadow-sm">
                        {priceLabel}
                      </div>
                    </div>
                    <CardContent className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex p-2 rounded-xl ${category.color}`}>
                            <Icon className="w-4 h-4" />
                          </span>
                          <h3 className="font-bold text-lg text-gray-900 group-hover:text-green-700 transition-colors">
                            {displayName}
                          </h3>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-4">
                          Verified local help for {displayName.toLowerCase()} jobs in Addis Ababa and major cities.
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs font-bold text-green-700">
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

      {/* Featured Top-Rated Taskers (TaskRabbit Signature Feature) */}
      <section className="py-12 md:py-16 bg-gray-50 border-t border-b border-gray-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-green-700 bg-green-100 px-3 py-1 rounded-full mb-2 inline-block">
                Trusted Professionals
              </span>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                Featured Elite Taskers
              </h2>
              <p className="text-gray-600 text-base">
                Background-checked local Taskers ready to get your jobs done today
              </p>
            </div>
            <Link
              to={createPageUrl("BrowseTaskers")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-gray-200 font-bold text-sm text-gray-700 hover:bg-gray-100 transition-colors"
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
                  className="bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    <div className="relative h-48 bg-gray-100 overflow-hidden">
                      <img
                        src={photo}
                        alt={tasker.full_name || "Tasker"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      {tasker.is_verified && (
                        <div className="absolute top-3 left-3 bg-green-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </div>
                      )}
                      <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-extrabold text-gray-900 shadow">
                        {tasker.hourly_rate || 400} ETB/hr
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-gray-900 text-base truncate">
                          {tasker.full_name || "Skilled Tasker"}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-xs font-bold text-gray-800">
                            {(tasker.avg_rating || 4.9).toFixed(1)}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({tasker.rating_count || 30})
                          </span>
                        </div>
                        <span className="text-gray-300">•</span>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span>{cityLabel}</span>
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-4">
                        {tasker.bio || "Experienced local professional dedicated to reliable, high-quality work."}
                      </p>

                      <div className="flex flex-wrap gap-1 mb-2">
                        {skills.map((skillId) => {
                          const cat = taskCategories.find((c) => c.id === skillId);
                          if (!cat) return null;
                          return (
                            <span
                              key={skillId}
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${cat.color}`}
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
                      className="w-full text-center py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-xs font-bold transition-colors shadow-sm"
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

      {/* How Betegna Works Section */}
      <section className="py-14 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
              How Betegna Works
            </h2>
            <p className="text-gray-600 text-base">
              Getting help is fast, safe, and transparent
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 relative">
            {howItWorks.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="relative flex flex-col items-center text-center p-4">
                  <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-700 flex items-center justify-center font-extrabold mb-4 border border-green-200/80 shadow-sm">
                    <Icon className="w-6 h-6 text-green-700" />
                  </div>
                  <div className="inline-flex items-center justify-center px-2.5 py-0.5 bg-green-700 text-white rounded-full text-xs font-bold mb-2">
                    Step {item.step}
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1.5">{item.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed max-w-[200px]">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Dual Marketplace Call to Action (Clients & Taskers) */}
      <section className="py-14 bg-gradient-to-br from-green-800 via-green-700 to-green-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20">
              <span className="text-xs font-bold uppercase tracking-wider text-green-300 mb-2 inline-block">
                For Clients
              </span>
              <h3 className="text-2xl font-bold mb-3">
                Need a task done today?
              </h3>
              <p className="text-sm text-green-100 mb-6 leading-relaxed">
                Whether you need home cleaning, repair work, or event assistance, hire an experienced Tasker in minutes.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to={createPageUrl("BrowseTaskers")}
                  className="px-6 py-3 rounded-xl bg-white text-green-800 font-bold text-sm hover:bg-green-50 transition-colors shadow"
                >
                  Hire a Tasker
                </Link>
                <Link
                  to={createPageUrl("PostTask")}
                  className="px-6 py-3 rounded-xl bg-green-600/80 hover:bg-green-600 text-white font-bold text-sm border border-green-400 transition-colors"
                >
                  Post an Open Task
                </Link>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20">
              <span className="text-xs font-bold uppercase tracking-wider text-green-300 mb-2 inline-block">
                For Workers & Professionals
              </span>
              <h3 className="text-2xl font-bold mb-3">
                Earn money on your own schedule
              </h3>
              <p className="text-sm text-green-100 mb-6 leading-relaxed">
                Join our marketplace as a Tasker. Set your hourly rates, choose the jobs you want, and grow your local business.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to={createPageUrl("BrowseTasks")}
                  className="px-6 py-3 rounded-xl bg-white text-green-800 font-bold text-sm hover:bg-green-50 transition-colors shadow"
                >
                  Browse Open Jobs
                </Link>
                <Link
                  to="/signup"
                  className="px-6 py-3 rounded-xl bg-green-600/80 hover:bg-green-600 text-white font-bold text-sm border border-green-400 transition-colors"
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
