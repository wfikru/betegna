import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/AuthContext";
import { useNotifications } from "@/lib/NotificationContext";
import {
  PlusCircle, List, ClipboardList, User, Menu, X, Bell, LogOut, MessageCircle
} from "lucide-react";

const navItems = [
  { label: "Browse Tasks", page: "BrowseTasks", icon: List },
  { label: "My Tasks", page: "MyTasks", icon: ClipboardList },
  { label: "Post Task", page: "PostTask", icon: PlusCircle },
  { label: "Messages", page: "Messages", icon: MessageCircle },
  { label: "Profile", page: "Profile", icon: User },
];

export default function Layout({ children, currentPageName }) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Home page gets full layout without standard padding
  const isHomePage = currentPageName === "Home";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Nav */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to={createPageUrl("Home")} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">Betegna</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ label, page, icon: Icon }) => {
              const active = currentPageName === page;
              return (
                <Link
                  key={page}
                  to={createPageUrl(page)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-green-50 text-green-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {user && (
              <>
                {/* Notifications Bell */}
                <button
                  onClick={() => navigate(createPageUrl("Notifications"))}
                  className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                <span className="hidden md:block text-sm text-gray-500">{user.full_name || user.email}</span>
                <button
                  className="hidden md:inline-flex p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                  onClick={() => {
                    logout().then(() => navigate('/login'));
                  }}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            )}
            <button
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-2">
            {navItems.map(({ label, page, icon: Icon }) => {
              const active = currentPageName === page;
              return (
                <Link
                  key={page}
                  to={createPageUrl(page)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-colors ${
                    active
                      ? "bg-green-50 text-green-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
            {user && (
              <button
                onClick={() => {
                  logout().then(() => navigate('/login'));
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium mt-2 text-gray-600 hover:bg-gray-50"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            )}
          </div>
        )}
      </header>

      {/* Page Content */}
      <main className={isHomePage ? "flex-1" : "flex-1"}>
        {children}
      </main>

      {/* Mobile Bottom Nav - Hide on Home page */}
      {!isHomePage && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40">
          <div className="flex">
            {navItems.map(({ label, page, icon: Icon }) => {
              const active = currentPageName === page;
              return (
                <Link
                  key={page}
                  to={createPageUrl(page)}
                  className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors ${
                    active ? "text-green-700" : "text-gray-500"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? "text-green-700" : "text-gray-400"}`} />
                  <span className="text-[10px]">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}