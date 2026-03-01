import React, { createContext, useState, useContext, useEffect } from 'react';
import { api, db } from '@/api/firebaseClient';
import { useAuth } from './AuthContext';
import { onSnapshot, query, collection, where } from 'firebase/firestore';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Real-time listener for notifications
  useEffect(() => {
    if (!user?.email) return;

    setLoading(true);
    
    // Subscribe to real-time updates for user's notifications
    const q = query(
      collection(db, 'notifications'),
      where('recipient_email', '==', user.email)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.read).length);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.email]);

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
