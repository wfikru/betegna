import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Calendar, User, ChevronLeft, Send, CheckCircle, AlertCircle } from "lucide-react";
import CategoryBadge from "@/components/shared/CategoryBadge";
import StarRating from "@/components/shared/StarRating";
import { format } from "date-fns";

const statusConfig = {
  open: { text: "Open", cls: "bg-green-100 text-green-700" },
  assigned: { text: "Assigned", cls: "bg-blue-100 text-blue-700" },
  in_progress: { text: "In Progress", cls: "bg-yellow-100 text-yellow-700" },
  completed: { text: "Completed", cls: "bg-gray-100 text-gray-600" },
  cancelled: { text: "Cancelled", cls: "bg-red-100 text-red-500" },
};

export default function TaskDetail() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const taskId = urlParams.get("id");

  const [task, setTask] = useState(null);
  const [offers, setOffers] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offerForm, setOfferForm] = useState({ price: "", message: "", estimated_hours: "" });
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [myOffer, setMyOffer] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: "" });
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    loadData();
  }, [taskId]);

  const loadData = async () => {
    if (!taskId) return;
    setLoading(true);
    const [tasks, u] = await Promise.all([
      base44.entities.Task.filter({ id: taskId }, "", 1),
      base44.auth.me().catch(() => null),
    ]);
    const t = tasks[0];
    setTask(t);
    setUser(u);

    if (t) {
      const offersData = await base44.entities.TaskOffer.filter({ task_id: taskId }, "-created_date", 20);
      setOffers(offersData);
      if (u) {
        setMyOffer(offersData.find((o) => o.tasker_email === u.email) || null);
      }
    }
    setLoading(false);
  };

  const isOwner = user && task && task.created_by === user.email;
  const canOffer = user && task && task.status === "open" && !isOwner && !myOffer;

  const submitOffer = async (e) => {
    e.preventDefault();
    if (!offerForm.price || !offerForm.message) return;
    setSubmitting(true);
    await base44.entities.TaskOffer.create({
      task_id: taskId,
      task_title: task.title,
      tasker_email: user.email,
      tasker_name: user.full_name || user.email,
      price: Number(offerForm.price),
      message: offerForm.message,
      estimated_hours: offerForm.estimated_hours ? Number(offerForm.estimated_hours) : undefined,
      status: "pending",
    });
    setSubmitting(false);
    setShowOfferForm(false);
    loadData();
  };

  const acceptOffer = async (offer) => {
    await base44.entities.Task.update(taskId, {
      status: "assigned",
      assigned_to: offer.tasker_email,
      assigned_to_name: offer.tasker_name,
    });
    await base44.entities.TaskOffer.update(offer.id, { status: "accepted" });
    // Reject other offers
    for (const o of offers) {
      if (o.id !== offer.id && o.status === "pending") {
        await base44.entities.TaskOffer.update(o.id, { status: "rejected" });
      }
    }
    loadData();
  };

  const markComplete = async () => {
    await base44.entities.Task.update(taskId, { status: "completed" });
    loadData();
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.rating) return;
    setSubmitting(true);
    await base44.entities.Review.create({
      task_id: taskId,
      reviewer_email: user.email,
      reviewer_name: user.full_name || user.email,
      reviewee_email: isOwner ? task.assigned_to : task.created_by,
      rating: reviewForm.rating,
      comment: reviewForm.comment,
    });
    setSubmitting(false);
    setShowReviewForm(false);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="h-8 w-32 bg-gray-100 animate-pulse rounded mb-4" />
        <div className="h-64 bg-gray-100 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-400">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p className="font-medium">Task not found</p>
      </div>
    );
  }

  const s = statusConfig[task.status] || statusConfig.open;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-4">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      {/* Task Header */}
      <Card className="mb-4 border border-gray-100">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h1 className="text-xl font-bold text-gray-900">{task.title}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${s.cls}`}>{s.text}</span>
          </div>
          <CategoryBadge categoryId={task.category} />
          <p className="text-gray-600 text-sm mt-3 leading-relaxed">{task.description}</p>

          <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
            {(task.budget_min || task.budget_max) && (
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-0.5">Budget</p>
                <p className="font-bold text-green-700">
                  ETB {task.budget_min && task.budget_max && task.budget_min !== task.budget_max
                    ? `${task.budget_min}–${task.budget_max}`
                    : task.budget_max || task.budget_min}
                </p>
              </div>
            )}
            {task.date_needed && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-0.5">Date Needed</p>
                <p className="font-medium text-gray-700">{format(new Date(task.date_needed), "MMM d, yyyy")}</p>
              </div>
            )}
            {task.location && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-0.5">Location</p>
                <p className="font-medium text-gray-700 flex items-center gap-1"><MapPin className="w-3 h-3" />{task.location}</p>
              </div>
            )}
            {task.time_preference && task.time_preference !== "flexible" && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-0.5">Time</p>
                <p className="font-medium text-gray-700 capitalize">{task.time_preference}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
            <User className="w-3.5 h-3.5" />
            <span>Posted by {task.poster_name || "Anonymous"}</span>
            <span>·</span>
            <span>{format(new Date(task.created_date), "MMM d, yyyy")}</span>
          </div>
        </CardContent>
      </Card>

      {/* Owner Actions */}
      {isOwner && task.status === "assigned" && (
        <div className="mb-4">
          <Button onClick={markComplete} className="w-full bg-green-700 hover:bg-green-800 text-white">
            <CheckCircle className="w-4 h-4 mr-2" /> Mark as Completed
          </Button>
        </div>
      )}

      {/* Review after completion */}
      {task.status === "completed" && user && (
        <Card className="mb-4 border border-gray-100">
          <CardContent className="p-4">
            {!showReviewForm ? (
              <Button variant="outline" className="w-full" onClick={() => setShowReviewForm(true)}>
                Leave a Review
              </Button>
            ) : (
              <form onSubmit={submitReview} className="space-y-3">
                <p className="font-medium text-sm">Leave a Review</p>
                <StarRating rating={reviewForm.rating} interactive onChange={(r) => setReviewForm((p) => ({ ...p, rating: r }))} size="lg" />
                <Textarea
                  placeholder="Share your experience..."
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm((p) => ({ ...p, comment: e.target.value }))}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting || !reviewForm.rating} className="bg-green-700 hover:bg-green-800 text-white">Submit</Button>
                  <Button type="button" variant="outline" onClick={() => setShowReviewForm(false)}>Cancel</Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Offers Section */}
      <Card className="border border-gray-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Offers ({offers.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {offers.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No offers yet</p>
          )}
          {offers.map((offer) => (
            <div key={offer.id} className="border border-gray-100 rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-800">{offer.tasker_name}</p>
                  <p className="text-green-700 font-bold">ETB {offer.price}</p>
                  {offer.estimated_hours && (
                    <p className="text-xs text-gray-400">{offer.estimated_hours}h estimated</p>
                  )}
                  <p className="text-sm text-gray-600 mt-1">{offer.message}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    offer.status === "accepted" ? "bg-green-100 text-green-700" :
                    offer.status === "rejected" ? "bg-red-100 text-red-500" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>{offer.status}</span>
                  {isOwner && task.status === "open" && offer.status === "pending" && (
                    <Button size="sm" className="bg-green-700 hover:bg-green-800 text-white text-xs" onClick={() => acceptOffer(offer)}>
                      Accept
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Make an offer */}
          {myOffer ? (
            <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
              ✓ You've made an offer of ETB {myOffer.price} — status: <strong>{myOffer.status}</strong>
            </div>
          ) : canOffer ? (
            <>
              {!showOfferForm ? (
                <Button className="w-full bg-green-700 hover:bg-green-800 text-white" onClick={() => setShowOfferForm(true)}>
                  <Send className="w-4 h-4 mr-2" /> Make an Offer
                </Button>
              ) : (
                <form onSubmit={submitOffer} className="space-y-3 pt-2 border-t border-gray-100">
                  <p className="font-medium text-sm">Make an Offer</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="price">Your Price (ETB) *</Label>
                      <Input id="price" type="number" placeholder="300" value={offerForm.price} onChange={(e) => setOfferForm((p) => ({ ...p, price: e.target.value }))} required className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="est_hours">Est. Hours</Label>
                      <Input id="est_hours" type="number" placeholder="2" value={offerForm.estimated_hours} onChange={(e) => setOfferForm((p) => ({ ...p, estimated_hours: e.target.value }))} className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea id="message" placeholder="Describe your experience and why you're the right person..." value={offerForm.message} onChange={(e) => setOfferForm((p) => ({ ...p, message: e.target.value }))} required rows={3} className="mt-1" />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={submitting} className="bg-green-700 hover:bg-green-800 text-white">
                      {submitting ? "Submitting…" : "Submit Offer"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowOfferForm(false)}>Cancel</Button>
                  </div>
                </form>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}