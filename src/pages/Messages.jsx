import { useState, useEffect, useRef } from "react";
import { api } from "@/api/firebaseClient";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Send, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/lib/AuthContext";
import LoginModal from "@/components/LoginModal";

export default function Messages() {
  const navigate = useNavigate();
  const { user: authUser, isLoadingAuth } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (authUser) {
      loadData();
    } else {
      setUser(null);
      setConversations([]);
      setMessages([]);
      setSelectedConversation(null);
      setLoading(false);
    }
  }, [authUser]);

  // Auto-select conversation if taskId is provided in URL
  useEffect(() => {
    const taskId = searchParams.get('taskId');
    if (taskId && conversations.length > 0 && !selectedConversation) {
      const conv = conversations.find(c => c.task_id === taskId);
      if (conv) {
        selectConversation(conv);
      }
    }
  }, [searchParams, conversations]);

  useEffect(() => {
    if (selectedConversation) {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadData = async () => {
    setLoading(true);
    const u = await api.auth.me().catch(() => authUser);
    setUser(u);

    if (u) {
      // Get all assigned tasks where user is involved
      const allTasks = await api.entities.Task.filter({ status: "assigned" }, "-created_date", 50);
      const relevantTasks = allTasks.filter(task => 
        task.created_by === u.email || task.assigned_to === u.email
      );

      // Get all messages
      const sent = await api.entities.Message.filter({ sender_email: u.email }, "-created_date", 100);
      const received = await api.entities.Message.filter({ recipient_email: u.email }, "-created_date", 100);
      const allMessages = [...sent, ...received];

      // Build conversations from tasks and messages
      const conversationMap = new Map();

      // Add messages to conversation map and count unread
      allMessages.forEach((msg) => {
        const key = msg.task_id;
        const existingConv = conversationMap.get(key);
        
        // Count unread messages (messages sent to current user that aren't read)
        const isUnreadForUser = msg.recipient_email === u.email && !msg.read;
        
        if (!existingConv) {
          conversationMap.set(key, {
            task_id: msg.task_id,
            task_title: msg.task_title,
            last_message: msg.message,
            last_message_date: msg.created_date,
            other_email: msg.sender_email === u.email ? msg.recipient_email : msg.sender_email,
            other_name: msg.sender_email === u.email ? msg.recipient_name : msg.sender_name,
            unread_count: isUnreadForUser ? 1 : 0,
          });
        } else {
          // Update unread count
          if (isUnreadForUser) {
            existingConv.unread_count = (existingConv.unread_count || 0) + 1;
          }
          // Update last message if this one is newer
          if (new Date(msg.created_date) > new Date(existingConv.last_message_date)) {
            existingConv.last_message = msg.message;
            existingConv.last_message_date = msg.created_date;
          }
        }
      });

      // Add tasks that don't have messages yet
      relevantTasks.forEach((task) => {
        const key = task.id;
        if (!conversationMap.has(key)) {
          const otherEmail = task.created_by === u.email ? task.assigned_to : task.created_by;
          const otherName = task.created_by === u.email ? task.assigned_to_name : task.poster_name;
          conversationMap.set(key, {
            task_id: task.id,
            task_title: task.title,
            last_message: null,
            last_message_date: task.created_date,
            other_email: otherEmail,
            other_name: otherName,
            unread_count: 0,
          });
        }
      });

      const convArray = Array.from(conversationMap.values())
        .sort((a, b) => new Date(b.last_message_date) - new Date(a.last_message_date));
      
      setConversations(convArray);
    }
    setLoading(false);
  };

  const selectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    // Load messages for this conversation
    const sent = await api.entities.Message.filter({ 
      task_id: conversation.task_id,
      sender_email: user.email 
    }, "-created_date", 100);
    const received = await api.entities.Message.filter({ 
      task_id: conversation.task_id,
      recipient_email: user.email 
    }, "-created_date", 100);
    const allMsgs = [...sent, ...received].sort((a, b) => 
      new Date(a.created_date) - new Date(b.created_date)
    );
    setMessages(allMsgs);
    
    // Mark received messages as read
    const unreadMessages = received.filter(msg => !msg.read);
    for (const msg of unreadMessages) {
      try {
        await api.entities.Message.update(msg.id, { read: true });
      } catch (err) {
        console.warn("Error marking message as read:", err);
      }
    }
    
    // Update conversation unread count to 0
    setConversations(prev => 
      prev.map(c => 
        c.task_id === conversation.task_id 
          ? { ...c, unread_count: 0 }
          : c
      )
    );
    
    setMessageText("");
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation || !user) return;
    
    setSubmitting(true);
    
    await api.entities.Message.create({
      task_id: selectedConversation.task_id,
      task_title: selectedConversation.task_title,
      sender_email: user.email,
      sender_name: user.full_name || user.email,
      recipient_email: selectedConversation.other_email,
      recipient_name: selectedConversation.other_name,
      message: messageText,
      read: false,
    });
    
    setMessageText("");
    const updatedConv = conversations.find(c => c.task_id === selectedConversation.task_id);
    if (updatedConv) {
      selectConversation(updatedConv);
    }
    setSubmitting(false);
  };

  if (isLoadingAuth) {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Show login modal if user is not authenticated
  if (!authUser) {
    return (
      <LoginModal onCancel={() => navigate("/BrowseTasks")} />
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Full-screen chat view
  if (selectedConversation) {
    return (
      <div className="flex flex-col h-screen md:h-auto md:rounded-lg overflow-hidden bg-white">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-4">
          <button 
            onClick={() => setSelectedConversation(null)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <h1 className="text-lg font-bold text-gray-900">{selectedConversation.task_title}</h1>
          <p className="text-gray-500 text-xs mt-1">Chat with {selectedConversation.other_name}</p>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No messages yet. Start the conversation!</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender_email === user?.email ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-2xl ${
                      msg.sender_email === user?.email
                        ? "bg-green-700 text-white rounded-br-none"
                        : "bg-white text-gray-900 rounded-bl-none border border-gray-200"
                    }`}
                  >
                    <p className="text-sm break-words leading-relaxed">{msg.message}</p>
                    <p className={`text-xs mt-1.5 ${
                      msg.sender_email === user?.email ? "text-green-100" : "text-gray-500"
                    }`}>
                      {format(new Date(msg.created_date), "HH:mm")}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area - Fixed at bottom */}
        <form onSubmit={sendMessage} className="flex-shrink-0 w-full bg-white border-t border-gray-200 p-3 md:p-4">
          <div className="flex gap-2 items-end">
            <textarea
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
              rows={1}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent resize-none max-h-20 overflow-y-auto"
            />
            <button
              type="submit"
              disabled={submitting || !messageText.trim()}
              className="bg-green-700 hover:bg-green-800 disabled:bg-gray-300 text-white p-3 rounded-full transition flex items-center justify-center flex-shrink-0 h-11 w-11"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Conversation list view
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Messages</h1>
        <p className="text-gray-500 text-sm">Chat with people about your tasks</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-700" />
            <p className="text-sm text-gray-600">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {conversations.length === 0 ? (
          <div className="p-12 text-center">
            <div>
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No messages yet</p>
              <p className="text-gray-400 text-sm mt-1">Your conversations will appear here once offers are accepted</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {conversations.map((conv) => {
              const hasUnread = conv.unread_count > 0;
              return (
                <button
                  key={conv.task_id}
                  onClick={() => selectConversation(conv)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition active:bg-gray-100 relative ${
                    hasUnread ? "bg-green-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold truncate ${hasUnread ? "text-green-900" : "text-gray-900"}`}>
                          {conv.task_title}
                        </p>
                        {hasUnread && (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-green-700 rounded-full">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate mt-0.5">{conv.other_name}</p>
                      {conv.last_message && (
                        <p className={`text-sm truncate mt-2 line-clamp-2 ${
                          hasUnread ? "text-gray-900 font-medium" : "text-gray-500"
                        }`}>
                          {conv.last_message}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 whitespace-nowrap">
                      {format(new Date(conv.last_message_date), "MMM d")}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
