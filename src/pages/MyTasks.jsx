import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MapPin, Clock, ChevronRight, ClipboardList } from "lucide-react";
import CategoryBadge from "@/components/shared/CategoryBadge";
import { format } from "date-fns";

const statusLabel = {
  open: { text: "Open", cls: "bg-green-100 text-green-700" },
  assigned: { text: "Assigned", cls: "bg-blue-100 text-blue-700" },
  in_progress: { text: "In Progress", cls: "bg-yellow-100 text-yellow-700" },
  completed: { text: "Completed", cls: "bg-gray-100 text-gray-600" },
  cancelled: { text: "Cancelled", cls: "bg-red-100 text-red-500" },
};

function TaskCard({ task }) {
  const s = statusLabel[task.status] || statusLabel.open;
  return (
    <Link to={createPageUrl(`TaskDetail?id=${task.id}`)}>
      <Card className="hover:shadow-md transition-shadow border border-gray-100 cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-semibold text-gray-900 truncate">{task.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.text}</span>
              </div>
              <CategoryBadge categoryId={task.category} />
              <div className="flex items-center gap-3 text-xs text-gray-400 mt-2 flex-wrap">
                {task.location && (
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{task.location}</span>
                )}
                {task.date_needed && (
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(task.date_needed), "MMM d")}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              {task.budget_max && (
                <span className="font-bold text-green-700 text-sm">ETB {task.budget_max}</span>
              )}
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function MyTasks() {
  const [myPosted, setMyPosted] = useState([]);
  const [myOffers, setMyOffers] = useState([]);
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
      base44.entities.Task.filter({ created_by: u.email }, "-created_date", 30),
      base44.entities.TaskOffer.filter({ tasker_email: u.email }, "-created_date", 30),
    ]);
    setMyPosted(posted);
    setMyOffers(offers);

    // Fetch tasks for the offers
    if (offers.length > 0) {
      const taskIds = [...new Set(offers.map((o) => o.task_id))];
      const tasks = await Promise.all(taskIds.map((id) => base44.entities.Task.filter({ id }, "", 1)));
      setOfferTasks(tasks.flat());
    }
    setLoading(false);
  };

  const getOfferTask = (taskId) => offerTasks.find((t) => t.id === taskId);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">My Tasks</h1>
        <p className="text-gray-500 text-sm">Track tasks you've posted or offered on</p>
      </div>

      <Tabs defaultValue="posted">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="posted" className="flex-1">Posted ({myPosted.length})</TabsTrigger>
          <TabsTrigger value="offers" className="flex-1">My Offers ({myOffers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="posted">
          {myPosted.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No tasks posted yet</p>
              <Link to={createPageUrl("PostTask")} className="text-green-600 text-sm mt-1 inline-block hover:underline">Post your first task →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myPosted.map((t) => <TaskCard key={t.id} task={t} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="offers">
          {myOffers.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No offers made yet</p>
              <Link to={createPageUrl("BrowseTasks")} className="text-green-600 text-sm mt-1 inline-block hover:underline">Browse tasks →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myOffers.map((offer) => {
                const task = getOfferTask(offer.task_id);
                const offerStatus = {
                  pending: { text: "Pending", cls: "bg-yellow-100 text-yellow-700" },
                  accepted: { text: "Accepted", cls: "bg-green-100 text-green-700" },
                  rejected: { text: "Rejected", cls: "bg-red-100 text-red-500" },
                  withdrawn: { text: "Withdrawn", cls: "bg-gray-100 text-gray-500" },
                }[offer.status] || { text: offer.status, cls: "bg-gray-100 text-gray-500" };

                return (
                  <Link key={offer.id} to={createPageUrl(`TaskDetail?id=${offer.task_id}`)}>
                    <Card className="hover:shadow-md transition-shadow border border-gray-100 cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-gray-900">{task?.title || offer.task_title || "Task"}</p>
                            <p className="text-sm text-gray-500 mt-0.5">Your offer: <span className="font-medium text-gray-700">ETB {offer.price}</span></p>
                            {offer.message && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{offer.message}</p>}
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${offerStatus.cls}`}>{offerStatus.text}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}