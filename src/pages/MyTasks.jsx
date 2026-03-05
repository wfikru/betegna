import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/api/firebaseClient";
import { createPageUrl } from "@/utils";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MapPin, Clock, ChevronRight, ClipboardList, ArrowRight, AlertCircle, Heart, User } from "lucide-react";
import CategoryBadge from "@/components/shared/CategoryBadge";
import TaskCard from "@/components/shared/TaskCard";
import { format } from "date-fns";
import LoginModal from "@/components/LoginModal";

const statusLabel = {
  open: { text: "Open", cls: "bg-green-100 text-green-700" },
  assigned: { text: "Assigned", cls: "bg-blue-100 text-blue-700" },
  in_progress: { text: "In Progress", cls: "bg-yellow-100 text-yellow-700" },
  completed: { text: "Completed", cls: "bg-gray-100 text-gray-600" },
  cancelled: { text: "Cancelled", cls: "bg-red-100 text-red-500" },
};

const offerStatusLabel = {
  pending: { text: "Pending", cls: "bg-yellow-100 text-yellow-700" },
  accepted: { text: "Accepted", cls: "bg-green-100 text-green-700" },
  rejected: { text: "Rejected", cls: "bg-red-100 text-red-500" },
  withdrawn: { text: "Withdrawn", cls: "bg-gray-100 text-gray-500" },
};

