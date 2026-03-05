import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/lib/NotificationContext";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Bell, CheckCircle, AlertCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();

  const getNotificationIcon = (type) => {
    switch (type) {
      case "offer_made":
        return <Bell className="w-4 h-4 text-blue-600" />;
      case "offer_accepted":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "offer_rejected":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getNotificationColor = (type, read) => {
    if (read) return "bg-gray-50";
    switch (type) {
      case "offer_made":
        return "bg-blue-50";
      case "offer_accepted":
        return "bg-green-50";
      case "offer_rejected":
        return "bg-red-50";
      default:
        return "bg-gray-50";
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
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Notifications</h1>
        <p className="text-gray-500 text-sm">Stay updated on your tasks and offers</p>
      </div>

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
                <div className="flex gap-4">
                  <div className="flex-shrink-0 pt-1">
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
                        <Badge className="flex-shrink-0 bg-blue-600 text-white text-xs">
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
  );
}
