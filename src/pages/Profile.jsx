import { useState, useEffect } from "react";
import { api } from "@/api/firebaseClient";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { User, Star, CheckCircle, Briefcase, Trash2, AlertCircle } from "lucide-react";
import { taskCategories } from "@/components/shared/CategoryBadge";
import StarRating from "@/components/shared/StarRating";
import LoginModal from "@/components/LoginModal";
import { format } from "date-fns";
import { createPageUrl } from "@/utils";

export default function Profile() {
  const navigate = useNavigate();
  const { user: authUser, isLoadingAuth } = useAuth();
  const [user, setUser] = useState(null);
  /** @type {[import("../types/entities").Review[], Function]} */
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({ bio: null, skills: null });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    bio: "",
    phone: "",
    city: "addis_ababa",
    is_tasker: false,
    skills: [],
    hourly_rate: "",
  });

  useEffect(() => {
    if (authUser) {
      loadData();
    } else {
      setUser(null);
      setReviews([]);
      setLoading(false);
    }
  }, [authUser]);

  const loadData = async () => {
    setLoading(true);
    const u = await api.auth.me().catch(() => authUser);
    setUser(u);
    if (u) {
      setForm({
        bio: u.bio || "",
        phone: u.phone || "",
        city: u.city || "addis_ababa",
        is_tasker: u.is_tasker || false,
        skills: u.skills || [],
        hourly_rate: u.hourly_rate || "",
      });
      try {
        const myReviews = await api.entities.Review.filter({ reviewee_email: u.email }, "-created_date", 10);
        setReviews(myReviews);
      } catch (err) {
        console.warn('Loading reviews failed:', err?.code || err?.message || err);
        setReviews([]);
      }
    }
    setLoading(false);
  };

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const toggleSkill = (skillId) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skillId)
        ? prev.skills.filter((s) => s !== skillId)
        : [...prev.skills, skillId],
    }));
  };

  const save = async () => {
    const newErrors = {};
    if (form.is_tasker && !form.bio.trim()) {
      newErrors.bio = "A description is required so clients know what you offer.";
    }
    if (form.is_tasker && form.skills.length === 0) {
      newErrors.skills = "Select at least one skill so clients can find you.";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({ bio: null, skills: null });
    setSaving(true);
    const updateData = {
      bio: form.bio,
      phone: form.phone,
      city: form.city,
      is_tasker: form.is_tasker,
      skills: form.skills,
    };
    if (form.hourly_rate) {
      updateData.hourly_rate = Number(form.hourly_rate);
    }
    try {
      await api.auth.updateMe(updateData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Profile save failed:', err);
      const msg = err?.message || err?.code || 'Failed to save profile';
      alert('Failed to save profile: ' + msg + '\nCheck Firestore rules or authentication.');
    } finally {
      setSaving(false);
      loadData();
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.auth.deleteAccount();
      // Account deleted successfully, will auto-redirect to login via auth state change
    } catch (err) {
      setDeleting(false);
      if (err.code === 'auth/requires-recent-login') {
        alert("For security, please log out and log back in before deleting your account.");
      } else {
        alert("Failed to delete account: " + (err.message || "Unknown error"));
      }
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl" />)}
      </div>
    );
  }

  if (!authUser) {
    return <LoginModal onCancel={() => navigate("/BrowseTasks")} />;
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl" />)}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {[1, 2].map((i) => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />)}
      </div>
    );
  }

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-green-700 to-green-600 text-white py-10">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-white text-2xl font-bold shadow-lg backdrop-blur-sm">
              {(user.full_name || user.email || "?")[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user.full_name || "No name set"}</h1>
              <p className="text-green-100 text-sm">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                {form.is_tasker && (
                  <span className="inline-flex items-center gap-1 text-xs bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/30">
                    <Briefcase className="w-3 h-3" /> Tasker
                  </span>
                )}
                {reviews.length > 0 && (
                  <span className="text-xs text-green-100">{avgRating.toFixed(1)} ★ ({reviews.length} reviews)</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">

      {/* Edit Form */}
      <div className="space-y-4">
        <Card className="border border-gray-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Personal Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" placeholder="+251 9XX XXX XXXX" value={form.phone} onChange={(e) => set("phone", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>City</Label>
              <Select value={form.city} onValueChange={(v) => set("city", v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="addis_ababa">Addis Ababa</SelectItem>
                  <SelectItem value="dire_dawa">Dire Dawa</SelectItem>
                  <SelectItem value="hawassa">Hawassa</SelectItem>
                  <SelectItem value="bahir_dar">Bahir Dar</SelectItem>
                  <SelectItem value="adama">Adama</SelectItem>
                  <SelectItem value="mekelle">Mekelle</SelectItem>
                  <SelectItem value="jimma">Jimma</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className={`border ${errors.bio || errors.skills ? "border-red-200" : "border-gray-100"}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tasker Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">I'm available as a Tasker</p>
                <p className="text-xs text-gray-400">Clients will be able to find and book you</p>
              </div>
              <Switch checked={form.is_tasker} onCheckedChange={(v) => { set("is_tasker", v); setErrors({}); }} />
            </div>

            {form.is_tasker && (
              <>
                <div className="pt-1 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-3">
                    The following is shown to clients browsing for help.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bio" className="flex items-center gap-1">
                        Description <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="bio"
                        placeholder="Describe your experience, what you offer, and why clients should hire you…"
                        value={form.bio}
                        onChange={(e) => { set("bio", e.target.value); if (errors.bio) setErrors(p => ({ ...p, bio: null })); }}
                        rows={4}
                        className={`mt-1 ${errors.bio ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                      />
                      {errors.bio && (
                        <p className="flex items-center gap-1 text-xs text-red-600 mt-1">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.bio}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="flex items-center gap-1 mb-2">
                        Skills <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {taskCategories.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => { toggleSkill(c.id); if (errors.skills) setErrors(p => ({ ...p, skills: null })); }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                              form.skills.includes(c.id)
                                ? "bg-green-700 text-white border-green-700"
                                : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
                            }`}
                          >
                            {c.nameEn}
                          </button>
                        ))}
                      </div>
                      {errors.skills && (
                        <p className="flex items-center gap-1 text-xs text-red-600 mt-2">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.skills}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>Hourly Rate (ETB)</Label>
                      <Input type="number" placeholder="150" value={form.hourly_rate} onChange={(e) => set("hourly_rate", e.target.value)} className="mt-1" />
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Button
          onClick={save}
          disabled={saving}
          className={`w-full py-3 text-base ${saved ? "bg-green-600" : "bg-green-700 hover:bg-green-800"} text-white`}
        >
          {saved ? (
            <><CheckCircle className="w-4 h-4 mr-2" /> Saved!</>
          ) : saving ? "Saving…" : "Save Changes"}
        </Button>

        {/* <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate(createPageUrl("Legal"))}
        >
          <FileText className="w-4 h-4 mr-2" /> Privacy & Terms
        </Button> */}

        <Button
          variant="outline"
          className="w-full"
          onClick={() => api.auth.logout()}
        >
          Log Out
        </Button>

        <Button
          variant="outline"
          className="w-full border-red-300 text-red-700 hover:bg-red-50"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="w-4 h-4 mr-2" /> Delete Account
        </Button>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-md sm:w-full">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account, profile, and all associated data including tasks, offers, reviews, and messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reviews */}
      {reviews.length > 0 && (
        <Card className="mt-6 border border-gray-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Reviews & Ratings</CardTitle>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-gray-900">{avgRating.toFixed(1)}</div>
                <div>
                  <StarRating rating={Math.round(avgRating)} size="sm" />
                  <p className="text-xs text-gray-500">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{r.reviewer_name}</p>
                    <StarRating rating={r.rating} size="sm" />
                  </div>
                  <p className="text-xs text-gray-400">
                    {format(new Date(r.created_date), "MMM d, yyyy")}
                  </p>
                </div>
                {r.comment && <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}