import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/api/firebaseClient";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Calendar, DollarSign, Tag, CheckCircle, ShieldCheck } from "lucide-react";
import { taskCategories } from "@/components/shared/CategoryBadge";
import LoginModal from "@/components/LoginModal";

export default function PostTask() {
  const navigate = useNavigate();
  const { user, isLoadingAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "other",
    budget: "",
    location: "",
    city: "addis_ababa",
    date_needed: "",
    time_preference: "flexible",
  });


  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.budget) return;
    setLoading(true);
    try {
      const budget = Number(form.budget);
      await api.entities.Task.create({
        ...form,
        budget,
        poster_name: user?.full_name || user?.email || "Anonymous",
        created_by: user?.email || "",
        status: "open",
      });
      setSuccess(true);
      setTimeout(() => navigate(createPageUrl("MyTasks")), 2000);
    } catch (err) {
      console.error("failed to post task", err);
      // optionally show toast/error message here
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />)}
      </div>
    );
  }

  if (!user) {
    return (
      <LoginModal onCancel={() => navigate(createPageUrl("BrowseTasks"))} />
    );
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Task Posted!</h2>
        <p className="text-gray-500">Redirecting to your tasks…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 md:pb-8">
      {/* Thumbtack-Inspired Pro Match Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white py-10">
        <div className="max-w-2xl mx-auto px-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Thumbtack Pro Match System
          </span>
          <h1 className="text-3xl font-black mb-1">Request 3 Free Quotes</h1>
          <p className="text-slate-200 text-base">
            Tell us about your home project. We'll match you with verified local Pros who will send competitive bids.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6">
        {/* Thumbtack Pro Match Advantage Pill Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-md mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-extrabold shrink-0">
              ⚡
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">How Quote Matching Works</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                100% Free to post • Receive quotes in under 1 hour • Compare reviews before hiring
              </p>
            </div>
          </div>
        </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="w-4 h-4 text-green-600" /> Task Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Help me move furniture"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {taskCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nameEn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="description">Description *</Label>
                <span className="text-xs text-gray-500">
                  {form.description.length}/500
                </span>
              </div>
              <Textarea
                id="description"
                placeholder="Describe the task in detail..."
                value={form.description}
                onChange={(e) => {
                  if (e.target.value.length <= 500) {
                    set("description", e.target.value);
                  }
                }}
                required
                rows={4}
                className="mt-1"
                maxLength={500}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" /> Budget (ETB)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="budget">Price *</Label>
              <Input
                id="budget"
                type="number"
                placeholder="500"
                value={form.budget}
                onChange={(e) => set("budget", e.target.value)}
                required
                min="0"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-600" /> Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="city">City</Label>
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
            <div>
              <Label htmlFor="location">Neighborhood / Address</Label>
              <Input
                id="location"
                placeholder="e.g. Bole, Kazanchis..."
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-green-600" /> When
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="date_needed" className="text-xs sm:text-sm">Date</Label>
              <Input
                id="date_needed"
                type="date"
                value={form.date_needed}
                onChange={(e) => set("date_needed", e.target.value)}
                className="mt-1 text-xs sm:text-sm"
              />
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Time Preference</Label>
              <Select value={form.time_preference} onValueChange={(v) => set("time_preference", v)}>
                <SelectTrigger className="mt-1 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full bg-green-700 hover:bg-green-800 text-white py-3 text-base font-semibold shadow-md"
          disabled={loading}
        >
          {loading ? "Posting…" : "Post Task"}
        </Button>
      </form>
      </div>
    </div>
  );
}