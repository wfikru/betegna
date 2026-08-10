import React, { useState, useEffect } from "react";
import { Phone, MessageCircle, MapPin, Navigation, Clock, CheckCircle, ShieldCheck } from "lucide-react";
import { getFallbackTaskerPhoto } from "@/utils";

export default function LiveTrackingMap({
  booking,
  taskerName = "Dawit Abebe",
  taskerPhoto,
  taskerPhone = "+251 911 23 45 67",
  status = "en_route", // 'en_route' | 'in_progress'
  onOpenChat,
  onCallTasker
}) {
  const [progress, setProgress] = useState(20);
  const photo = taskerPhoto || getFallbackTaskerPhoto(taskerName);

  // Animate Tasker moving along the SVG route
  useEffect(() => {
    if (status === "in_progress") {
      setProgress(100);
      return;
    }
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) return 20; // loop simulation
        return prev + 2;
      });
    }, 400);
    return () => clearInterval(timer);
  }, [status]);

  // Calculate coordinates along a curved SVG path between start (60, 200) and dest (340, 60)
  const startX = 60;
  const startY = 200;
  const destX = 340;
  const destY = 60;

  const currentX = startX + (destX - startX) * (progress / 100);
  const currentY = startY + (destY - startY) * (progress / 100);

  const etaMinutes = Math.max(2, Math.round(15 * ((100 - progress) / 100)));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-md">
      {/* Split-Screen Upper Map Area (Smooth Micro-Animation) */}
      <div className="relative h-64 bg-slate-100 dark:bg-slate-950 overflow-hidden">
        {/* Animated Map Grid Vector Background */}
        <svg
          className="absolute inset-0 w-full h-full text-slate-300 dark:text-slate-800"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 400 240"
          preserveAspectRatio="none"
        >
          {/* Street Grid Lines */}
          <line x1="0" y1="60" x2="400" y2="60" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4" />
          <line x1="0" y1="140" x2="400" y2="140" stroke="currentColor" strokeWidth="2" />
          <line x1="0" y1="200" x2="400" y2="200" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4" />
          <line x1="100" y1="0" x2="100" y2="240" stroke="currentColor" strokeWidth="2" />
          <line x1="220" y1="0" x2="220" y2="240" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4" />
          <line x1="320" y1="0" x2="320" y2="240" stroke="currentColor" strokeWidth="2" />

          {/* Route Path (Dashed Blue/Emerald Line) */}
          <path
            d={`M ${startX} ${startY} L ${destX} ${destY}`}
            stroke="#059669"
            strokeWidth="4"
            strokeDasharray="8 6"
            strokeLinecap="round"
            fill="none"
          />

          {/* Destination Client Home Pin */}
          <g transform={`translate(${destX - 14}, ${destY - 28})`}>
            <circle cx="14" cy="14" r="14" fill="#047857" fillOpacity="0.2" />
            <circle cx="14" cy="14" r="8" fill="#047857" />
            <text x="14" y="18" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">⌂</text>
          </g>

          {/* Animated Moving Tasker Avatar & Geofence Pulse */}
          <g
            transform={`translate(${currentX - 18}, ${currentY - 18})`}
            className="transition-all duration-300 ease-linear"
          >
            <circle cx="18" cy="18" r="22" fill="#10b981" fillOpacity="0.25" className="animate-ping" />
            <circle cx="18" cy="18" r="16" fill="#059669" stroke="white" strokeWidth="3" />
            <text x="18" y="22" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">💼</text>
          </g>
        </svg>

        {/* Floating Real-Time Status & ETA Banner */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
          <div className="bg-slate-900/90 dark:bg-slate-800/90 text-white backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2">
            <Navigation className="w-4 h-4 text-emerald-400 animate-spin" />
            <span>{status === "in_progress" ? "Tasker is On-Site (In Progress)" : "Tasker is En Route to Your Address"}</span>
          </div>

          <div className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-extrabold shadow-lg flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{status === "in_progress" ? "Arrived" : `${etaMinutes} mins`}</span>
          </div>
        </div>
      </div>

      {/* Split-Screen Lower Info & Actions Bar */}
      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-emerald-600 shadow-sm shrink-0">
              <img
                src={photo}
                alt={taskerName}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">{taskerName}</h3>
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" title="Verified Tasker" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {status === "in_progress" ? "Working on your job" : "Heading to your address via Bole Road"}
              </p>
            </div>
          </div>

          {/* Conversational & Contact Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onCallTasker}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>Call (Masked)</span>
            </button>
            <button
              onClick={onOpenChat}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat with Tasker</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
