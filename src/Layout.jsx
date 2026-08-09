import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/AuthContext";
import { useNotifications } from "@/lib/NotificationContext";
import { useMessages } from "@/lib/MessageContext";
import { useTranslation } from "react-i18next";
import { api } from "@/api/firebaseClient";
import {
  List, ClipboardList, User, Menu, X, Bell, LogOut, MessageCircle
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
      paddingBottom: 'calc(64px + var(--safe-area-inset-bottom))'
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
              { label: "Browse", page: "BrowseTaskers", icon: List },
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
          <div className="flex items-center gap-1 lg:gap-2">
            {/* Language Toggle removed — translations disabled */}

            {user && (
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

                {/* Profile Section */}
                <div className="hidden md:flex items-center gap-2 pl-3 border-l border-gray-200">
                  <Link
                    to={createPageUrl("Profile")}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                      currentPageName === "Profile"
                        ? "bg-green-50 text-green-700"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold">
                      {(user.full_name || user.email || "?")[0].toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900 leading-tight">{user.full_name?.split(' ')[0] || 'User'}</p>
                      <p className="text-xs text-gray-500 leading-tight">{user.is_tasker ? 'Tasker' : 'Client'}</p>
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
              </>
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
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-2">
            {[
              { label: "Browse Taskers", page: "BrowseTaskers", icon: List },
              { label: "My Bookings",    page: "MyBookings",    icon: ClipboardList },
              { label: "Messages",       page: "Messages",      icon: MessageCircle },
              { label: "Profile",        page: "Profile",       icon: User },
            ].map(({ label, page, icon: Icon }) => {
              const active = currentPageName === page;
              const showBadge = page === "Messages" && unreadMessageCount > 0;
              return (
                <Link
                  key={page}
                  to={createPageUrl(page)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-colors relative ${
                    active
                      ? "bg-green-50 text-green-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {showBadge && (
                    <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                      {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                    </span>
                  )}
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
                {t('nav.logout')}
              </button>
            )}
          </div>
        )}
      </header>

      {/* Page Content */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Mobile Bottom Navigation - Native App Style */}
      <nav className="md:hidden fixed left-0 right-0 bg-white border-t border-gray-200/50 z-40" style={{
        bottom: 0,
        paddingBottom: 'var(--safe-area-inset-bottom)'
      }}>
          <div className="flex">
            {[
              { shortKey: "Explore",   page: "BrowseTaskers", icon: List },
              { shortKey: "Bookings",  page: "MyBookings",    icon: ClipboardList },
              { shortKey: "Messages",  page: "Messages",      icon: MessageCircle },
              { shortKey: "Profile",   page: "Profile",       icon: User },
            ].map(({ shortKey, page, icon: Icon }) => {
              const active = currentPageName === page;
              const showBadge = page === "Messages" && unreadMessageCount > 0;
              return (
                <Link
                  key={page}
                  to={createPageUrl(page)}
                  className={`flex-1 flex flex-col items-center justify-center py-2 gap-1 text-xs font-medium transition-colors relative min-h-[64px] ${
                    active ? "text-green-700" : "text-gray-500"
                  }`}
                >
                  <div className={`relative flex items-center justify-center w-12 h-7 rounded-full transition-colors ${
                    active ? "bg-green-100" : ""
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