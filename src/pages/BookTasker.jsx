import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/api/firebaseClient";
import { createPageUrl, getFallbackTaskerPhoto } from "@/utils";
import { useAuth } from "@/lib/AuthContext";
import { taskCategories } from "@/components/shared/CategoryBadge";
import { MapPin, ChevronLeft, CheckCircle, Calendar, Clock, DollarSign, FileText, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const CITIES = [
  { value: "addis_ababa", label: "Addis Ababa" },
  { value: "dire_dawa", label: "Dire Dawa" },
  { value: "hawassa", label: "Hawassa" },
  { value: "bahir_dar", label: "Bahir Dar" },
  { value: "adama", label: "Adama" },
  { value: "mekelle", label: "Mekelle" },
  { value: "jimma", label: "Jimma" },
];

const TIME_OPTIONS = [
  { value: "morning", label: "Morning (7am – 12pm)" },
  { value: "afternoon", label: "Afternoon (12pm – 5pm)" },
  { value: "evening", label: "Evening (5pm – 9pm)" },
  { value: "flexible", label: "Flexible – Any time" },
];

export default function BookTasker() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user: authUser } = useAuth();
  const uid = searchParams.get("uid");

  const [tasker, setTasker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    service_type: "",
    description: "",
    location: "",
    city: "addis_ababa",
    scheduled_date: "",
    scheduled_time: "flexible",
    estimated_hours: 2,
  });

  useEffect(() => {
    if (uid) loadTasker();
  }, [uid]);

  const loadTasker = async () => {
    setLoading(true);
    try {
      const t = await api.entities.User.get(uid);
      setTasker(t);
      if (t?.skills?.length > 0) {
        setForm(prev => ({ ...prev, service_type: t.skills[0] }));
      }
    } catch (err) {
      console.warn("Error loading tasker:", err.message);
    }
    setLoading(false);
  };

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const totalPrice = tasker?.hourly_rate
    ? Math.round(tasker.hourly_rate * form.estimated_hours)
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!authUser || !tasker) return;
    setSubmitting(true);

    try {
      const user = await api.auth.me().catch(() => authUser);
      const resolvedTaskerEmail = tasker.email || tasker.contact_email || tasker.email_address || tasker.uid || "";
      const resolvedTaskerName = tasker.full_name || resolvedTaskerEmail || tasker.uid || "";

      const bookingData = {
        client_email: user.email,
        client_name: user.full_name || user.email,
        tasker_email: resolvedTaskerEmail,
        tasker_name: resolvedTaskerName,
        tasker_uid: uid,
        service_type: form.service_type,
        description: form.description.trim(),
        location: form.location.trim(),
        city: form.city,
        scheduled_date: form.scheduled_date,
        scheduled_time: form.scheduled_time,
        estimated_hours: Number(form.estimated_hours),
        hourly_rate: tasker.hourly_rate || 0,
        total_price: totalPrice || 0,
        status: "pending_review",
      };

      const ref = await api.entities.Booking.create(bookingData);

      // Notify tasker
      await api.entities.Notification.create({
        recipient_email: resolvedTaskerEmail,
        type: "booking_request",
        title: "New Booking Request",
        message: `${bookingData.client_name} wants to book you for ${taskCategories.find(c => c.id === form.service_type)?.nameEn || form.service_type} on ${form.scheduled_date}`,
        booking_id: ref.id,
        actor_name: bookingData.client_name,
        actor_email: user.email,
        read: false,
      });

      setSuccess(true);
    } catch (err) {
      console.error("Error creating booking:", err);
      alert("Failed to submit booking. Please try again.");
    }
    setSubmitting(false);
  };

  if (!authUser) {
    navigate("/login");
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-2xl" />)}
      </div>
    );
  }

  if (!tasker) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-gray-500 mb-4">Tasker not found.</p>
        <button onClick={() => navigate("/")} className="text-green-700 font-semibold">Browse Taskers</button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-10">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Booking Sent!</h2>
          <p className="text-gray-500 mb-2">
            Your request has been sent to <strong>{tasker.full_name}</strong>.
          </p>
          <p className="text-gray-400 text-sm mb-8">
            They'll review and accept or suggest changes. You'll be notified once they respond.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate(createPageUrl("MyBookings"))}
              className="w-full py-3.5 rounded-2xl bg-green-700 text-white font-bold hover:bg-green-800 transition-colors"
            >
              View My Bookings
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full py-3.5 rounded-2xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Browse More Taskers
            </button>
          </div>
        </div>
      </div>
    );
  }

  // initials are now handled by AvatarFallback via `name` prop
  const availableServices = (tasker.skills || []).map(id => taskCategories.find(c => c.id === id)).filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 to-green-600 text-white py-8">
        <div className="max-w-lg mx-auto px-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-green-100 hover:text-white transition-colors mb-5 text-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-2xl font-extrabold">Book a Tasker</h1>
          <p className="text-green-100 text-sm mt-1">Fill in the details and send your request</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 space-y-4">
        {/* Tasker mini-card */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
            <img src={tasker.photo_url || getFallbackTaskerPhoto(tasker.id)} alt="tasker" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 truncate">{tasker.full_name}</p>
            <p className="text-sm text-gray-500">
              {tasker.hourly_rate ? `${tasker.hourly_rate} ETB/hr` : "Rate negotiable"}
            </p>
          </div>
          <button
            onClick={() => navigate(createPageUrl(`TaskerProfile?uid=${uid}`))}
            className="text-xs text-green-700 font-semibold flex-shrink-0 hover:underline"
          >
            View Profile
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Service */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-green-700" />
              <h2 className="font-bold text-gray-900">Service Details</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Service Type *</label>
                {availableServices.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableServices.map(cat => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => set("service_type", cat.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${
                            form.service_type === cat.id
                              ? "bg-green-700 text-white border-green-700"
                              : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" /> {cat.nameEn}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <select
                    required
                    value={form.service_type}
                    onChange={e => set("service_type", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-700 bg-white"
                  >
                    <option value="">Select a service</option>
                    {taskCategories.map(c => <option key={c.id} value={c.id}>{c.nameEn}</option>)}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Describe what you need *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Be specific — what needs to be done, any special requirements, materials needed, etc."
                  value={form.description}
                  onChange={e => set("description", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-700 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-green-700" />
              <h2 className="font-bold text-gray-900">Schedule</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Preferred Date *</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  value={form.scheduled_date}
                  onChange={e => set("scheduled_date", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-700"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Time of Day</label>
                <div className="grid grid-cols-2 gap-2">
                  {TIME_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set("scheduled_time", opt.value)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all text-left ${
                        form.scheduled_time === opt.value
                          ? "bg-green-700 text-white border-green-700"
                          : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Estimated Hours: <span className="text-green-700">{form.estimated_hours}h</span>
                </label>
                <input
                  type="range"
                  min={1} max={8} step={0.5}
                  value={form.estimated_hours}
                  onChange={e => set("estimated_hours", parseFloat(e.target.value))}
                  className="w-full accent-green-700"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1h</span><span>4h</span><span>8h</span>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-green-700" />
              <h2 className="font-bold text-gray-900">Location</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Address / Area *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bole, near the roundabout"
                  value={form.location}
                  onChange={e => set("location", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-700"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">City</label>
                <select
                  value={form.city}
                  onChange={e => set("city", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-700 bg-white"
                >
                  {CITIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Price & Escrow Pre-Authorization Summary (TaskRabbit / Thumbtack Style) */}
          <div className="bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                <h2 className="font-extrabold text-slate-900 dark:text-white text-base">Escrow Price Protection</h2>
              </div>
              <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300">
                Fixed Rate
              </span>
            </div>
            <div className="space-y-2 text-sm border-t border-emerald-200/60 dark:border-emerald-800/60 pt-3">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Tasker Hourly Rate</span>
                <span className="font-bold text-slate-900 dark:text-white">{tasker.hourly_rate || 400} ETB/hr</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Estimated Duration</span>
                <span className="font-bold text-slate-900 dark:text-white">{form.estimated_hours} hrs</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-2 border-t border-emerald-200/40">
                <span>Estimated Total (Held in Escrow)</span>
                <span className="text-emerald-700 dark:text-emerald-400">
                  {totalPrice || ((tasker.hourly_rate || 400) * form.estimated_hours)} ETB
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2 mt-3 p-3 rounded-xl bg-white/70 dark:bg-slate-900/60 text-xs text-slate-600 dark:text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>100% Escrow Protection:</strong> Your card is pre-authorized for the estimate. You are only charged after the task is completed and you sign off.
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !form.service_type || !form.description.trim() || !form.scheduled_date || !form.location.trim()}
            className="w-full py-4 rounded-2xl bg-green-700 text-white font-extrabold text-base hover:bg-green-800 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Sending Request…" : `Send Booking Request to ${tasker.full_name?.split(" ")[0] || "Tasker"}`}
          </button>
        </form>
      </div>
    </div>
  );
}
