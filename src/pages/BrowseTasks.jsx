import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, Search, SlidersHorizontal, ChevronRight } from "lucide-react";
import CategoryBadge, { taskCategories } from "@/components/shared/CategoryBadge";
import StarRating from "@/components/shared/StarRating";
import { format } from "date-fns";

const statusColors = {
  open: "bg-green-100 text-green-700",
  assigned: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-600",
};

export default function BrowseTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    const data = await base44.entities.Task.filter({ status: "open" }, "-created_date", 50);
    setTasks(data);
    setLoading(false);
  };

  const filtered = tasks.filter((t) => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || t.category === categoryFilter;
    const matchCity = cityFilter === "all" || t.city === cityFilter;
    return matchSearch && matchCat && matchCity;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Browse Tasks</h1>
        <p className="text-gray-500 text-sm">Find tasks near you and make an offer</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search tasks..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {taskCategories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.nameEn}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={cityFilter} onValueChange={setCityFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="City" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            <SelectItem value="addis_ababa">Addis Ababa</SelectItem>
            <SelectItem value="dire_dawa">Dire Dawa</SelectItem>
            <SelectItem value="hawassa">Hawassa</SelectItem>
            <SelectItem value="bahir_dar">Bahir Dar</SelectItem>
            <SelectItem value="adama">Adama</SelectItem>
            <SelectItem value="mekelle">Mekelle</SelectItem>
            <SelectItem value="jimma">Jimma</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">No tasks found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => (
            <Link key={task.id} to={createPageUrl(`TaskDetail?id=${task.id}`)}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer border border-gray-100">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{task.title}</h3>
                        <CategoryBadge categoryId={task.category} />
                      </div>
                      <p className="text-gray-500 text-sm line-clamp-2 mb-2">{task.description}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                        {task.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {task.location}
                          </span>
                        )}
                        {task.date_needed && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {format(new Date(task.date_needed), "MMM d")}
                          </span>
                        )}
                        <span className="text-gray-400">by {task.poster_name || "Anonymous"}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {task.budget_max ? (
                        <span className="font-bold text-green-700 text-sm">
                          ETB {task.budget_min && task.budget_min !== task.budget_max ? `${task.budget_min}–${task.budget_max}` : task.budget_max}
                        </span>
                      ) : task.budget_min ? (
                        <span className="font-bold text-green-700 text-sm">ETB {task.budget_min}</span>
                      ) : null}
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}