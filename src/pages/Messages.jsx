import { useState, useEffect, useRef } from "react";
import { api } from "@/api/firebaseClient";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Send, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/AuthContext";
import { taskCategories } from "@/components/shared/CategoryBadge";
import { createPageUrl } from "@/utils";

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

  // Auto-select conversation if bookingId is in URL
  useEffect(() => {
    const bookingId = searchParams.get("bookingId");
    if (bookingId && conversations.length > 0 && !selectedConversation) {
      const conv = conversations.find(c => c.booking_id === bookingId);
      if (conv) selectConversation(conv);
    }
  }, [searchParams, conversations]);

  useEffect(() => {
    if (selectedConversation) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const loadData = async () => {
    setLoading(true);
    const u = await api.auth.me().catch(() => authUser);
    setUser(u);

    if (u) {
      // Load all bookings where user is client or tasker (two queries)
      const [asClient, asTasker] = await Promise.all([
        api.entities.Booking.filter({ client_email: u.email }, "-created_date", 50),
        api.entities.Booking.filter({ tasker_email: u.email }, "-created_date", 50),
      ]);
      const allBookings = [...asClient, ...asTasker].filter(
        (b, i, arr) => arr.findIndex(x => x.id === b.id) === i // deduplicate
      );

      // Load all messages
      const [sent, received] = await Promise.all([
        api.entities.Message.filter({ sender_email: u.email }, "-created_date", 200),
        api.entities.Message.filter({ recipient_email: u.email }, "-created_date", 200),
      ]);
      const allMessages = [...sent, ...received];

      // Build conversations from bookings
      const convMap = new Map();

      // Seed from bookings
      allBookings.forEach(b => {
        const otherEmail = b.client_email === u.email ? b.tasker_email : b.client_email;
        const otherName = b.client_email === u.email ? b.tasker_name : b.client_name;
        const cat = taskCategories.find(c => c.id === b.service_type);
        convMap.set(b.id, {
          booking_id: b.id,
          title: cat?.nameEn || b.service_type,
          other_email: otherEmail,
          other_name: otherName,
          last_message: null,
          last_message_date: b.created_date,
          unread_count: 0,
          booking_status: b.status,
        });
      });

      // Layer in messages
      allMessages.forEach(msg => {
        const key = msg.booking_id;
        if (!key || !convMap.has(key)) return;
        const conv = convMap.get(key);
        const isUnread = msg.recipient_email === u.email && !msg.read;
        if (isUnread) conv.unread_count = (conv.unread_count || 0) + 1;
        if (!conv.last_message_date || new Date(msg.created_date) > new Date(conv.last_message_date)) {
          conv.last_message = msg.message;
          conv.last_message_date = msg.created_date;
        }
      });

      const sorted = Array.from(convMap.values())
        .sort((a, b) => new Date(b.last_message_date) - new Date(a.last_message_date));
      setConversations(sorted);
    }
    setLoading(false);
  };

  const selectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    const [sent, received] = await Promise.all([
      api.entities.Message.filter({ booking_id: conversation.booking_id, sender_email: user.email }, "-created_date", 200),
      api.entities.Message.filter({ booking_id: conversation.booking_id, recipient_email: user.email }, "-created_date", 200),
    ]);
    const sorted = [...sent, ...received].sort((a, b) =>
      new Date(a.created_date) - new Date(b.created_date)
    );
    setMessages(sorted);

    // Mark received as read
    for (const msg of received.filter(m => !m.read)) {
      api.entities.Message.update(msg.id, { read: true }).catch(() => {});
    }
    setConversations(prev =>
      prev.map(c => c.booking_id === conversation.booking_id ? { ...c, unread_count: 0 } : c)
    );
    setMessageText("");
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation || !user) return;
    setSubmitting(true);
    await api.entities.Message.create({
      booking_id: selectedConversation.booking_id,
      sender_email: user.email,
      sender_name: user.full_name || user.email,
      recipient_email: selectedConversation.other_email,
      recipient_name: selectedConversation.other_name,
      message: messageText.trim(),
      read: false,
    });
    setMessageText("");
    const conv = conversations.find(c => c.booking_id === selectedConversation.booking_id);
    if (conv) selectConversation(conv);
    setSubmitting(false);
  };

  if (isLoadingAuth) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  if (!authUser) {
    navigate("/login");
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  // Full-screen chat view
  if (selectedConversation) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden bg-white">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-4">
          <button
            onClick={() => setSelectedConversation(null)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold text-gray-900">{selectedConversation.title}</h1>
              <p className="text-gray-500 text-xs mt-0.5">with {selectedConversation.other_name}</p>
            </div>
            <button
              onClick={() => navigate(createPageUrl(`BookingDetail?id=${selectedConversation.booking_id}`))}
              className="text-xs text-green-700 font-semibold hover:underline flex-shrink-0"
            >
              View Booking
            </button>
          </div>
        </div>

        {/* Messages */}
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
                <div key={idx} className={`flex ${msg.sender_email === user?.email ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-2xl ${
                    msg.sender_email === user?.email
                      ? "bg-green-700 text-white rounded-br-none"
                      : "bg-white text-gray-900 rounded-bl-none border border-gray-200"
                  }`}>
                    <p className="text-sm break-words leading-relaxed">{msg.message}</p>
                    <p className={`text-xs mt-1.5 ${msg.sender_email === user?.email ? "text-green-100" : "text-gray-400"}`}>
                      {format(new Date(msg.created_date), "HH:mm")}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="flex-shrink-0 w-full bg-white border-t border-gray-200 p-3 md:p-4">
          <div className="flex gap-2 items-end">
            <textarea
              placeholder="Type a message…"
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }}
              rows={1}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-700 resize-none max-h-20 overflow-y-auto"
            />
            <button
              type="submit"
              disabled={submitting || !messageText.trim()}
              className="bg-green-700 hover:bg-green-800 disabled:bg-gray-300 text-white p-3 rounded-full transition flex-shrink-0 h-11 w-11 flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Conversation list
  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
      <div className="bg-gradient-to-r from-green-700 to-green-600 text-white py-10">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl font-extrabold mb-1">Messages</h1>
          <p className="text-green-100">Chat about your bookings</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {conversations.length === 0 ? (
            <div className="p-12 text-center">
              <MessageCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="font-bold text-gray-900 mb-1">No messages yet</p>
              <p className="text-sm text-gray-400">Conversations appear once a booking is accepted</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {conversations.map(conv => {
                const hasUnread = conv.unread_count > 0;
                return (
                  <button
                    key={conv.booking_id}
                    onClick={() => selectConversation(conv)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition relative ${hasUnread ? "bg-green-50/50" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className={`w-11 h-11 shrink-0 ${hasUnread ? "" : ""}`}>
                        <AvatarFallback name={conv.other_name} className={`${hasUnread ? "bg-green-700 text-white" : "bg-gray-200 text-gray-600"} text-sm font-bold`} />
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`font-bold truncate text-sm ${hasUnread ? "text-green-900" : "text-gray-900"}`}>
                            {conv.title}
                          </p>
                          <p className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                            {format(new Date(conv.last_message_date), "MMM d")}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className="text-xs text-gray-500 truncate">{conv.other_name}</p>
                          {hasUnread && (
                            <span className="w-5 h-5 text-[10px] font-bold text-white bg-green-700 rounded-full flex items-center justify-center shrink-0">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                        {conv.last_message && (
                          <p className={`text-sm truncate mt-0.5 ${hasUnread ? "text-gray-800 font-medium" : "text-gray-400"}`}>
                            {conv.last_message}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
