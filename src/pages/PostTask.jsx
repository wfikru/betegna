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
import { MapPin, Calendar, DollarSign, Tag, CheckCircle } from "lucide-react";
import { taskCategories } from "@/components/shared/CategoryBadge";
import LoginModal from "@/components/LoginModal";

export default function PostTask() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "other",
    budget_min: "",
    budget_max: "",
    location: "",
    city: "addis_ababa",
    date_needed: "",
    time_preference: "flexible",
  });


  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.budget_min || !form.budget_max) return;
    setLoading(true);
    try {
      await api.entities.Task.create({
        ...form,
        budget_min: Number(form.budget_min),
        budget_max: Number(form.budget_max),
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
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Post a Task</h1>
        <p className="text-gray-500 text-sm">Describe what you need done and find a tasker</p>
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
          <CardContent className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="budget_min">Min *</Label>
              <Input
                id="budget_min"
                type="number"
                placeholder="100"
                value={form.budget_min}
                onChange={(e) => set("budget_min", e.target.value)}
                required
                min="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="budget_max">Max *</Label>
              <Input
                id="budget_max"
                type="number"
                placeholder="500"
                value={form.budget_max}
                onChange={(e) => set("budget_max", e.target.value)}
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
              <Label htmlFor="date_needed">Date</Label>
              <Input
                id="date_needed"
                type="date"
                value={form.date_needed}
                onChange={(e) => set("date_needed", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Time Preference</Label>
              <Select value={form.time_preference} onValueChange={(v) => set("time_preference", v)}>
                <SelectTrigger className="mt-1">
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
          className="w-full bg-green-700 hover:bg-green-800 text-white py-3 text-base"
          disabled={loading}
        >
          {loading ? "Posting…" : "Post Task"}
        </Button>
      </form>
    </div>
  );
}