import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/api/firebaseClient";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/AuthContext";
import { taskCategories } from "@/components/shared/CategoryBadge";
import StarRating from "@/components/shared/StarRating";
import { MapPin, Star, Briefcase, ArrowRight, ChevronLeft, Edit } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";

const CITIES = {
  addis_ababa: "Addis Ababa", dire_dawa: "Dire Dawa", hawassa: "Hawassa",
  bahir_dar: "Bahir Dar", adama: "Adama", mekelle: "Mekelle", jimma: "Jimma",
};

export default function TaskerProfile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user: authUser } = useAuth();
  const uid = searchParams.get("uid");

  const [tasker, setTasker] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (uid) loadProfile();
  }, [uid]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const t = await api.entities.User.get(uid);
      if (t) {
        setTasker(t);
        if (t.email) {
          const r = await api.entities.Review.filter({ reviewee_email: t.email }, "-created_date", 20);
          setReviews(r);
        }
      }
    } catch (err) {
      console.warn("Error loading tasker profile:", err.message);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-2xl" />)}
      </div>
    );
  }

  if (!tasker) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500 mb-4">Tasker not found.</p>
        <button onClick={() => navigate("/")} className="text-green-700 font-semibold underline">
          Browse Taskers
        </button>
      </div>
    );
  }

  // initials handled by AvatarFallback via `name` prop
  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const isOwnProfile = authUser && authUser.uid === uid;

  const handleBook = () => {
    if (!authUser) {
      navigate(`/login?redirect=/BookTasker?uid=${uid}`);
      return;
    }
    navigate(createPageUrl(`BookTasker?uid=${uid}`));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28 md:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 to-green-600 text-white pt-6 pb-16">
        <div className="max-w-2xl mx-auto px-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-green-100 hover:text-white transition-colors mb-6 text-sm font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/40 flex items-center justify-center text-white text-2xl font-bold shadow-lg flex-shrink-0">
              <img src={tasker.photo_url || `https://source.unsplash.com/collection/888146/200x200?sig=${tasker.id || 1}`} alt="tasker" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-extrabold leading-tight">{tasker.full_name || "Tasker"}</h1>
              {tasker.city && (
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-green-200" />
                  <span className="text-green-100 text-sm">{CITIES[tasker.city] || tasker.city}</span>
                </div>
              )}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {reviews.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                    <span className="text-white font-bold text-sm">{avgRating.toFixed(1)}</span>
                    <span className="text-green-200 text-xs">({reviews.length} reviews)</span>
                  </div>
                )}
                {tasker.hourly_rate && (
                  <span className="bg-white/20 text-white text-sm font-bold px-3 py-1 rounded-full">
                    {tasker.hourly_rate} ETB/hr
                  </span>
                )}
                <span className="inline-flex items-center gap-1 bg-white/20 text-white text-xs px-2.5 py-1 rounded-full">
                  <Briefcase className="w-3 h-3" /> Tasker
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-8 space-y-4">

        {/* Book CTA card */}
        {!isOwnProfile && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-bold text-gray-900">Ready to book?</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {tasker.hourly_rate ? `Starting at ${tasker.hourly_rate} ETB/hr` : "Request a quote"}
              </p>
            </div>
            <button
              onClick={handleBook}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-green-700 text-white font-bold text-sm hover:bg-green-800 transition-colors shadow-sm flex-shrink-0"
            >
              Book {tasker.full_name?.split(" ")[0] || "Now"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {isOwnProfile && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 flex items-center justify-between gap-4">
            <p className="text-sm text-gray-600">This is your public profile</p>
            <button
              onClick={() => navigate(createPageUrl("Profile"))}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-green-700 text-green-700 font-semibold text-sm hover:bg-green-50 transition-colors"
            >
              <Edit className="w-3.5 h-3.5" /> Edit Profile
            </button>
          </div>
        )}

        {/* Bio */}
        {tasker.bio && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-base font-bold text-gray-900 mb-2">About</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{tasker.bio}</p>
          </div>
        )}

        {/* Skills */}
        {(tasker.skills || []).length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-base font-bold text-gray-900 mb-3">Services Offered</h2>
            <div className="flex flex-wrap gap-2">
              {tasker.skills.map(skillId => {
                const cat = taskCategories.find(c => c.id === skillId);
                if (!cat) return null;
                const Icon = cat.icon;
                return (
                  <span key={skillId} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${cat.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                    {cat.nameEn}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Reviews</h2>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-extrabold text-gray-900">{avgRating.toFixed(1)}</span>
                <div>
                  <StarRating rating={Math.round(avgRating)} size="sm" />
                  <p className="text-xs text-gray-400 mt-0.5">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {reviews.map(r => (
                <div key={r.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{r.reviewer_name || "Anonymous"}</p>
                      <StarRating rating={r.rating} size="sm" />
                    </div>
                    <p className="text-xs text-gray-400 flex-shrink-0">
                      {format(new Date(r.created_date), "MMM d, yyyy")}
                    </p>
                  </div>
                  {r.comment && <p className="text-sm text-gray-600 leading-relaxed mt-1">{r.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {reviews.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
            <Star className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No reviews yet. Be the first to book!</p>
          </div>
        )}

        {/* Bottom book CTA (repeated for easy access) */}
        {!isOwnProfile && (
          <button
            onClick={handleBook}
            className="w-full py-4 rounded-2xl bg-green-700 text-white font-bold text-base hover:bg-green-800 transition-colors shadow-md"
          >
            Book {tasker.full_name?.split(" ")[0] || "this Tasker"} — {tasker.hourly_rate ? `${tasker.hourly_rate} ETB/hr` : "Get a Quote"}
          </button>
        )}
      </div>
    </div>
  );
}
