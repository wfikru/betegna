import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/AuthContext";
import { useNotifications } from "@/lib/NotificationContext";
import { useMessages } from "@/lib/MessageContext";
import { useAppMode } from "@/lib/AppModeContext";
import { useTranslation } from "react-i18next";
import {
  List, ClipboardList, User, Menu, X, Bell, LogOut, MessageCircle,
  PlusCircle, Briefcase, Search, ShieldCheck, LayoutDashboard, Settings, Sparkles
} from "lucide-react";
import Logo from "@/components/Logo";

export default function Layout({ children, currentPageName }) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { unreadMessageCount } = useMessages();
  const { mode, isTaskerMode, isClientMode, toggleMode, themeTokens } = useAppMode();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 4 Core Navigation Tabs for Client Mode (Airbnb / Uber style)
  const CLIENT_TABS = [
    { label: "Explore",   page: "Home",         icon: Search,        url: "/" },
    { label: "Bookings",  page: "MyBookings",   icon: ClipboardList, url: createPageUrl("MyBookings") },
    { label: "Inbox",     page: "Messages",     icon: MessageCircle, url: createPageUrl("Messages") },
    { label: "Profile",   page: "Profile",      icon: User,          url: createPageUrl("Profile") },
  ];

  // 4 Core Navigation Tabs for Tasker Mode (Field Worker Dashboard style)
  const TASKER_TABS = [
    { label: "Dashboard", page: "Home",         icon: LayoutDashboard, url: "/" },
    { label: "Jobs",      page: "BrowseTasks",  icon: Briefcase,       url: createPageUrl("BrowseTasks") },
    { label: "Inbox",     page: "Messages",     icon: MessageCircle,   url: createPageUrl("Messages") },
    { label: "Settings",  page: "Profile",      icon: Settings,        url: createPageUrl("Profile") },
  ];

  const activeTabs = isTaskerMode ? TASKER_TABS : CLIENT_TABS;

  return (
    <div
      className={`min-h-[100dvh] flex flex-col transition-colors duration-300 ${
        isTaskerMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
      style={{
        paddingBottom: 'calc(68px + var(--safe-area-inset-bottom))'
      }}
    >
      {/* Top Banner Accent Cue for Tasker Mode ("Working Mode" Indicator) */}
      {isTaskerMode && (
        <div className="bg-gradient-to-r from-indigo-900 via-teal-900 to-indigo-950 text-indigo-100 px-4 py-1.5 text-xs font-semibold text-center border-b border-indigo-700/60 flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
          <span>TASKER BUSINESS DASHBOARD — Active Worker Mode</span>
          <button
            onClick={() => toggleMode('client')}
            className="ml-2 underline hover:text-white font-bold text-[11px]"
          >
            Switch to Client
          </button>
        </div>
      )}

      {/* Professional Integrated Header */}
      <header
        className={`sticky top-0 z-40 transition-colors duration-300 border-b ${
          isTaskerMode
            ? "bg-slate-900/95 border-indigo-900/60 shadow-lg text-slate-100"
            : "bg-white/95 border-slate-200/80 shadow-sm text-slate-900"
        } backdrop-blur-md`}
        style={{ paddingTop: 'var(--safe-area-inset-top)' }}
      >
        <div className="w-full md:max-w-7xl md:mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo Lockup */}
          <Link to="/" className="flex items-center gap-3 flex-shrink-0 hover:opacity-80 transition-opacity">
            <Logo size={44} variant={isTaskerMode ? "light" : "default"} />
          </Link>

          {/* Persistent Animated Global Mode Switcher Pill */}
          <div className={`hidden sm:flex items-center p-1 rounded-full border transition-all ${
            isTaskerMode
              ? "bg-indigo-950/80 border-indigo-700 text-indigo-200 shadow-inner"
              : "bg-slate-100 border-slate-200/80 text-slate-700 shadow-inner"
          }`}>
            <button
              type="button"
              onClick={() => toggleMode('client')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                isClientMode
                  ? "bg-white text-slate-900 shadow-sm scale-100"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white scale-95"
              }`}
            >
              <span>👤 Client</span>
            </button>
            <button
              type="button"
              onClick={() => toggleMode('tasker')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                isTaskerMode
                  ? "bg-indigo-700 text-white shadow-sm scale-100"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white scale-95"
              }`}
            >
              <span>💼 Tasker</span>
            </button>
          </div>

          {/* Desktop Primary Navigation (4 Core Tabs) */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {activeTabs.map(({ label, page, icon: Icon, url }) => {
              const active = currentPageName === page;
              const showBadge = page === "Messages" && unreadMessageCount > 0;
              return (
                <Link
                  key={page}
                  to={url}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all relative ${
                    active
                      ? isTaskerMode
                        ? "text-teal-400 bg-indigo-950/80 border border-indigo-700/80"
                        : "text-emerald-700 bg-emerald-50 border border-emerald-200"
                      : isTaskerMode
                        ? "text-slate-300 hover:text-white hover:bg-slate-800"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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

          {/* Right Section Actions */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Post a Task CTA Button (Client Mode Desktop/Tablet) */}
            {isClientMode && (
              <Link
                to={createPageUrl("PostTask")}
                className="hidden md:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm hover:shadow transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Post a Task</span>
              </Link>
            )}

            {user ? (
              <>
                {/* Notifications Bell */}
                <button
                  onClick={() => navigate(createPageUrl("Notifications"))}
                  className={`relative p-2.5 rounded-xl transition-colors ${
                    isTaskerMode
                      ? "text-slate-300 hover:bg-slate-800"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Profile Avatar Pill (Desktop) */}
                <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-200/40">
                  <Link
                    to={createPageUrl("Profile")}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors ${
                      currentPageName === "Profile"
                        ? isTaskerMode
                          ? "bg-indigo-950 text-indigo-300"
                          : "bg-emerald-50 text-emerald-700"
                        : isTaskerMode
                          ? "hover:bg-slate-800 text-slate-200"
                          : "hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ${
                      isTaskerMode ? "bg-indigo-600" : "bg-emerald-600"
                    }`}>
                      {(user.full_name || user.email || "?")[0].toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold leading-tight truncate max-w-[100px]">
                        {user.full_name?.split(' ')[0] || 'User'}
                      </p>
                      <p className="text-xs text-slate-400 leading-tight flex items-center gap-1">
                        {isTaskerMode ? 'Tasker' : 'Client'}
                        {user.is_verified && <ShieldCheck className="w-3 h-3 text-emerald-500" />}
                      </p>
                    </div>
                  </Link>
                  <button
                    className={`p-2 rounded-xl transition-colors ${
                      isTaskerMode
                        ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                        : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    }`}
                    onClick={() => {
                      logout().then(() => navigate('/login'));
                    }}
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isTaskerMode ? "text-slate-200 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm transition-all"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className={`lg:hidden p-2.5 rounded-xl transition-colors ${
                isTaskerMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"
              }`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu (Includes Global Switcher on Mobile) */}
        {mobileMenuOpen && (
          <div className={`md:hidden border-t px-4 py-3 shadow-lg ${
            isTaskerMode ? "bg-slate-900 border-indigo-900/60" : "bg-white border-slate-100"
          }`}>
            {/* Mobile Animated Pill Toggle */}
            <div className="flex items-center justify-between p-2 mb-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 ml-1">App Mode:</span>
              <div className="flex gap-1">
                <button
                  onClick={() => { toggleMode('client'); setMobileMenuOpen(false); }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    isClientMode ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  }`}
                >
                  👤 Client
                </button>
                <button
                  onClick={() => { toggleMode('tasker'); setMobileMenuOpen(false); }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    isTaskerMode ? "bg-indigo-700 text-white shadow-sm" : "text-slate-500"
                  }`}
                >
                  💼 Tasker
                </button>
              </div>
            </div>

            {activeTabs.map(({ label, page, icon: Icon, url }) => {
              const active = currentPageName === page;
              const showBadge = page === "Messages" && unreadMessageCount > 0;
              return (
                <Link
                  key={page}
                  to={url}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold mb-1 transition-colors relative ${
                    active
                      ? isTaskerMode
                        ? "bg-indigo-950 text-teal-400 font-bold"
                        : "bg-emerald-50 text-emerald-700 font-bold"
                      : isTaskerMode
                        ? "text-slate-300 hover:bg-slate-800"
                        : "text-slate-700 hover:bg-slate-100"
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
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold mt-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Log out
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2 mt-2 border-t border-slate-200 dark:border-slate-800">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold"
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

      {/* Persistent Sticky 4-Tab Mobile Bottom Bar (Airbnb / Uber Style) */}
      <nav
        className={`md:hidden fixed left-0 right-0 border-t z-40 transition-colors duration-300 ${
          isTaskerMode
            ? "bg-slate-900/95 border-indigo-900/60 shadow-2xl text-slate-100"
            : "bg-white/95 border-slate-200/80 shadow-lg text-slate-900"
        } backdrop-blur-md`}
        style={{
          bottom: 0,
          paddingBottom: 'var(--safe-area-inset-bottom)'
        }}
      >
        <div className="flex items-center justify-around h-16">
          {activeTabs.map(({ label, page, icon: Icon, url }) => {
            const active = currentPageName === page;
            const showBadge = page === "Messages" && unreadMessageCount > 0;

            return (
              <Link
                key={page}
                to={url}
                className={`flex-1 flex flex-col items-center justify-center py-2 gap-1 text-xs font-semibold transition-all relative min-h-[58px] ${
                  active
                    ? isTaskerMode
                      ? "text-teal-400 scale-105"
                      : "text-emerald-700 scale-105"
                    : isTaskerMode
                      ? "text-slate-400 hover:text-slate-200"
                      : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <div className={`relative flex items-center justify-center w-11 h-7 rounded-full transition-colors ${
                  active
                    ? isTaskerMode
                      ? "bg-indigo-900/70"
                      : "bg-emerald-100/80"
                    : ""
                }`}>
                  <Icon className="w-5 h-5" />
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-bold leading-none text-white bg-red-600 rounded-full min-w-[18px]">
                      {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-bold tracking-tight">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
