import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/AuthContext";
import { useNotifications } from "@/lib/NotificationContext";
import { useMessages } from "@/lib/MessageContext";
import { useTranslation } from "react-i18next";
import { api } from "@/api/firebaseClient";
import {
  List, ClipboardList, User, Menu, X, Bell, LogOut, MessageCircle, PlusCircle, Briefcase, Search, ShieldCheck
} from "lucide-react";
import Logo from "@/components/Logo";

export default function Layout({ children, currentPageName }) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { unreadMessageCount } = useMessages();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'am' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('betegna-language', newLang);
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col" style={{
      paddingBottom: 'calc(68px + var(--safe-area-inset-bottom))'
    }}>
      {/* Professional Header */}
      <header className="bg-white border-b border-gray-200/80 sticky top-0 z-40 shadow-sm" style={{ paddingTop: 'var(--safe-area-inset-top)' }}>
        <div className="w-full md:max-w-7xl md:mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-3 flex-shrink-0 hover:opacity-80 transition-opacity">
            <Logo size={44} />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {[
              { label: "Hire Taskers", page: "BrowseTaskers", icon: List },
              { label: "Open Tasks", page: "BrowseTasks", icon: Briefcase },
              { label: "My Bookings", page: "MyBookings", icon: ClipboardList },
              { label: "Messages", page: "Messages", icon: MessageCircle },
            ].map(({ label, page, icon: Icon }) => {
              const active = currentPageName === page;
              const showBadge = page === "Messages" && unreadMessageCount > 0;
              return (
                <Link
                  key={page}
                  to={createPageUrl(page)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all relative ${
                    active
                      ? "text-green-700 bg-green-50 border border-green-200"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                  {showBadge && (
                    <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                      {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Post a Task CTA Button (Desktop & Tablet) */}
            <Link
              to={createPageUrl("PostTask")}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-bold shadow-sm hover:shadow transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post a Task</span>
            </Link>

            {user ? (
              <>
                {/* Notifications Bell */}
                <button
                  onClick={() => navigate(createPageUrl("Notifications"))}
                  className="relative p-2.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Profile Section (Desktop) */}
                <div className="hidden md:flex items-center gap-2 pl-3 border-l border-gray-200">
                  <Link
                    to={createPageUrl("Profile")}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                      currentPageName === "Profile"
                        ? "bg-green-50 text-green-700"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      {(user.full_name || user.email || "?")[0].toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900 leading-tight">{user.full_name?.split(' ')[0] || 'User'}</p>
                      <p className="text-xs text-gray-500 leading-tight flex items-center gap-1">
                        {user.is_tasker ? 'Tasker' : 'Client'}
                        {user.is_verified && <ShieldCheck className="w-3 h-3 text-green-600" />}
                      </p>
                    </div>
                  </Link>
                  <button
                    className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    onClick={() => {
                      logout().then(() => navigate('/login'));
                    }}
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                {/* Profile Avatar Quick-Tap (Mobile only) */}
                <Link
                  to={createPageUrl("Profile")}
                  className="md:hidden flex items-center justify-center w-9 h-9 rounded-full bg-green-700 text-white text-xs font-bold shadow-sm"
                  title="Profile"
                >
                  {(user.full_name || user.email || "?")[0].toUpperCase()}
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-bold shadow-sm transition-all"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 shadow-lg">
            {[
              { label: "Hire Taskers", page: "BrowseTaskers", icon: List },
              { label: "Open Tasks",   page: "BrowseTasks",   icon: Briefcase },
              { label: "Post a Task",  page: "PostTask",      icon: PlusCircle },
              { label: "My Bookings",  page: "MyBookings",    icon: ClipboardList },
              { label: "Messages",     page: "Messages",      icon: MessageCircle },
              { label: "Profile",      page: "Profile",       icon: User },
            ].map(({ label, page, icon: Icon }) => {
              const active = currentPageName === page;
              const showBadge = page === "Messages" && unreadMessageCount > 0;
              return (
                <Link
                  key={page}
                  to={createPageUrl(page)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-colors relative ${
                    active
                      ? "bg-green-50 text-green-700 font-bold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                  {showBadge && (
                    <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                      {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                    </span>
                  )}
                </Link>
              );
            })}
            {user ? (
              <button
                onClick={() => {
                  logout().then(() => navigate('/login'));
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mt-2 text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Log out
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2 mt-2 border-t border-gray-100">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg bg-green-700 text-white text-sm font-bold"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Page Content */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Mobile Bottom Navigation - Native App Style */}
      <nav className="md:hidden fixed left-0 right-0 bg-white border-t border-gray-200/80 shadow-lg z-40" style={{
        bottom: 0,
        paddingBottom: 'var(--safe-area-inset-bottom)'
      }}>
        <div className="flex items-center justify-around">
          {[
            { shortKey: "Explore",  page: "BrowseTaskers", icon: List },
            { shortKey: "Tasks",    page: "BrowseTasks",   icon: Briefcase },
            { shortKey: "Post",     page: "PostTask",      icon: PlusCircle, isCenter: true },
            { shortKey: "Bookings", page: "MyBookings",    icon: ClipboardList },
            { shortKey: "Messages", page: "Messages",      icon: MessageCircle },
          ].map(({ shortKey, page, icon: Icon, isCenter }) => {
            const active = currentPageName === page;
            const showBadge = page === "Messages" && unreadMessageCount > 0;
            if (isCenter) {
              return (
                <Link
                  key={page}
                  to={createPageUrl(page)}
                  className="flex-1 flex flex-col items-center justify-center py-1 group"
                >
                  <div className="w-11 h-11 rounded-full bg-green-700 text-white flex items-center justify-center shadow-md -mt-3 group-hover:bg-green-800 transition-transform active:scale-95">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold text-green-700 mt-0.5">{shortKey}</span>
                </Link>
              );
            }

            return (
              <Link
                key={page}
                to={createPageUrl(page)}
                className={`flex-1 flex flex-col items-center justify-center py-2 gap-1 text-xs font-medium transition-colors relative min-h-[64px] ${
                  active ? "text-green-700" : "text-gray-500"
                }`}
              >
                <div className={`relative flex items-center justify-center w-11 h-7 rounded-full transition-colors ${
                  active ? "bg-green-100/80" : ""
                }`}>
                  <Icon className={`w-5 h-5 ${
                    active ? "text-green-700" : "text-gray-400"
                  }`} />
                  {showBadge && (
                    <span className="absolute -top-1.5 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-bold leading-none text-white bg-red-600 rounded-full min-w-[18px]">
                      {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-semibold tracking-[-0.01em] ${active ? "text-green-700" : "text-gray-400"}`}>{shortKey}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
