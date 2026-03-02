import { useState, useEffect } from "react";
import { api } from "@/api/firebaseClient";
import { createPageUrl } from "@/utils";
import { Link, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, Search, SlidersHorizontal, ChevronRight, Filter } from "lucide-react";
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
  const [searchParams] = useSearchParams();
  /** @type {[import("../types/entities").Task[], Function]} */
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "all");
  const [cityFilter, setCityFilter] = useState("all");

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await api.entities.Task.filter({ status: "open" }, "-created_date", 50);
      setTasks(data);
    } catch (err) {
      console.warn("Error loading tasks, falling back to unsorted query:", err.message);
      const data = await api.entities.Task.filter({ status: "open" }, "", 50);
      setTasks(data);
    }
    setLoading(false);
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
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Browse Available Tasks</h1>
          <p className="text-green-50 text-lg">Find tasks that match your skills and earn money</p>
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
                  placeholder="Search tasks by title or description..."
                  className="pl-10 h-11"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-52 h-11">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <SelectValue placeholder="Category" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {taskCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nameEn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-full md:w-48 h-11">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <SelectValue placeholder="City" />
                  </div>
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
            
            {/* Results count */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{filtered.length}</span> {filtered.length === 1 ? 'task' : 'tasks'} found
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
              <p className="text-lg font-semibold text-gray-900 mb-2">No tasks found</p>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {filtered.map((task) => (
              <Link key={task.id} to={createPageUrl(`TaskDetail?id=${task.id}`)}>
                <Card className="h-full hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-green-300 group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <CategoryBadge categoryId={task.category} />
                      {(task.budget_max || task.budget_min) && (
                        <div className="text-right">
                          <div className="font-bold text-green-700 text-xl">
                            ETB {task.budget_max && task.budget_min !== task.budget_max 
                              ? `${task.budget_min}–${task.budget_max}` 
                              : task.budget_max || task.budget_min}
                          </div>
                          <p className="text-xs text-gray-500">Budget</p>
                        </div>
                      )}
                    </div>
                    
                    <h3 className="font-bold text-xl text-gray-900 mb-2 line-clamp-2 group-hover:text-green-700 transition-colors leading-tight">
                      {task.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm line-clamp-3 mb-4 leading-relaxed">
                      {task.description}
                    </p>

                    <div className="flex flex-col gap-2.5 pt-4 border-t border-gray-100">
                      {task.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{task.location}</span>
                        </div>
                      )}
                      {task.date_needed && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span>Needed by {format(new Date(task.date_needed), "MMM d, yyyy")}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Posted by {task.poster_name || "Anonymous"}</span>
                        <ChevronRight className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}