function OfferCard({ offer, task }) {
  const s = offerStatusLabel[offer.status] || offerStatusLabel.pending;
  const postedBy = task?.poster_name || task?.created_by || "Anonymous";
  const postedDateValue = task?.created_date || offer.created_date;
  const postedDate = postedDateValue ? format(new Date(postedDateValue), "MMM d, yyyy") : "-";
  const offerSubmittedDate = offer.created_date ? format(new Date(offer.created_date), "MMM d, yyyy") : "-";
  return (
    <Link to={createPageUrl(`TaskDetail?id=${offer.task_id}`)}>
      <Card className="h-full hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-green-300 group cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-gray-900 line-clamp-2 group-hover:text-green-700 transition-colors">{task?.title || offer.task_title || "Task"}</h3>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ${s.cls}`}>{s.text}</span>
          </div>

          <div className="space-y-2 mb-4">
            <p className="text-sm text-gray-600">
              Your offer: <span className="font-bold text-green-700 text-base">ETB {offer.price}</span>
            </p>
            {offer.estimated_hours ? (
              <p className="text-xs text-gray-500">Estimated time: {offer.estimated_hours}h</p>
            ) : null}
            <p className="text-xs text-gray-500">Submitted: {offerSubmittedDate}</p>
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
              {offer.message || "No message added"}
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <User className="w-3.5 h-3.5" />
              <span className="truncate">Posted by {postedBy}</span>
              <span>·</span>
              <span>{postedDate}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function MyTasks() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  /** @type {[import("../types/entities").Task[], Function]} */
  const [myPosted, setMyPosted] = useState([]);
  /** @type {[import("../types/entities").TaskOffer[], Function]} */
  const [myOffers, setMyOffers] = useState([]);
  /** @type {[import("../types/entities").Task[], Function]} */
  const [offerTasks, setOfferTasks] = useState([]);
  /** @type {[import("../types/entities").Task[], Function]} */
  const [favoriteTasks, setFavoriteTasks] = useState([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [offersReceivedByTask, setOffersReceivedByTask] = useState({});

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    if (!user) {
      setMyPosted([]);
      setMyOffers([]);
      setOfferTasks([]);
      setFavoriteTasks([]);
      setLoading(false);
      return;
    }
    const u = user;
    const [posted, offers, favorites] = await Promise.all([
      api.entities.Task.filter({ created_by: u.email }, "-created_date", 30),
      api.entities.TaskOffer.filter({ tasker_email: u.email }, "-created_date", 30),
      api.entities.Favorite.filter({ user_email: u.email }, "-created_date", 50),
    ]);
    setMyPosted(posted);
    setMyOffers(offers);

    // Fetch all offers for posted tasks
    if (posted.length > 0) {
      const postedTaskIds = posted.map((t) => t.id);
      const allOffers = await api.entities.TaskOffer.filter({ status: "pending" }, "-created_date", 100);
      const offersMap = {};
      postedTaskIds.forEach((taskId) => {
        offersMap[taskId] = allOffers.filter((o) => o.task_id === taskId).length;
      });
      setOffersReceivedByTask(offersMap);
    }

    // Fetch tasks for the offers
    if (offers.length > 0) {
      const taskIds = [...new Set(offers.map((o) => o.task_id))];
      const tasks = await Promise.all(taskIds.map((id) => api.entities.Task.filter({ id }, "", 1)));
      setOfferTasks(tasks.flat());
    }

    // Fetch tasks for the favorites
    if (favorites.length > 0) {
      const favoriteTaskIds = [...new Set(favorites.map((f) => f.task_id))];
      const favTasks = await Promise.all(favoriteTaskIds.map((id) => api.entities.Task.filter({ id }, "", 1)));
      setFavoriteTasks(favTasks.flat());
    }
    setLoading(false);
  };

  const getOfferCount = (taskId) => offersReceivedByTask[taskId] || 0;

  const getOfferTask = (taskId) => offerTasks.find((t) => t.id === taskId);

  if (!user) {
    return <LoginModal onCancel={() => navigate("/BrowseTasks")} />;
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-8">
        <div className="mb-6">
          <div className="h-8 w-48 bg-gray-100 animate-pulse rounded mb-2" />
          <div className="h-4 w-64 bg-gray-100 animate-pulse rounded" />
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('myTasks.title')}</h1>
        <p className="text-gray-500 text-sm">{t('myTasks.subtitle')}</p>
      </div>

      <div>
        <Tabs defaultValue="posted" className="w-full">
          <TabsList className="mb-8 inline-flex h-auto w-full justify-start overflow-x-auto md:w-full md:grid md:grid-cols-3">
            <TabsTrigger value="posted" className="text-sm md:text-base font-semibold whitespace-nowrap">
              <ClipboardList className="w-4 h-4 mr-1.5 md:hidden" />
              <span className="hidden md:inline">{t('myTasks.tabs.posted')}</span>
              <span className="md:hidden">{t('myTasks.tabs.postedShort')}</span>
              <span className="ml-1">({myPosted.length})</span>
            </TabsTrigger>
            <TabsTrigger value="offers" className="text-sm md:text-base font-semibold whitespace-nowrap">
              <ArrowRight className="w-4 h-4 mr-1.5 md:hidden" />
              <span className="hidden md:inline">{t('myTasks.tabs.offers')}</span>
              <span className="md:hidden">{t('myTasks.tabs.offersShort')}</span>
              <span className="ml-1">({myOffers.length})</span>
            </TabsTrigger>
            <TabsTrigger value="favorites" className="text-sm md:text-base font-semibold whitespace-nowrap">
              <Heart className="w-4 h-4 mr-1.5" />
              <span className="hidden md:inline">{t('myTasks.tabs.favorites')}</span>
              <span className="md:hidden">{t('myTasks.tabs.favoritesShort')}</span>
              <span className="ml-1">({favoriteTasks.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posted">
            {myPosted.length === 0 ? (
              <Card className="shadow-lg border-0">
                <CardContent className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <ClipboardList className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-semibold text-gray-900 mb-2">{t('myTasks.noPostedTasks.title')}</p>
                  <p className="text-gray-600 mb-6">{t('myTasks.noPostedTasks.message')}</p>
                  <Button 
                    className="bg-green-700 hover:bg-green-800 text-white"
                    onClick={() => navigate(createPageUrl("PostTask"))}
                  >
                    {t('myTasks.noPostedTasks.button')}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-5">
                {myPosted.map((t) => (
                  <TaskCard key={t.id} task={t} showFavoriteButton={false} offerCount={getOfferCount(t.id)} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="offers">
            {myOffers.length === 0 ? (
              <Card className="shadow-lg border-0">
                <CardContent className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <ClipboardList className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-semibold text-gray-900 mb-2">{t('myTasks.noOffers.title')}</p>
                  <p className="text-gray-600 mb-6">{t('myTasks.noOffers.message')}</p>
                  <Button 
                    className="bg-green-700 hover:bg-green-800 text-white"
                    onClick={() => navigate(createPageUrl("BrowseTasks"))}
                  >
                    {t('myTasks.noOffers.button')}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-5">
                {myOffers.map((offer) => {
                  const task = getOfferTask(offer.task_id);
                  return (
                    <OfferCard key={offer.id} offer={offer} task={task} />
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites">
            {favoriteTasks.length === 0 ? (
              <Card className="shadow-lg border-0">
                <CardContent className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Heart className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-semibold text-gray-900 mb-2">{t('myTasks.noFavorites.title')}</p>
                  <p className="text-gray-600 mb-6">{t('myTasks.noFavorites.message')}</p>
                  <Button 
                    className="bg-green-700 hover:bg-green-800 text-white"
                    onClick={() => navigate(createPageUrl("BrowseTasks"))}
                  >
                    {t('myTasks.noFavorites.button')}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-5">
                {favoriteTasks.map((t) => (
                  <TaskCard 
                    key={t.id} 
                    task={t} 
                    showFavoriteButton={true}
                    onFavoriteChange={(taskId, isFavorited) => {
                      if (!isFavorited) {
                        // Remove from favorites list when unfavorited
                        setFavoriteTasks(prev => prev.filter(task => task.id !== taskId));
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}