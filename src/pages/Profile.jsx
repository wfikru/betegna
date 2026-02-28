import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Star, CheckCircle, Briefcase } from "lucide-react";
import { taskCategories } from "@/components/shared/CategoryBadge";
import StarRating from "@/components/shared/StarRating";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    bio: "",
    phone: "",
    city: "addis_ababa",
    is_tasker: false,
    skills: [],
    hourly_rate: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const u = await base44.auth.me().catch(() => null);
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
      const myReviews = await base44.entities.Review.filter({ reviewee_email: u.email }, "-created_date", 10);
      setReviews(myReviews);
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
    setSaving(true);
    await base44.auth.updateMe({
      ...form,
      hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : undefined,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    loadData();
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl" />)}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-400">
        <User className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p className="font-medium">Please log in to view your profile</p>
      </div>
    );
  }

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Profile</h1>
        <p className="text-gray-500 text-sm">Manage your account and tasker settings</p>
      </div>

      {/* User Header */}
      <Card className="mb-4 border border-gray-100">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-2xl font-bold">
              {(user.full_name || user.email || "?")[0].toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg">{user.full_name || "No name set"}</p>
              <p className="text-gray-500 text-sm">{user.email}</p>
              {reviews.length > 0 && (
                <div className="flex items-center gap-1.5 mt-1">
                  <StarRating rating={Math.round(avgRating)} size="sm" />
                  <span className="text-xs text-gray-500">{avgRating.toFixed(1)} ({reviews.length} reviews)</span>
                </div>
              )}
              {form.is_tasker && (
                <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full mt-1">
                  <Briefcase className="w-3 h-3" /> Tasker
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" placeholder="Tell people about yourself..." value={form.bio} onChange={(e) => set("bio", e.target.value)} rows={3} className="mt-1" />
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

        <Card className="border border-gray-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tasker Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">I'm available as a Tasker</p>
                <p className="text-xs text-gray-400">Allow others to see you for tasks</p>
              </div>
              <Switch checked={form.is_tasker} onCheckedChange={(v) => set("is_tasker", v)} />
            </div>

            {form.is_tasker && (
              <>
                <div>
                  <Label>Hourly Rate (ETB)</Label>
                  <Input type="number" placeholder="150" value={form.hourly_rate} onChange={(e) => set("hourly_rate", e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="mb-2 block">Skills</Label>
                  <div className="flex flex-wrap gap-2">
                    {taskCategories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleSkill(c.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          form.skills.includes(c.id)
                            ? "bg-green-700 text-white border-green-700"
                            : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
                        }`}
                      >
                        {c.nameEn}
                      </button>
                    ))}
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

        <Button
          variant="outline"
          className="w-full"
          onClick={() => base44.auth.logout()}
        >
          Log Out
        </Button>
      </div>

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="mt-6">
          <h2 className="font-bold text-gray-900 mb-3">Reviews ({reviews.length})</h2>
          <div className="space-y-3">
            {reviews.map((r) => (
              <Card key={r.id} className="border border-gray-100">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-medium text-sm">{r.reviewer_name}</p>
                    <StarRating rating={r.rating} size="sm" />
                  </div>
                  {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}