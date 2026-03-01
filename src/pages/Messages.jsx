import { useState, useEffect, useRef } from "react";
import { api } from "@/api/firebaseClient";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Send, MessageCircle } from "lucide-react";
import { format } from "date-fns";

export default function Messages() {
  const navigate = useNavigate();
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
    loadData();
  }, []);

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
    const u = await api.auth.me().catch(() => null);
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

      // Add messages to conversation map
      allMessages.forEach((msg) => {
        const key = msg.task_id;
        if (!conversationMap.has(key)) {
          conversationMap.set(key, {
            task_id: msg.task_id,
            task_title: msg.task_title,
            last_message: msg.message,
            last_message_date: msg.created_date,
            other_email: msg.sender_email === u.email ? msg.recipient_email : msg.sender_email,
            other_name: msg.sender_email === u.email ? msg.recipient_name : msg.sender_name,
          });
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
      <div className="w-full flex flex-col px-2 py-2 h-[calc(100vh-140px)]">
        {/* Chat Container */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm flex flex-col flex-1 md:max-w-4xl md:mx-auto md:w-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-700 to-green-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedConversation(null)}
                className="text-white hover:bg-green-600 p-2 rounded-lg transition"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <p className="font-bold text-white text-lg">{selectedConversation.task_title}</p>
                <p className="text-green-100 text-sm">{selectedConversation.other_name}</p>
              </div>
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
                  <div
                    key={idx}
                    className={`flex ${msg.sender_email === user?.email ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-sm px-4 py-2 rounded-2xl ${
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

          {/* Input */}
          <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={submitting || !messageText.trim()}
                className="bg-green-700 hover:bg-green-800 disabled:bg-gray-300 text-white p-2.5 rounded-full transition flex items-center justify-center"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Conversation list view
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-5 h-5 text-green-700" />
            <h2 className="font-bold text-gray-900 text-lg">Messages</h2>
          </div>
          <p className="text-sm text-gray-500">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
        </div>

        {conversations.length === 0 ? (
          <div className="p-12 text-center">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No messages yet</p>
            <p className="text-gray-400 text-sm mt-1">Your conversations will appear here once offers are accepted</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {conversations.map((conv) => (
              <button
                key={conv.task_id}
                onClick={() => selectConversation(conv)}
                className="w-full text-left p-4 hover:bg-gray-50 transition active:bg-gray-100"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{conv.task_title}</p>
                    <p className="text-sm text-gray-600 truncate mt-0.5">{conv.other_name}</p>
                    {conv.last_message && (
                      <p className="text-sm text-gray-500 truncate mt-2 line-clamp-2">{conv.last_message}</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 whitespace-nowrap">
                    {format(new Date(conv.last_message_date), "MMM d")}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
