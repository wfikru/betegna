import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/firebaseClient";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/AuthContext";
import { taskCategories } from "@/components/shared/CategoryBadge";
import { format } from "date-fns";
import { Calendar, MapPin, ChevronRight, Briefcase, Search, Plus } from "lucide-react";

const STATUS_CONFIG = {
  pending_review: { label: "Pending Review", cls: "bg-amber-100 text-amber-800", dot: "bg-amber-400" },
  accepted:       { label: "Accepted",        cls: "bg-emerald-50 text-emerald-800 border border-emerald-200", dot: "bg-emerald-500" },
  in_progress:    { label: "In Progress",     cls: "bg-amber-50 text-amber-800 border border-amber-200", dot: "bg-amber-500" },
  completed:      { label: "Completed",       cls: "bg-green-100 text-green-800", dot: "bg-green-600" },
  declined:       { label: "Declined",        cls: "bg-red-100 text-red-700",     dot: "bg-red-400" },
  cancelled:      { label: "Cancelled",       cls: "bg-gray-100 text-gray-500",   dot: "bg-gray-300" },
};

function BookingCard({ booking, currentUserEmail, onClick }) {
  const isClient = booking.client_email === currentUserEmail;
  const otherName = isClient ? booking.tasker_name : booking.client_name;
  const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending_review;
  const cat = taskCategories.find(c => c.id === booking.service_type);
  const Icon = cat?.icon;

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-green-100 transition-all p-5 text-left group"
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cat?.color || "bg-gray-100 text-gray-600"}`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <p className="font-bold text-gray-900 text-sm leading-tight">{cat?.nameEn || booking.service_type}</p>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${status.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>
          <p className="text-sm text-gray-600 truncate mb-2">{booking.description}</p>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-600">
                {(otherName || "?")[0].toUpperCase()}
              </div>
              {otherName}
            </span>
            {booking.scheduled_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(booking.scheduled_date), "MMM d, yyyy")}
              </span>
            )}
            {booking.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {booking.city.replace("_", " ")}
              </span>
            )}
          </div>
          {booking.total_price > 0 && (
            <p className="text-xs font-semibold text-green-700 mt-1.5">{booking.total_price} ETB estimated</p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-green-600 transition-colors flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}

export default function MyBookings() {
  const navigate = useNavigate();
  const { user: authUser, isLoadingAuth } = useAuth();
  const [user, setUser] = useState(null);
  const [clientBookings, setClientBookings] = useState([]);
  const [taskerBookings, setTaskerBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("client");

  useEffect(() => {
    if (authUser) loadData();
  }, [authUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const u = await api.auth.me().catch(() => authUser);
      setUser(u);
      const [asClient, asTasker] = await Promise.all([
        api.entities.Booking.filter({ client_email: u.email }, "-created_date", 50),
        u.is_tasker
          ? api.entities.Booking.filter({ tasker_email: u.email }, "-created_date", 50)
          : Promise.resolve([]),
      ]);
      setClientBookings(asClient);
      setTaskerBookings(asTasker);
      // Default to tasker tab if they have incoming requests
      if (u.is_tasker && asTasker.length > 0 && asClient.length === 0) {
        setActiveTab("tasker");
      }
    } catch (err) {
      console.warn("Error loading bookings:", err.message);
    }
    setLoading(false);
  };

  if (isLoadingAuth || loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-28 bg-gray-100 animate-pulse rounded-2xl" />)}
      </div>
    );
  }

  if (!authUser) {
    navigate("/login");
    return null;
  }

  const activeBookings = activeTab === "client" ? clientBookings : taskerBookings;
  const pendingCount = taskerBookings.filter(b => b.status === "pending_review").length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 to-green-600 text-white py-10">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl font-extrabold mb-1">My Bookings</h1>
          <p className="text-green-100">Track your scheduled services and jobs</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-4">
        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-1.5 flex mb-4">
          <button
            onClick={() => setActiveTab("client")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === "client"
                ? "bg-green-700 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            My Bookings
            {clientBookings.length > 0 && (
              <span className={`ml-1.5 text-xs ${activeTab === "client" ? "text-green-200" : "text-gray-400"}`}>
                ({clientBookings.length})
              </span>
            )}
          </button>
          {user?.is_tasker && (
            <button
              onClick={() => setActiveTab("tasker")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all relative ${
                activeTab === "tasker"
                  ? "bg-green-700 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 inline mr-1" />
              My Jobs
              {taskerBookings.length > 0 && (
                <span className={`ml-1.5 text-xs ${activeTab === "tasker" ? "text-green-200" : "text-gray-400"}`}>
                  ({taskerBookings.length})
                </span>
              )}
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Booking list */}
        {activeBookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            {activeTab === "client" ? (
              <>
                <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">No bookings yet</h3>
                <p className="text-sm text-gray-500 mb-6">Find a Tasker and book your first service</p>
                <button
                  onClick={() => navigate("/")}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-700 text-white font-bold text-sm hover:bg-green-800 transition-colors"
                >
                  <Search className="w-4 h-4" /> Browse Taskers
                </button>
              </>
            ) : (
              <>
                <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">No job requests yet</h3>
                <p className="text-sm text-gray-500 mb-6">Make sure your profile is complete so clients can find you</p>
                <button
                  onClick={() => navigate(createPageUrl("Profile"))}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-700 text-white font-bold text-sm hover:bg-green-800 transition-colors"
                >
                  Update Profile
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {activeBookings.map(booking => (
              <BookingCard
                key={booking.id}
                booking={booking}
                currentUserEmail={user?.email}
                onClick={() => navigate(createPageUrl(`BookingDetail?id=${booking.id}`))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
