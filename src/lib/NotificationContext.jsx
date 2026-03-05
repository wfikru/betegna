import React, { createContext, useState, useContext, useEffect } from 'react';
import { api, db } from '@/api/firebaseClient';
import { useAuth } from './AuthContext';
import { onSnapshot, query, collection, where, limit, orderBy } from 'firebase/firestore';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);

  // Track page visibility to reduce unnecessary listeners
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Real-time listener for notifications (only when page is visible)
  useEffect(() => {
    if (!user?.email || !isPageVisible) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    
    // Subscribe to real-time updates for user's notifications with limits to reduce reads
    const q = query(
      collection(db, 'notifications'),
      where('recipient_email', '==', user.email),
      orderBy('created_date', 'desc'),
      limit(100)  // Limit to 100 most recent notifications
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }));
      
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.read).length);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.email, isPageVisible]);

  const markAsRead = async (notificationId) => {
    await api.entities.Notification.update(notificationId, { read: true });
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.read);
    for (const notif of unreadNotifications) {
      await api.entities.Notification.update(notif.id, { read: true });
    }
  };

  const deleteNotification = async (notificationId) => {
    // Note: You'll need to add a delete method to firebaseClient
    // For now, we can mark it as read and filter it out in UI
    await markAsRead(notificationId);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
