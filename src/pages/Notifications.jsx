import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/lib/NotificationContext";
import { useAppMode } from "@/lib/AppModeContext";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Bell, CheckCircle, AlertCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();
  const { isTaskerMode } = useAppMode();

  const getNotificationIcon = (type) => {
    switch (type) {
      case "offer_made":
        return (
          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <Bell className="w-4 h-4 text-emerald-700" />
          </div>
        );
      case "offer_accepted":
        return (
          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
        );
      case "offer_rejected":
        return (
          <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-red-600" />
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Bell className="w-4 h-4 text-gray-500" />
          </div>
        );
    }
  };

  const getNotificationColor = (type, read) => {
    if (read) return "bg-white border-gray-200/80";
    switch (type) {
      case "offer_made":
        return "bg-emerald-50/70 border-emerald-200";
      case "offer_accepted":
        return "bg-green-50/80 border-green-200";
      case "offer_rejected":
        return "bg-red-50/70 border-red-200";
      default:
        return "bg-green-50/50 border-green-200";
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.task_id) {
      navigate(createPageUrl("TaskDetail") + `?id=${notification.task_id}`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="h-8 w-32 bg-gray-100 animate-pulse rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-24 md:pb-6 ${isTaskerMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 dark:bg-slate-950"}`}>
      {/* Dual Theme Header */}
      {isTaskerMode ? (
        <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-teal-900 text-white py-10 border-b border-indigo-800/60">
          <div className="max-w-2xl mx-auto px-4">
            <h1 className="text-3xl font-black mb-1">Tasker Notifications</h1>
            <p className="text-indigo-200 text-base">Stay updated on incoming lead requests and quote acceptances</p>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white py-10">
          <div className="max-w-2xl mx-auto px-4">
            <h1 className="text-3xl font-black mb-1">Notifications</h1>
            <p className="text-slate-200 text-base">Stay updated on your home projects and quotes</p>
          </div>
        </div>
      )}

    <div className="max-w-2xl mx-auto px-4 py-6">

      {notifications.length > 0 && (
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="text-xs"
          >
            Mark all as read
          </Button>
        </div>
      )}

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400">No notifications yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`border cursor-pointer transition-all hover:shadow-md ${
                getNotificationColor(notification.type, notification.read)
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="p-4">
                <div className="flex gap-3 items-start">
                  <div className="pt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        {notification.task_title && (
                          <p className="text-xs text-gray-500 mt-2">
                            Task: <span className="font-medium">{notification.task_title}</span>
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          {format(
                            new Date(notification.created_date),
                            "MMM d, yyyy · h:mm a"
                          )}
                        </p>
                      </div>

                      {!notification.read && (
                        <Badge className="flex-shrink-0 bg-green-700 hover:bg-green-800 text-white text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
