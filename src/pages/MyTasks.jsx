import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/api/firebaseClient";
import { createPageUrl } from "@/utils";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MapPin, Clock, ChevronRight, ClipboardList, ArrowRight, AlertCircle } from "lucide-react";
import CategoryBadge from "@/components/shared/CategoryBadge";
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

function TaskCard({ task }) {
  const s = statusLabel[task.status] || statusLabel.open;
  return (
    <Link to={createPageUrl(`TaskDetail?id=${task.id}`)}>
      <Card className="h-full hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-green-300 group cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-green-700 transition-colors">{task.title}</h3>
              <CategoryBadge categoryId={task.category} />
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ${s.cls}`}>{s.text}</span>
          </div>

          <p className="text-gray-600 text-sm line-clamp-2 mb-3 leading-relaxed">{task.description}</p>

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
            <div className="flex items-center justify-between pt-2">
              {task.budget_max ? (
                <div className="font-bold text-green-700 text-base">ETB {task.budget_max}</div>
              ) : null}
              <ChevronRight className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function OfferCard({ offer, task }) {
  const s = offerStatusLabel[offer.status] || offerStatusLabel.pending;
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
            {offer.message && (
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{offer.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <span className="text-xs text-gray-500">Posted {format(new Date(offer.created_date), "MMM d, yyyy")}</span>
            <ChevronRight className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function MyTasks() {
  const navigate = useNavigate();
  /** @type {[import("../types/entities").Task[], Function]} */
  const [myPosted, setMyPosted] = useState([]);
  /** @type {[import("../types/entities").TaskOffer[], Function]} */
  const [myOffers, setMyOffers] = useState([]);
  /** @type {[import("../types/entities").Task[], Function]} */
  const [offerTasks, setOfferTasks] = useState([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    if (!user) {
      setMyPosted([]);
      setMyOffers([]);
      setOfferTasks([]);
      setLoading(false);
      return;
    }
    const u = user;
    const [posted, offers] = await Promise.all([
      api.entities.Task.filter({ created_by: u.email }, "-created_date", 30),
      api.entities.TaskOffer.filter({ tasker_email: u.email }, "-created_date", 30),
    ]);
    setMyPosted(posted);
    setMyOffers(offers);

    // Fetch tasks for the offers
    if (offers.length > 0) {
      const taskIds = [...new Set(offers.map((o) => o.task_id))];
      const tasks = await Promise.all(taskIds.map((id) => api.entities.Task.filter({ id }, "", 1)));
      setOfferTasks(tasks.flat());
    }
    setLoading(false);
  };

  const getOfferTask = (taskId) => offerTasks.find((t) => t.id === taskId);

  if (!user) {
    return <LoginModal onCancel={() => navigate("/")} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-green-700 to-green-600 text-white py-12">
          <div className="max-w-6xl mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">My Tasks</h1>
            <p className="text-green-50 text-lg">Track tasks you've posted or offered on</p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-white animate-pulse rounded-xl shadow" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-green-700 to-green-600 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">My Tasks</h1>
          <p className="text-green-50 text-lg">Track tasks you've posted or offered on</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 pb-24 md:pb-8">
        <Tabs defaultValue="posted" className="w-full">
          <TabsList className="w-full mb-8 grid w-full grid-cols-2">
            <TabsTrigger value="posted" className="text-base font-semibold">
              Tasks Posted ({myPosted.length})
            </TabsTrigger>
            <TabsTrigger value="offers" className="text-base font-semibold">
              My Offers ({myOffers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posted">
            {myPosted.length === 0 ? (
              <Card className="shadow-lg border-0">
                <CardContent className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <ClipboardList className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-semibold text-gray-900 mb-2">No tasks posted yet</p>
                  <p className="text-gray-600 mb-6">Start by posting a task to get offers from skilled taskers</p>
                  <Button 
                    className="bg-green-700 hover:bg-green-800 text-white"
                    onClick={() => navigate(createPageUrl("PostTask"))}
                  >
                    Post Your First Task
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-5">
                {myPosted.map((t) => (
                  <TaskCard key={t.id} task={t} />
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
                  <p className="text-lg font-semibold text-gray-900 mb-2">No offers made yet</p>
                  <p className="text-gray-600 mb-6">Browse available tasks and make offers to start earning money</p>
                  <Button 
                    className="bg-green-700 hover:bg-green-800 text-white"
                    onClick={() => navigate(createPageUrl("BrowseTasks"))}
                  >
                    Browse Tasks
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
        </Tabs>
      </div>
    </div>
  );
}