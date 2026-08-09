import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/api/firebaseClient";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/AuthContext";
import { taskCategories } from "@/components/shared/CategoryBadge";
import StarRating from "@/components/shared/StarRating";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search, MapPin, ArrowRight, PlusCircle, Star, CheckCircle,
  MessageCircle, Briefcase, ChevronDown
} from "lucide-react";

const CITIES = [
  { value: "all", label: "All Cities" },
  { value: "addis_ababa", label: "Addis Ababa" },
  { value: "dire_dawa", label: "Dire Dawa" },
  { value: "hawassa", label: "Hawassa" },
  { value: "bahir_dar", label: "Bahir Dar" },
  { value: "adama", label: "Adama" },
  { value: "mekelle", label: "Mekelle" },
  { value: "jimma", label: "Jimma" },
];

function TaskerCard({ tasker, onBook, onView }) {
  // initials handled by AvatarFallback
  const skills = (tasker.skills || []).slice(0, 3);
  const cityLabel = CITIES.find(c => c.value === tasker.city)?.label || tasker.city || "";

  const photo = tasker.photo_url || `https://source.unsplash.com/collection/888146/400x300?sig=${tasker.id || Math.random()}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
      <div className="h-40 bg-cover bg-center" style={{ backgroundImage: `url(${photo})` }} />
      <div className="p-5">
        <div className="flex items-start gap-4 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-base leading-tight truncate">
              {tasker.full_name || "Tasker"}
            </h3>
            {cityLabel && (
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-500 truncate">{cityLabel}</span>
              </div>
            )}
            {tasker.rating_count > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-semibold text-gray-700">{tasker.avg_rating?.toFixed(1)}</span>
                <span className="text-xs text-gray-400">({tasker.rating_count})</span>
              </div>
            )}
          </div>
          {tasker.hourly_rate && (
            <div className="text-right flex-shrink-0">
              <p className="text-lg font-bold text-green-700">{tasker.hourly_rate}</p>
              <p className="text-xs text-gray-400">ETB/hr</p>
            </div>
          )}
        </div>

        {tasker.bio && (
          <p className="text-sm text-gray-600 leading-relaxed mb-3 line-clamp-2">{tasker.bio}</p>
        )}

        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {skills.map(skillId => {
              const cat = taskCategories.find(c => c.id === skillId);
              if (!cat) return null;
              const Icon = cat.icon;
              return (
                <span key={skillId} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cat.color}`}>
                  <Icon className="w-3 h-3" />
                  {cat.nameEn}
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-5 pb-5 flex gap-2">
        <button
          onClick={() => onView(tasker)}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:border-green-200 hover:text-green-700 transition-colors"
        >
          View Profile
        </button>
        <button
          onClick={() => onBook(tasker)}
          className="flex-1 py-2.5 rounded-xl bg-green-700 text-white text-sm font-bold hover:bg-green-800 transition-colors"
        >
          Book Now
        </button>
      </div>
    </div>
  );
}

const HOW_IT_WORKS = [
  { step: "1", icon: Search,      title: "Browse Taskers",  description: "Find skilled professionals in your city by service type" },
  { step: "2", icon: Briefcase,   title: "Book Directly",   description: "Pick a Tasker, fill in the details, and send your request" },
  { step: "3", icon: MessageCircle, title: "Confirm & Chat", description: "Tasker reviews and accepts, then you chat to coordinate" },
  { step: "4", icon: CheckCircle, title: "Job Done",         description: "Tasker shows up, completes the work, you review and close" },
];

