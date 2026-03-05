import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, ChevronRight, Heart, User } from "lucide-react";
import CategoryBadge from "@/components/shared/CategoryBadge";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { api } from "@/api/firebaseClient";
import { useAuth } from "@/lib/AuthContext";

export default function TaskCard({ task, showFavoriteButton = true, onFavoriteChange, offerCount = 0 }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const postedBy = task.poster_name || task.created_by || "Anonymous";
  const postedDate = task.created_date ? format(new Date(task.created_date), "MMM d, yyyy") : "-";
  const taskBudget = Number(task.budget);
  const canShowFavoriteButton = showFavoriteButton && user && task.created_by !== user.email;
  
  const statusConfig = {
    open: { cls: "bg-green-100 text-green-700" },
    assigned: { cls: "bg-blue-100 text-blue-700" },
    in_progress: { cls: "bg-yellow-100 text-yellow-700" },
    completed: { cls: "bg-gray-100 text-gray-600" },
    cancelled: { cls: "bg-red-100 text-red-500" },
  };
  const s = statusConfig[task.status] || statusConfig.open;

  useEffect(() => {
    if (canShowFavoriteButton) {
      checkIfFavorited();
    }
  }, [canShowFavoriteButton, task.id]);

  const checkIfFavorited = async () => {
    try {
      const favorites = await api.entities.Favorite.filter(
        { user_email: user.email, task_id: task.id },
        "",
        1
      );
      if (favorites.length > 0) {
        setIsFavorited(true);
        setFavoriteId(favorites[0].id);
      } else {
        setIsFavorited(false);
        setFavoriteId(null);
      }
    } catch (err) {
      console.warn("Error checking favorite status:", err);
    }
  };

  const toggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user || task.created_by === user.email) {
      return;
    }

    setIsTogglingFavorite(true);
    try {
      if (isFavorited && favoriteId) {
        await api.entities.Favorite.delete(favoriteId);
        setIsFavorited(false);
        setFavoriteId(null);
        if (onFavoriteChange) onFavoriteChange(task.id, false);
      } else {
        const result = await api.entities.Favorite.create({
          user_email: user.email,
          task_id: task.id,
          task_title: task.title,
          task_category: task.category,
        });
        setIsFavorited(true);
        setFavoriteId(result.id);
        if (onFavoriteChange) onFavoriteChange(task.id, true);
      }
    } catch (err) {
      console.warn("Error toggling favorite:", err);
    }
    setIsTogglingFavorite(false);
  };

  return (
    <Link to={createPageUrl(`TaskDetail?id=${task.id}`)} className="block">
      <Card className="h-full hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-green-300 group cursor-pointer relative">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-green-700 transition-colors">
                {task.title}
              </h3>
              <CategoryBadge categoryId={task.category} />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${s.cls}`}>
                {t(`taskStatus.${task.status}`)}
              </span>
              {canShowFavoriteButton && (
                <button
                  onClick={toggleFavorite}
                  disabled={isTogglingFavorite}
                  className={`p-2 rounded-full transition-all duration-200 ${
                    isFavorited
                      ? "bg-red-50 text-red-500 hover:bg-red-100"
                      : "bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                  } ${isTogglingFavorite ? "opacity-50" : ""}`}
                  title={isFavorited ? t('taskCard.removeFromFavorites') : t('taskCard.addToFavorites')}
                >
                  <Heart
                    className={`w-4 h-4 transition-all ${
                      isFavorited ? "fill-current" : ""
                    }`}
                  />
                </button>
              )}
            </div>
          </div>

          <p className="text-gray-600 text-sm line-clamp-2 mb-3 leading-relaxed">
            {task.description}
          </p>

          <div className="flex flex-col gap-2.5 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <User className="w-3.5 h-3.5" />
              <span className="truncate">Posted by {postedBy}</span>
              <span>·</span>
              <span>{postedDate}</span>
            </div>
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
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                {Number.isFinite(taskBudget) ? (
                  <div className="font-bold text-green-700 text-base">
                    ETB {taskBudget}
                  </div>
                ) : null}
                {offerCount > 0 && (
                  <div className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-semibold">
                    {offerCount} offer{offerCount !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
