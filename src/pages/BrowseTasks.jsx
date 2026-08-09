import { useState, useEffect } from "react";
import { api } from "@/api/firebaseClient";
import { createPageUrl } from "@/utils";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Search, ChevronDown, PlusCircle, ArrowRight, CheckCircle, MessageCircle, Star } from "lucide-react";
import { taskCategories } from "@/components/shared/CategoryBadge";
import TaskCard from "@/components/shared/TaskCard";
import { useAuth } from "@/lib/AuthContext";

const TASKS_PER_PAGE = 20;

const howItWorks = [
  { step: "1", icon: Search, title: "Find a Task", description: "Browse tasks near you or search for what you need" },
  { step: "2", icon: MessageCircle, title: "Send an Offer", description: "Submit your price and availability to the poster" },
  { step: "3", icon: CheckCircle, title: "Get Hired", description: "The poster reviews offers and picks the best fit" },
  { step: "4", icon: Star, title: "Get Paid", description: "Complete the task, get reviewed, and earn" },
];

function EmptyState({ hasFilters, onClearFilters, onPostTask, onSelectCategory, navigate, user }) {
  return (
    <div className="space-y-10">
      {/* Message */}
      {hasFilters ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-xl font-bold text-gray-900 mb-2">No tasks match your filters</p>
          <p className="text-gray-500 mb-6">Try adjusting your search or browse all open tasks</p>
          <button
            onClick={onClearFilters}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-700 text-white font-semibold hover:bg-green-800 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-gradient-to-br from-green-700 to-green-600 text-white p-8 md:p-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-green-200 mb-3">Be the first</p>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">
            No tasks posted yet.<br />Yours could be first.
          </h2>
          <p className="text-green-100 text-lg mb-8 max-w-lg mx-auto">
            Describe what you need, set a budget, and skilled taskers in your city will send you offers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onPostTask}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white text-green-700 font-bold text-base hover:bg-green-50 transition-colors shadow-md"
            >
              <PlusCircle className="w-5 h-5" />
              Post a Task
            </button>
            <button
              onClick={() => navigate(createPageUrl("BrowseTasks"))}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full border-2 border-white/50 text-white font-semibold text-base hover:border-white hover:bg-white/10 transition-colors"
            >
              Explore Categories
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Popular Categories */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-5">Browse by Category</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {taskCategories.filter(c => c.id !== "other").map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-green-200 transition-all text-center"
              >
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                  <Icon className="w-6 h-6 text-green-700" />
                </div>
                <span className="text-sm font-semibold text-gray-800 group-hover:text-green-700 transition-colors leading-tight">
                  {cat.nameEn}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">How Betegna Works</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {howItWorks.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="relative flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-green-700 text-white flex items-center justify-center text-sm font-bold mb-3 shadow">
                  {item.step}
                </div>
                <Icon className="w-5 h-5 text-green-600 mb-2" />
                <p className="text-sm font-semibold text-gray-900 mb-1">{item.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
                {i < howItWorks.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-5 -right-3 w-5 h-5 text-green-200" />
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-8 text-center">
          <button
            onClick={onPostTask}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-green-700 text-white font-bold hover:bg-green-800 transition-colors shadow-md"
          >
            Get Started — Post a Task
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BrowseTasks() {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  /** @type {[import("../types/entities").Task[], Function]} */
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "all");
  const [cityFilter, setCityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await api.entities.Task.filter({ status: "open" }, "-created_date", TASKS_PER_PAGE);
      setTasks(data);
      setCurrentPage(0);
      setHasMore(data.length === TASKS_PER_PAGE);
    } catch (err) {
      console.warn("Error loading tasks, falling back to unsorted query:", err.message);
      const data = await api.entities.Task.filter({ status: "open" }, "", TASKS_PER_PAGE);
      setTasks(data);
      setCurrentPage(0);
      setHasMore(data.length === TASKS_PER_PAGE);
    }
    setLoading(false);
  };

  const loadMore = async () => {
    try {
      const offset = (currentPage + 1) * TASKS_PER_PAGE;
      const data = await api.entities.Task.filter(
        { status: "open" },
        "-created_date",
        TASKS_PER_PAGE * 2,
        offset
      );
      setTasks((prev) => [...prev, ...data]);
      setCurrentPage((prev) => prev + 1);
      setHasMore(data.length === TASKS_PER_PAGE);
    } catch (err) {
      console.warn("Error loading more tasks:", err.message);
      setHasMore(false);
    }
  };

  const filtered = tasks.filter((t) => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || t.category === categoryFilter;
    const matchCity = cityFilter === "all" || t.city === cityFilter;
    return matchSearch && matchCat && matchCity;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-700 to-green-600 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{t('browseTasks.title')}</h1>
          <p className="text-green-50 text-lg">{t('browseTasks.subtitle')}</p>
          {/* Guest CTA — shown only to non-logged-in users */}
          {!user && (
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate(createPageUrl("PostTask"))}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white text-green-700 font-bold text-sm hover:bg-green-50 transition-colors shadow-md"
              >
                <PlusCircle className="w-4 h-4" />
                Post a Task
              </button>
              <button
                onClick={() => navigate("/login")}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-white/50 text-white font-semibold text-sm hover:border-white hover:bg-white/10 transition-colors"
              >
                Sign in to offer services
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-6 pb-24 md:pb-8">
        {/* Search & Filters Card */}
        <Card className="mb-4 shadow-lg border-0">
          <CardContent className="p-4 md:p-5">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={t('browseTasks.searchPlaceholder')}
                  className="pl-10 h-11"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-full md:w-44 h-11">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <SelectValue placeholder={t('browseTasks.filterCity')} />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('browseTasks.allCities')}</SelectItem>
                  <SelectItem value="addis_ababa">{t('cities.addis_ababa')}</SelectItem>
                  <SelectItem value="dire_dawa">{t('cities.dire_dawa')}</SelectItem>
                  <SelectItem value="hawassa">{t('cities.hawassa')}</SelectItem>
                  <SelectItem value="bahir_dar">{t('cities.bahir_dar')}</SelectItem>
                  <SelectItem value="adama">{t('cities.adama')}</SelectItem>
                  <SelectItem value="mekelle">{t('cities.mekelle')}</SelectItem>
                  <SelectItem value="jimma">{t('cities.jimma')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Category filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide -mx-1 px-1">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              categoryFilter === "all"
                ? "bg-green-700 text-white border-green-700 shadow-sm"
                : "bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:text-green-700"
            }`}
          >
            All
          </button>
          {taskCategories.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.id}
                onClick={() => setCategoryFilter(c.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                  categoryFilter === c.id
                    ? "bg-green-700 text-white border-green-700 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:text-green-700"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {c.nameEn}
              </button>
            );
          })}
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-500 mb-4">
          <span className="font-semibold text-gray-900">{filtered.length}</span> {t('browseTasks.resultsCount', { count: filtered.length })}
        </p>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-52 bg-white animate-pulse rounded-xl shadow" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            hasFilters={search !== "" || categoryFilter !== "all" || cityFilter !== "all"}
            onClearFilters={() => { setSearch(""); setCategoryFilter("all"); setCityFilter("all"); }}
            onPostTask={() => navigate(createPageUrl(user ? "PostTask" : "Login"))}
            onSelectCategory={(id) => setCategoryFilter(id)}
            navigate={navigate}
            user={user}
          />
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-5">
              {filtered.map((task) => (
                <TaskCard key={task.id} task={task} showFavoriteButton={true} />
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button
                  onClick={loadMore}
                  variant="outline"
                  className="flex items-center gap-2 px-6 py-2"
                >
                  <ChevronDown className="w-4 h-4" />
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}