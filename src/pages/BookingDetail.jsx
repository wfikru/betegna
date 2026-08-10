import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/api/firebaseClient";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/AuthContext";
import { taskCategories } from "@/components/shared/CategoryBadge";
import StarRating from "@/components/shared/StarRating";
import { format } from "date-fns";
import {
  ChevronLeft, Calendar, MapPin, Clock, DollarSign, MessageCircle,
  CheckCircle, XCircle, PlayCircle, Star, User, AlertCircle
} from "lucide-react";

const STATUS_STEPS = [
  { key: "pending_review", label: "Request Sent",   desc: "Waiting for tasker to respond" },
  { key: "accepted",       label: "Accepted",        desc: "Tasker confirmed your booking" },
  { key: "in_progress",    label: "In Progress",     desc: "Tasker is working on your task" },
  { key: "completed",      label: "Completed",       desc: "Job done!" },
];

const TIME_LABELS = {
  morning: "Morning (7am–12pm)", afternoon: "Afternoon (12pm–5pm)",
  evening: "Evening (5pm–9pm)", flexible: "Flexible",
};

function StatusTimeline({ status }) {
  const stepIndex = STATUS_STEPS.findIndex(s => s.key === status);
  const isDeclined = status === "declined" || status === "cancelled";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Booking Status</h2>
      {isDeclined ? (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="font-bold text-red-800 text-sm">
              {status === "declined" ? "Request Declined" : "Booking Cancelled"}
            </p>
            <p className="text-xs text-red-600 mt-0.5">This booking is no longer active</p>
          </div>
        </div>
      ) : (
        <div className="space-y-0">
          {STATUS_STEPS.map((step, i) => {
            const done = i < stepIndex;
            const active = i === stepIndex;
            const future = i > stepIndex;
            return (
              <div key={step.key} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    done ? "bg-green-700 text-white" :
                    active ? "bg-green-700 text-white ring-4 ring-green-100" :
                    "bg-gray-100 text-gray-400"
                  }`}>
                    {done ? <CheckCircle className="w-4 h-4" /> : <span>{i + 1}</span>}
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`w-0.5 h-8 my-0.5 ${done ? "bg-green-700" : "bg-gray-100"}`} />
                  )}
                </div>
                <div className={`pt-1.5 pb-3 ${future ? "opacity-40" : ""}`}>
                  <p className={`text-sm font-bold ${active ? "text-green-700" : done ? "text-gray-900" : "text-gray-500"}`}>
                    {step.label}
                  </p>
                  {active && <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function BookingDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user: authUser } = useAuth();
  const id = searchParams.get("id");

  const [booking, setBooking] = useState(null);
  const [user, setUser] = useState(null);
  const [existingReview, setExistingReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeclineReason, setShowDeclineReason] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    if (id && authUser) loadData();
  }, [id, authUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const u = await api.auth.me().catch(() => authUser);
      setUser(u);
      const bookings = await api.entities.Booking.filter({ id }, "", 1);
      if (bookings.length > 0) {
        setBooking(bookings[0]);
        // Check for existing review
        const reviews = await api.entities.Review.filter({ booking_id: id }, "", 1);
        if (reviews.length > 0) setExistingReview(reviews[0]);
      }
    } catch (err) {
      console.warn("Error loading booking:", err.message);
    }
    setLoading(false);
  };

  const updateStatus = async (newStatus, extra = {}) => {
    if (!booking) return;
    setActionLoading(true);
    try {
      await api.entities.Booking.update(booking.id, { status: newStatus, ...extra });
      // Notify the other party
      const notifyEmail = user.email === booking.tasker_email
        ? booking.client_email
        : booking.tasker_email;
      const notifyName = user.email === booking.tasker_email
        ? booking.client_name
        : booking.tasker_name;

      const messages = {
        accepted: { type: "booking_accepted", title: "Booking Accepted!", message: `${booking.tasker_name} accepted your booking for ${format(new Date(booking.scheduled_date), "MMM d")}` },
        declined: { type: "booking_declined", title: "Booking Declined", message: `${booking.tasker_name} couldn't accept your booking. Browse other taskers.` },
        in_progress: { type: "booking_update", title: "Tasker is on the way!", message: `${booking.tasker_name} has started your job` },
        completed: { type: "booking_completed", title: "Job Complete!", message: `${booking.tasker_name} marked your job as complete. Leave a review!` },
      };
      if (messages[newStatus]) {
        await api.entities.Notification.create({
          recipient_email: notifyEmail,
          ...messages[newStatus],
          booking_id: booking.id,
          actor_name: user.full_name || user.email,
          actor_email: user.email,
          read: false,
        });
      }
      setBooking(prev => ({ ...prev, status: newStatus, ...extra }));
    } catch (err) {
      console.error("Error updating booking status:", err);
      alert("Something went wrong. Please try again.");
    }
    setActionLoading(false);
  };

  const submitReview = async () => {
    if (!booking || reviewSubmitting) return;
    setReviewSubmitting(true);
    try {
      await api.entities.Review.create({
        booking_id: booking.id,
        reviewer_email: user.email,
        reviewer_name: user.full_name || user.email,
        reviewee_email: booking.tasker_email,
        reviewee_name: booking.tasker_name,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setExistingReview({ rating: reviewRating, comment: reviewComment });
      setShowReviewForm(false);
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("Failed to submit review.");
    }
    setReviewSubmitting(false);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-2xl" />)}
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">Booking not found.</p>
        <button onClick={() => navigate(createPageUrl("MyBookings"))} className="text-green-700 font-semibold underline">
          Back to My Bookings
        </button>
      </div>
    );
  }

  const isTasker = user?.email === booking.tasker_email;
  const isClient = user?.email === booking.client_email;
  const cat = taskCategories.find(c => c.id === booking.service_type);
  const Icon = cat?.icon;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 to-green-600 text-white py-8">
        <div className="max-w-2xl mx-auto px-4">
          <button
            onClick={() => navigate(createPageUrl("MyBookings"))}
            className="flex items-center gap-1.5 text-green-100 hover:text-white transition-colors mb-5 text-sm"
          >
            <ChevronLeft className="w-4 h-4" /> My Bookings
          </button>
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cat?.color || "bg-white/20 text-white"}`}>
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-extrabold">{cat?.nameEn || booking.service_type}</h1>
              <p className="text-green-100 text-sm mt-0.5">
                {isTasker ? `Requested by ${booking.client_name}` : `Booked with ${booking.tasker_name}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-4 space-y-4">

        {/* Status timeline */}
        <StatusTimeline status={booking.status} />

        {/* Tasker/Client action buttons */}
        {isTasker && booking.status === "pending_review" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <p className="font-bold text-gray-900 text-sm">Respond to this request</p>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {booking.client_name} wants to book you for {cat?.nameEn} on {format(new Date(booking.scheduled_date), "MMMM d, yyyy")}.
            </p>
            {!showDeclineReason ? (
              <div className="flex gap-3">
                <button
                  onClick={() => updateStatus("accepted")}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-700 text-white font-bold text-sm hover:bg-green-800 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" /> Accept
                </button>
                <button
                  onClick={() => setShowDeclineReason(true)}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" /> Decline
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  rows={2}
                  placeholder="Reason for declining (optional)…"
                  value={declineReason}
                  onChange={e => setDeclineReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => updateStatus("declined", { decline_reason: declineReason })}
                    disabled={actionLoading}
                    className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    Confirm Decline
                  </button>
                  <button
                    onClick={() => setShowDeclineReason(false)}
                    className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {isTasker && booking.status === "accepted" && (
          <button
            onClick={() => updateStatus("in_progress")}
            disabled={actionLoading}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-50"
          >
            <PlayCircle className="w-5 h-5" /> Mark as In Progress
          </button>
        )}

        {isTasker && booking.status === "in_progress" && (
          <button
            onClick={() => updateStatus("completed")}
            disabled={actionLoading}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-green-700 text-white font-bold hover:bg-green-800 transition-colors shadow-sm disabled:opacity-50"
          >
            <CheckCircle className="w-5 h-5" /> Mark Job Complete
          </button>
        )}

        {/* Review section */}
        {isClient && booking.status === "completed" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              {existingReview ? "Your Review" : "Leave a Review"}
            </h2>
            {existingReview ? (
              <div>
                <StarRating rating={existingReview.rating} size="sm" />
                {existingReview.comment && (
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{existingReview.comment}</p>
                )}
              </div>
            ) : !showReviewForm ? (
              <button
                onClick={() => setShowReviewForm(true)}
                className="w-full py-3 rounded-xl border border-green-200 text-green-700 font-bold text-sm hover:bg-green-50 transition-colors"
              >
                Rate {booking.tasker_name?.split(" ")[0] || "Tasker"}
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Rating</p>
                  <StarRating rating={reviewRating} interactive onChange={setReviewRating} size="lg" />
                </div>
                <textarea
                  rows={3}
                  placeholder="Share your experience…"
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-700"
                />
                <div className="flex gap-3">
                  <button
                    onClick={submitReview}
                    disabled={reviewSubmitting}
                    className="flex-1 py-3 rounded-xl bg-green-700 text-white font-bold text-sm hover:bg-green-800 transition-colors disabled:opacity-50"
                  >
                    {reviewSubmitting ? "Submitting…" : "Submit Review"}
                  </button>
                  <button
                    onClick={() => setShowReviewForm(false)}
                    className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Booking details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Booking Details</h2>
          <p className="text-sm text-gray-700 leading-relaxed">{booking.description}</p>
          <div className="pt-2 space-y-2">
            {booking.scheduled_date && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>{format(new Date(booking.scheduled_date), "EEEE, MMMM d, yyyy")}</span>
              </div>
            )}
            {booking.scheduled_time && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>{TIME_LABELS[booking.scheduled_time] || booking.scheduled_time}</span>
              </div>
            )}
            {booking.location && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>{booking.location}</span>
              </div>
            )}
            {booking.total_price > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <DollarSign className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>{booking.total_price} ETB estimated ({booking.estimated_hours}h × {booking.hourly_rate} ETB/hr)</span>
              </div>
            )}
          </div>
        </div>

        {/* Other person card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
            {isClient ? "Your Tasker" : "Client"}
          </h2>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-green-700 flex items-center justify-center text-white font-bold">
              {((isClient ? booking.tasker_name : booking.client_name) || "?")[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">
                {isClient ? booking.tasker_name : booking.client_name}
              </p>
              <p className="text-xs text-gray-500">
                {isClient ? booking.tasker_email : booking.client_email}
              </p>
            </div>
            {isClient && booking.tasker_uid && (
              <button
                onClick={() => navigate(createPageUrl(`TaskerProfile?uid=${booking.tasker_uid}`))}
                className="text-xs text-green-700 font-semibold hover:underline flex-shrink-0"
              >
                View Profile
              </button>
            )}
          </div>
        </div>

        {/* Message button */}
        {(booking.status === "accepted" || booking.status === "in_progress" || booking.status === "completed") && (
          <button
            onClick={() => navigate(createPageUrl(`Messages?bookingId=${booking.id}`))}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-green-700 text-green-700 font-bold hover:bg-green-50 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            Message {isClient ? booking.tasker_name?.split(" ")[0] : booking.client_name?.split(" ")[0]}
          </button>
        )}
      </div>
    </div>
  );
}