function HowItWorks() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-8">
      <h3 className="text-lg font-bold text-gray-900 mb-5 text-center">How Betegna Works</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {HOW_IT_WORKS.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="relative flex flex-col items-center text-center">
              <div className="w-9 h-9 rounded-full bg-green-700 text-white flex items-center justify-center text-sm font-bold mb-2 shadow-sm">
                {item.step}
              </div>
              <Icon className="w-4 h-4 text-green-600 mb-1.5" />
              <p className="text-sm font-bold text-gray-900 mb-1">{item.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
              {i < HOW_IT_WORKS.length - 1 && (
                <ArrowRight className="hidden md:block absolute top-4 -right-2.5 w-4 h-4 text-green-200" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmptyTaskers({ onBecomeTasker, serviceFilter }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-green-700 to-green-600 text-white p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-green-200 mb-3">
          {serviceFilter !== "all"
            ? `No ${taskCategories.find(c => c.id === serviceFilter)?.nameEn} taskers yet`
            : "Be the first"}
        </p>
        <h2 className="text-2xl font-extrabold mb-3">No Taskers listed yet</h2>
        <p className="text-green-100 mb-6 max-w-md mx-auto">
          Be among the first professionals to offer your services and start earning.
        </p>
        <button
          onClick={onBecomeTasker}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-green-700 font-bold hover:bg-green-50 transition-colors shadow-md"
        >
          <Briefcase className="w-5 h-5" /> Become a Tasker
        </button>
      </div>
      <HowItWorks />
    </div>
  );
}

export default function BrowseTaskers() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [taskers, setTaskers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [serviceFilter, setServiceFilter] = useState(searchParams.get("service") || "all");
  const [cityFilter, setCityFilter] = useState("all");

  useEffect(() => {
    loadTaskers();
  }, []);

  const loadTaskers = async () => {
    setLoading(true);
    try {
      const data = await api.entities.User.filter({ is_tasker: true }, "", 100);
      // Load reviews for rating aggregation
      const allReviews = await api.entities.Review.filter({}, "-created_date", 500);
      // Compute avg rating per tasker email
      const ratingMap = {};
      allReviews.forEach(r => {
        if (!ratingMap[r.reviewee_email]) ratingMap[r.reviewee_email] = { sum: 0, count: 0 };
        ratingMap[r.reviewee_email].sum += r.rating;
        ratingMap[r.reviewee_email].count += 1;
      });
      const enriched = data.map(t => ({
        ...t,
        avg_rating: ratingMap[t.email] ? ratingMap[t.email].sum / ratingMap[t.email].count : 0,
        rating_count: ratingMap[t.email]?.count || 0,
      }));
      setTaskers(enriched);
    } catch (err) {
      console.warn("Error loading taskers:", err.message);
    }
    setLoading(false);
  };

  const filtered = taskers.filter(t => {
    if (user && t.id === user.uid) return false; // hide own profile
    const matchSearch = !search ||
      (t.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.bio || "").toLowerCase().includes(search.toLowerCase());
    const matchService = serviceFilter === "all" || (t.skills || []).includes(serviceFilter);
    const matchCity = cityFilter === "all" || t.city === cityFilter;
    return matchSearch && matchService && matchCity;
  });

  const handleBook = (tasker) => {
    if (!user) {
      navigate(`/login?redirect=/BookTasker?uid=${tasker.id}`);
      return;
    }
    navigate(createPageUrl(`BookTasker?uid=${tasker.id}`));
  };

  const handleView = (tasker) => {
    navigate(createPageUrl(`TaskerProfile?uid=${tasker.id}`));
  };

  const handleBecomeTasker = () => {
    if (!user) { navigate("/login"); return; }
    navigate(createPageUrl("Profile"));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-green-700 to-green-600 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2">Find Skilled Taskers Near You</h1>
          <p className="text-green-100 text-lg mb-6">Browse professionals, book directly, get the job done.</p>

          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or skill…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 h-13 py-3.5 rounded-2xl text-gray-900 placeholder-gray-400 bg-white shadow-md border-0 focus:outline-none focus:ring-2 focus:ring-white/50 text-base"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={cityFilter}
                onChange={e => setCityFilter(e.target.value)}
                className="pl-9 pr-8 py-3.5 h-13 rounded-2xl bg-white text-gray-900 border-0 shadow-md focus:outline-none focus:ring-2 focus:ring-white/50 text-sm font-medium appearance-none cursor-pointer"
              >
                {CITIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {!user && (
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={handleBecomeTasker}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-green-700 font-bold text-sm hover:bg-green-50 transition-colors"
              >
                <Briefcase className="w-4 h-4" /> Offer Your Services
              </button>
              <button
                onClick={() => navigate("/login")}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border-2 border-white/40 text-white font-semibold text-sm hover:border-white hover:bg-white/10 transition-colors"
              >
                Sign In <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-5 pb-24 md:pb-8">
        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
          <button
            onClick={() => setServiceFilter("all")}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
              serviceFilter === "all"
                ? "bg-green-700 text-white border-green-700 shadow-sm"
                : "bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:text-green-700"
            }`}
          >
            All Services
          </button>
          {taskCategories.filter(c => c.id !== "other").map(c => {
            const Icon = c.icon;
            return (
              <button
                key={c.id}
                onClick={() => setServiceFilter(c.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                  serviceFilter === c.id
                    ? "bg-green-700 text-white border-green-700 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:text-green-700"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {c.nameEn}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-56 bg-white animate-pulse rounded-2xl shadow-sm" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyTaskers onBecomeTasker={handleBecomeTasker} serviceFilter={serviceFilter} />
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              <span className="font-bold text-gray-900">{filtered.length}</span> tasker{filtered.length !== 1 ? "s" : ""} available
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(tasker => (
                <TaskerCard key={tasker.id} tasker={tasker} onBook={handleBook} onView={handleView} />
              ))}
            </div>
            <HowItWorks />
          </>
        )}
      </div>
    </div>
  );
}
