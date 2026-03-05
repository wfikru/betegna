import { useState, useEffect } from "react";
import { api, db } from "@/api/firebaseClient";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { writeBatch, doc } from "firebase/firestore";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Clock, Calendar, User, ChevronLeft, Send, CheckCircle, AlertCircle, Trash2, Edit } from "lucide-react";
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

  /** @type {[import("../types/entities").Task|null, Function]} */
  const [task, setTask] = useState(null);
  /** @type {[import("../types/entities").TaskOffer[], Function]} */
  const [offers, setOffers] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offerForm, setOfferForm] = useState({ price: "", message: "", estimated_hours: "" });
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  /** @type {[import("../types/entities").TaskOffer|null, Function]} */
  const [myOffer, setMyOffer] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: "" });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [userProfileReviews, setUserProfileReviews] = useState([]);
  const [loadingUserProfile, setLoadingUserProfile] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [myReview, setMyReview] = useState(null);
  const [editingReview, setEditingReview] = useState(false);

  useEffect(() => {
    loadData();
  }, [taskId]);

  const loadData = async () => {
    if (!taskId) return;
    setLoading(true);
    const [tasks, u] = await Promise.all([
      api.entities.Task.filter({ id: taskId }, "", 1),
      api.auth.me().catch(() => null),
    ]);
    const t = tasks[0];
    setTask(t);
    setUser(u);

    if (t) {
      const offersData = await api.entities.TaskOffer.filter({ task_id: taskId }, "-created_date", 20);
      setOffers(offersData);
      if (u) {
        // Find the latest pending or accepted offer (most recent, not rejected)
        const activeOffer = offersData.find((o) => o.tasker_email === u.email && o.status !== "rejected");
        setMyOffer(activeOffer || null);
        
        // Load user's review if exists
        const reviews = await api.entities.Review.filter({ task_id: taskId, reviewer_email: u.email }, "-created_date", 1);
        if (reviews.length > 0) {
          setMyReview(reviews[0]);
          setReviewForm({ rating: reviews[0].rating, comment: reviews[0].comment || "" });
        }
      }
    }
    setLoading(false);
  };

  // Get all offers by current user for this task (including rejected)
  const myOffers = user ? offers.filter((o) => o.tasker_email === user.email) : [];
  
  const isOwner = user && task && task.created_by === user.email;
  const canOffer = user && user.is_tasker && task && task.status === "open" && !isOwner && myOffers.length < 3 && (!myOffer || myOffer.status === "rejected");
  const taskBudget = Number(task?.budget);

  const getDefaultOfferPrice = () => {
    return Number.isFinite(taskBudget) ? String(taskBudget) : "";
  };

  const openOfferForm = () => {
    // Only pre-fill price if form is empty (first time opening)
    if (!offerForm.price) {
      setOfferForm((prev) => ({
        ...prev,
        price: getDefaultOfferPrice(),
      }));
    }
    setShowOfferForm(true);
  };

  const submitOffer = async (e) => {
    e.preventDefault();
    if (!offerForm.price) return;
    setSubmitting(true);
    
    const priceValue = Number(offerForm.price);
    
    const offerData = {
      task_id: taskId,
      task_title: task.title,
      tasker_email: user.email,
      tasker_name: user.full_name || user.email,
      price: priceValue,
      message: offerForm.message?.trim() || "",
      status: "pending",
    };
    
    // Only add estimated_hours if provided
    if (offerForm.estimated_hours) {
      offerData.estimated_hours = Number(offerForm.estimated_hours);
    }
    
    await api.entities.TaskOffer.create(offerData);
    
    // Notify task owner about the new offer
    await api.entities.Notification.create({
      recipient_email: task.created_by,
      type: "offer_made",
      title: "New Offer Received",
      message: `${user.full_name || user.email} made an offer of ETB ${offerForm.price} on your task "${task.title}"`,
      task_id: taskId,
      task_title: task.title,
      actor_name: user.full_name || user.email,
      actor_email: user.email,
      read: false,
    });
    
    setSubmitting(false);
    setShowOfferForm(false);
    // Reset form after successful submission
    setOfferForm({ price: "", message: "", estimated_hours: "" });
    loadData();
  };

  const acceptOffer = async (offer) => {
    try {
      // Use batch write to reduce write operations and ensure atomic updates
      const batch = writeBatch(db);
      
      // Update task to assigned status
      batch.update(doc(db, 'tasks', taskId), {
        status: "assigned",
        assigned_to: offer.tasker_email,
        assigned_to_name: offer.tasker_name,
      });
      
      // Accept the selected offer
      batch.update(doc(db, 'taskOffers', offer.id), { status: "accepted" });
      
      // Reject all other pending offers in a single batch
      offers.forEach((o) => {
        if (o.id !== offer.id && o.status === "pending") {
          batch.update(doc(db, 'taskOffers', o.id), { status: "rejected" });
        }
      });
      
      await batch.commit();
      
      // Create notifications after batch completes (these are separate writes)
      // Notify accepted offer maker
      await api.entities.Notification.create({
        recipient_email: offer.tasker_email,
        type: "offer_accepted",
        title: "Your Offer Was Accepted!",
        message: `Your offer of ETB ${offer.price} for "${task.title}" has been accepted!`,
        task_id: taskId,
        task_title: task.title,
        offer_id: offer.id,
        actor_name: user.full_name || user.email,
        actor_email: user.email,
        read: false,
      });
      
      // Notify rejected offer makers
      for (const o of offers) {
        if (o.id !== offer.id && o.status === "pending") {
          await api.entities.Notification.create({
            recipient_email: o.tasker_email,
            type: "offer_rejected",
            title: "Your Offer Was Not Selected",
            message: `Your offer of ETB ${o.price} for "${task.title}" was not selected.`,
            task_id: taskId,
            task_title: task.title,
            offer_id: o.id,
            actor_name: user.full_name || user.email,
            actor_email: user.email,
            read: false,
          });
        }
      }
      
      loadData();
    } catch (err) {
      console.error("Error accepting offer:", err);
      alert("Failed to accept offer. Please try again.");
    }
  };

  const rejectOffer = async (offer) => {
    try {
      await api.entities.TaskOffer.update(offer.id, { status: "rejected" });
      
      // Notify the rejected offer maker
      await api.entities.Notification.create({
        recipient_email: offer.tasker_email,
        type: "offer_rejected",
        title: "Your Offer Was Not Selected",
        message: `Your offer of ETB ${offer.price} for "${task.title}" was not selected.`,
        task_id: taskId,
        task_title: task.title,
        offer_id: offer.id,
        actor_name: user.full_name || user.email,
        actor_email: user.email,
        read: false,
      });
      
      loadData();
    } catch (err) {
      console.error("Error rejecting offer:", err);
      alert("Failed to reject offer. Please try again.");
    }
  };

  const markComplete = async () => {
    await api.entities.Task.update(taskId, { status: "completed" });
    loadData();
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.rating) return;
    setSubmitting(true);
    
    if (editingReview && myReview) {
      // Update existing review
      await api.entities.Review.update(myReview.id, {
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
    } else {
      // Create new review - task owner reviews the assigned tasker
      await api.entities.Review.create({
        task_id: taskId,
        reviewer_email: user.email,
        reviewer_name: user.full_name || user.email,
        reviewee_email: task.assigned_to, // Always the tasker being reviewed
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
    }
    
    setSubmitting(false);
    setShowReviewForm(false);
    setEditingReview(false);
    loadData();
  };

  const deleteReview = async () => {
    if (!myReview) return;
    setSubmitting(true);
    await api.entities.Review.delete(myReview.id);
    setMyReview(null);
    setReviewForm({ rating: 0, comment: "" });
    setSubmitting(false);
    loadData();
  };

  const startEditReview = () => {
    setEditingReview(true);
    setShowReviewForm(true);
  };

  const cancelEditReview = () => {
    setEditingReview(false);
    setShowReviewForm(false);
    if (myReview) {
      setReviewForm({ rating: myReview.rating, comment: myReview.comment || "" });
    }
  };

  const viewUserProfile = async (email, name) => {
    setLoadingUserProfile(true);
    setSelectedUserProfile({ email, name });
    const reviews = await api.entities.Review.filter({ reviewee_email: email }, "-created_date", 50);
    setUserProfileReviews(reviews);
    setLoadingUserProfile(false);
  };

  const closeUserProfile = () => {
    setSelectedUserProfile(null);
    setUserProfileReviews([]);
  };

  const calculateAverageRating = (reviews) => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
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
            {Number.isFinite(taskBudget) && (
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-0.5">Budget</p>
                <p className="font-bold text-green-700">
                  ETB {taskBudget}
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
          <Button onClick={() => setShowCompleteConfirm(true)} className="w-full bg-green-700 hover:bg-green-800 text-white">
            <CheckCircle className="w-4 h-4 mr-2" /> Mark as Completed
          </Button>
        </div>
      )}

      {/* Messaging Section - Show when task is assigned */}
      {task.status === "assigned" && user && (
        <Card className="mb-4 border border-gray-100">
          <CardContent className="p-4">
            <p className="font-medium text-sm mb-3">Contact {isOwner ? task.assigned_to_name : task.poster_name}</p>
            <Button 
              onClick={() => navigate(`${createPageUrl("Messages")}?taskId=${task.id}`)}
              className="w-full bg-green-700 hover:bg-green-800 text-white"
            >
              <Send className="w-4 h-4 mr-2" /> Open Conversation
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Review after completion - ONLY FOR TASK OWNER */}
      {task.status === "completed" && user && isOwner && (
        <Card className="mb-4 border border-gray-100">
          <CardContent className="p-4">
            {myReview && !showReviewForm ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm mb-2">Your Review for {task.assigned_to_name}</p>
                    <StarRating rating={myReview.rating} size="md" />
                    {myReview.comment && (
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{myReview.comment}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={startEditReview}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Edit className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={deleteReview}
                      disabled={submitting}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            ) : !showReviewForm ? (
              <Button variant="outline" className="w-full" onClick={() => setShowReviewForm(true)}>
                Leave a Review for {task.assigned_to_name}
              </Button>
            ) : (
              <form onSubmit={submitReview} className="space-y-3">
                <p className="font-medium text-sm">{editingReview ? "Edit Your Review" : `Review ${task.assigned_to_name}`}</p>
                <StarRating rating={reviewForm.rating} interactive onChange={(r) => setReviewForm((p) => ({ ...p, rating: r }))} size="lg" />
                <Textarea
                  placeholder="Share your experience with the tasker..."
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm((p) => ({ ...p, comment: e.target.value }))}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting || !reviewForm.rating} className="bg-green-700 hover:bg-green-800 text-white">
                    {editingReview ? "Update" : "Submit"}
                  </Button>
                  <Button type="button" variant="outline" onClick={editingReview ? cancelEditReview : () => setShowReviewForm(false)}>Cancel</Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Offers Section - Only show header with count to task owner */}
      {isOwner ? (
        <Card className="border border-gray-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Offers ({offers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {offers.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No offers yet</p>
            )}
            {offers.map((offer) => (
              <div key={offer.id} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <Avatar 
                      className="w-10 h-10 cursor-pointer hover:opacity-70 hover:ring-2 hover:ring-green-500 transition shrink-0"
                      onClick={() => viewUserProfile(offer.tasker_email, offer.tasker_name)}
                      title="Click to view profile and reviews"
                    >
                      <AvatarFallback className="bg-green-700 text-white font-semibold">
                        {offer.tasker_name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-800">{offer.tasker_name}</p>
                      <p className="text-green-700 font-bold">ETB {offer.price}</p>
                      {offer.estimated_hours && (
                        <p className="text-xs text-gray-400">{offer.estimated_hours}h estimated</p>
                      )}
                      {offer.message ? (
                        <p className="text-sm text-gray-600 mt-1">{offer.message}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      offer.status === "accepted" ? "bg-green-100 text-green-700" :
                      offer.status === "rejected" ? "bg-red-100 text-red-500" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>{offer.status}</span>
                    {task.status === "open" && offer.status === "pending" && (
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-green-700 hover:bg-green-800 text-white text-xs" onClick={() => acceptOffer(offer)}>
                          Accept
                        </Button>
                        <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50 text-xs" onClick={() => rejectOffer(offer)}>
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        /* Non-owner view - no header, just offer form or own offer */
        <div className="space-y-3">
          {/* Show offer if pending or accepted */}
          {myOffer && myOffer.status !== "rejected" && (
            <Card className="border border-gray-100">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-800">{myOffer.tasker_name}</p>
                    <p className="text-green-700 font-bold">ETB {myOffer.price}</p>
                    {myOffer.estimated_hours && (
                      <p className="text-xs text-gray-400">{myOffer.estimated_hours}h estimated</p>
                    )}
                    {myOffer.message ? (
                      <p className="text-sm text-gray-600 mt-1">{myOffer.message}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      myOffer.status === "accepted" ? "bg-green-100 text-green-700" :
                      myOffer.status === "rejected" ? "bg-red-100 text-red-500" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>{myOffer.status}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Make an offer - only show if no pending/accepted offer */}
          {(!myOffer || myOffer.status === "rejected") && canOffer ? (
            <>
              {!showOfferForm ? (
                <Button className="w-full bg-green-700 hover:bg-green-800 text-white" onClick={openOfferForm}>
                  <Send className="w-4 h-4 mr-2" /> Make an Offer
                </Button>
              ) : (
                <form onSubmit={submitOffer} className="space-y-3 pt-2 border-t border-gray-100">
                  <p className="font-medium text-sm">Make an Offer</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="price">Your Price (ETB) *</Label>
                      <Input id="price" type="number" step="any" min="0" placeholder="300" value={offerForm.price} onChange={(e) => setOfferForm((p) => ({ ...p, price: e.target.value }))} required className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="est_hours">Est. Hours</Label>
                      <Input id="est_hours" type="number" step="any" min="0" placeholder="2" value={offerForm.estimated_hours} onChange={(e) => setOfferForm((p) => ({ ...p, estimated_hours: e.target.value }))} className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="message">Message (optional)</Label>
                    <Textarea id="message" placeholder="Add a short note (optional)" value={offerForm.message} onChange={(e) => setOfferForm((p) => ({ ...p, message: e.target.value }))} rows={3} className="mt-1" />
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
          ) : myOffers.length >= 3 && !myOffer ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
              <p className="font-medium text-red-900">Offer limit reached</p>
              <p className="text-red-700">You have made the maximum of 3 offers on this task.</p>
            </div>
          ) : !isOwner && !user?.is_tasker && task?.status === "open" ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
              <p className="font-medium text-amber-900 mb-1">Want to make an offer?</p>
              <p className="text-amber-700 mb-3">You need to enable the Tasker mode in your profile to make offers on tasks.</p>
              <Button 
                variant="outline" 
                size="sm"
                className="border-amber-600 text-amber-700 hover:bg-amber-50"
                onClick={() => navigate(createPageUrl("Profile"))}
              >
                Go to Profile
              </Button>
            </div>
          ) : null}
        </div>
      )}

      {/* User Profile Dialog */}
      <Dialog open={!!selectedUserProfile} onOpenChange={() => closeUserProfile()}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md sm:w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-green-700 text-white font-semibold">
                  {selectedUserProfile?.name?.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              {selectedUserProfile?.name}
            </DialogTitle>
          </DialogHeader>
          
          {loadingUserProfile ? (
            <div className="py-8 space-y-3 px-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-4 px-2">
              {/* Rating Summary */}
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {calculateAverageRating(userProfileReviews)}
                </div>
                <StarRating rating={parseFloat(calculateAverageRating(userProfileReviews))} />
                <p className="text-sm text-gray-600 mt-1">
                  {userProfileReviews.length} {userProfileReviews.length === 1 ? 'review' : 'reviews'}
                </p>
              </div>

              {/* Reviews List */}
              <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
                {userProfileReviews.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-4">No reviews yet</p>
                ) : (
                  userProfileReviews.map((review) => (
                    <div key={review.id} className="border border-gray-100 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">{review.reviewer_name}</p>
                          <StarRating rating={review.rating} size="sm" />
                        </div>
                        <p className="text-xs text-gray-400">
                          {format(new Date(review.created_date), "MMM d, yyyy")}
                        </p>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Mark as Complete Confirmation */}
      <AlertDialog open={showCompleteConfirm} onOpenChange={setShowCompleteConfirm}>
        <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-md sm:w-full">
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Task as Completed?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will mark the task as completed. The tasker will be notified and you'll be able to leave a review.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setShowCompleteConfirm(false);
                markComplete();
              }}
              className="bg-green-700 hover:bg-green-800"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}