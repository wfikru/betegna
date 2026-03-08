import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/AuthContext";
import { useNotifications } from "@/lib/NotificationContext";
import { useMessages } from "@/lib/MessageContext";
import { useTranslation } from "react-i18next";
import { api } from "@/api/firebaseClient";
import {
  PlusCircle, List, ClipboardList, User, Menu, X, Bell, LogOut, MessageCircle, Languages
} from "lucide-react";



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

  // Home page gets full layout without standard padding
  const isHomePage = currentPageName === "Home";

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col" style={{
      paddingBottom: isHomePage ? '0' : 'calc(64px + var(--safe-area-inset-bottom))'
    }}>
      {/* Professional Header */}
      <header className="bg-white border-b border-gray-200/80 sticky top-0 z-40 shadow-sm" style={{ paddingTop: 'var(--safe-area-inset-top)' }}>
        <div className="w-full md:max-w-7xl md:mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo Section */}
          <Link to={createPageUrl("Home")} className="flex items-center gap-3 flex-shrink-0 hover:opacity-80 transition-opacity">
            <div className="w-11 h-11 relative">
              <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
                {/* Background circle gradient - warm greens */}
                <defs>
                  <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#16a34a" />
                    <stop offset="100%" stopColor="#15803d" />
                  </linearGradient>
                </defs>
                <circle cx="18" cy="18" r="16" fill="url(#logoGradient)" />
                
                {/* Home icon - roof */}
                <path d="M 10 20 L 18 12 L 26 20" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                
                {/* Home icon - walls */}
                <rect x="11" y="20" width="14" height="9" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                
                {/* Door/window */}
                <rect x="16" y="21" width="4" height="5" stroke="white" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                
                {/* Connected people around the house - representing community and familiarity */}
                {/* Person top-left */}
                <circle cx="8" cy="10" r="1.5" fill="white" />
                <line x1="8" y1="11.5" x2="8" y2="14" stroke="white" strokeWidth="1" strokeLinecap="round" />
                
                {/* Person top-right */}
                <circle cx="28" cy="10" r="1.5" fill="white" />
                <line x1="28" y1="11.5" x2="28" y2="14" stroke="white" strokeWidth="1" strokeLinecap="round" />
                
                {/* Person bottom-left */}
                <circle cx="6" cy="26" r="1.5" fill="white" />
                <line x1="6" y1="27.5" x2="6" y2="30" stroke="white" strokeWidth="1" strokeLinecap="round" />
                
                {/* Person bottom-right */}
                <circle cx="30" cy="26" r="1.5" fill="white" />
                <line x1="30" y1="27.5" x2="30" y2="30" stroke="white" strokeWidth="1" strokeLinecap="round" />
                
                {/* Connection lines - showing community bonds */}
                <line x1="9" y1="14" x2="16" y2="19" stroke="white" strokeWidth="0.8" opacity="0.7" strokeLinecap="round" />
                <line x1="27" y1="14" x2="20" y2="19" stroke="white" strokeWidth="0.8" opacity="0.7" strokeLinecap="round" />
                <line x1="7" y1="27" x2="14" y2="21" stroke="white" strokeWidth="0.8" opacity="0.7" strokeLinecap="round" />
                <line x1="29" y1="27" x2="22" y2="21" stroke="white" strokeWidth="0.8" opacity="0.7" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold tracking-[-0.02em] text-gray-900 text-sm sm:text-lg">Betegna</span>
              <span className="font-semibold tracking-[-0.01em] text-gray-600 text-xs">ቤተኛ</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {[
              { labelKey: "nav.browseTasks", page: "BrowseTasks", icon: List },
              { labelKey: "nav.myTasks", page: "MyTasks", icon: ClipboardList },
              { labelKey: "nav.postTask", page: "PostTask", icon: PlusCircle },
              { labelKey: "nav.messages", page: "Messages", icon: MessageCircle },
            ].map(({ labelKey, page, icon: Icon }) => {
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
                  <span>{t(labelKey)}</span>
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
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              title={i18n.language === 'en' ? 'Switch to Amharic' : 'Switch to English'}
            >
              <Languages className="w-4 h-4" />
              <span>{i18n.language === 'en' ? 'አማ' : 'EN'}</span>
            </button>

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
                <div className="hidden md:flex items-center gap-3 pl-3 border-l border-gray-200">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user.full_name?.split(' ')[0] || 'User'}</p>
                    <p className="text-xs text-gray-500">{user.is_tasker ? 'Tasker' : 'Client'}</p>
                  </div>
                  <button
                    className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      logout().then(() => navigate('/login'));
                    }}
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
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
              { labelKey: "nav.browseTasks", page: "BrowseTasks", icon: List },
              { labelKey: "nav.myTasks", page: "MyTasks", icon: ClipboardList },
              { labelKey: "nav.postTask", page: "PostTask", icon: PlusCircle },
              { labelKey: "nav.messages", page: "Messages", icon: MessageCircle },
              { labelKey: "nav.profile", page: "Profile", icon: User },
            ].map(({ labelKey, page, icon: Icon }) => {
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
                  {t(labelKey)}
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
      <main className="flex-1">
        {children}
      </main>

      {/* Mobile Bottom Navigation - Native App Style */}
      {!isHomePage && (
        <nav className="md:hidden fixed left-0 right-0 bg-white border-t border-gray-200/50 z-40" style={{ 
          bottom: 0,
          paddingBottom: 'var(--safe-area-inset-bottom)'
        }}>
          <div className="flex">
            {[
              { labelKey: "nav.browseTasks", shortKey: "Explore", page: "BrowseTasks", icon: List },
              { labelKey: "nav.myTasks", shortKey: "My Tasks", page: "MyTasks", icon: ClipboardList },
              { labelKey: "nav.postTask", shortKey: "Post", page: "PostTask", icon: PlusCircle },
              { labelKey: "nav.messages", shortKey: "Messages", page: "Messages", icon: MessageCircle },
              { labelKey: "nav.profile", shortKey: "Profile", page: "Profile", icon: User },
            ].map(({ shortKey, page, icon: Icon }) => {
              const active = currentPageName === page;
              const showBadge = page === "Messages" && unreadMessageCount > 0;
              return (
                <Link
                  key={page}
                  to={createPageUrl(page)}
                  className={`flex-1 flex flex-col items-center justify-center py-3 gap-1.5 text-xs font-medium transition-colors relative min-h-[64px] ${
                    active ? "text-green-700" : "text-gray-500"
                  }`}
                >
                  <div className="relative">
                    <Icon className={`w-6 h-6 ${
                      active ? "text-green-700" : "text-gray-400"
                    }`} />
                    {showBadge && (
                      <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-bold leading-none text-white bg-red-600 rounded-full min-w-[18px]">
                        {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold tracking-[-0.01em]">{shortKey}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}