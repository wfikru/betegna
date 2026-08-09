import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
} 


export const isIframe = window.self !== window.top;

export function getInitials(nameOrEmail) {
  if (!nameOrEmail) return "?"
  const name = String(nameOrEmail)
  // if email, use the part before @ as a fallback
  const base = name.includes("@") ? name.split("@")[0] : name
  const cleaned = base.replace(/[^a-zA-Z0-9\s]/g, " ").trim()
  if (!cleaned) return "?"
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  const first = parts[0][0]
  const last = parts[parts.length - 1][0]
  return (first + last).toUpperCase()
}
