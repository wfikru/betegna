import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from '@/api/firebaseClient';
import { useAuth } from './AuthContext';
import { onSnapshot, query, collection, where, limit, orderBy } from 'firebase/firestore';

/** @type {React.Context<{unreadMessageCount: number}>} */
const MessageContext = createContext(null);

export const MessageProvider = ({ children }) => {
  const { user } = useAuth();
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [isPageVisible, setIsPageVisible] = useState(true);

  // Track page visibility to reduce unnecessary listeners
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Real-time listener for unread messages (only when page is visible)
  useEffect(() => {
    if (!user?.email || !isPageVisible) {
      setUnreadMessageCount(0);
      return;
    }

    // Subscribe to real-time updates for user's unread messages with limit to reduce reads
    const q = query(
      collection(db, 'messages'),
      where('recipient_email', '==', user.email),
      where('read', '==', false),
      limit(1000)  // Limit to 1000 unread messages (practical maximum)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadMessageCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [user?.email, isPageVisible]);

  return (
    <MessageContext.Provider
      value={{
        unreadMessageCount,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};
