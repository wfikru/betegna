import { useState, useEffect } from "react";
import { api } from "@/api/firebaseClient";
import { createPageUrl } from "@/utils";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, Search, SlidersHorizontal, ChevronRight, Filter, ChevronDown } from "lucide-react";
import CategoryBadge, { taskCategories } from "@/components/shared/CategoryBadge";
import TaskCard from "@/components/shared/TaskCard";
import StarRating from "@/components/shared/StarRating";
import { format } from "date-fns";

const TASKS_PER_PAGE = 20;

const statusColors = {
  open: "bg-green-100 text-green-700",
  assigned: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-600",
};

export default function BrowseTasks() {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
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
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-6 pb-24 md:pb-8">
        {/* Filters Card */}
        <Card className="mb-6 shadow-lg border-0">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={t('browseTasks.searchPlaceholder')}
                  className="pl-10 h-11"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-52 h-11">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <SelectValue placeholder={t('browseTasks.filterCategory')} />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('browseTasks.allCategories')}</SelectItem>
                  {taskCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nameEn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-full md:w-48 h-11">
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
            
            {/* Results count */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{filtered.length}</span> {t('browseTasks.resultsCount', { count: filtered.length })}
              </p>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-52 bg-white animate-pulse rounded-xl shadow" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="shadow-lg border-0">
            <CardContent className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-2">{t('browseTasks.noTasksTitle')}</p>
              <p className="text-gray-500">{t('browseTasks.noTasksMessage')}</p>
            </CardContent>
          </Card>
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