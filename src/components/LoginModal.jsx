import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Lock, LogIn, KeyRound, CheckCircle } from "lucide-react";
import { api } from "@/api/firebaseClient";

/**
 * Modal overlay that shows login form when user is not authenticated
 * Used in PostTask and Profile pages
 * @param {Function} onCancel - Optional callback when user closes modal
 * @param {boolean} hideOverlay - If true, removes the overlay background
 */
export default function LoginModal({ onCancel, hideOverlay = false }) {
  const { login, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("signin");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleCancel = onCancel ? onCancel : () => navigate("/");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      setEmail("");
      setPassword("");
      setError(null);
    } catch (err) {
      // Provide user-friendly error messages
      if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password. Please try again.");
      } else if (err.code === "auth/user-not-found") {
        setError("No account found with this email address.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please try again later.");
      } else if (err.code === "auth/user-disabled") {
        setError("This account has been disabled.");
      } else {
        setError(err.message || "Failed to sign in. Please try again.");
      }
    }
  };

  const handleGoogle = async () => {
    try {
      await loginWithGoogle();
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setError(null);
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user") {
        setError("Sign in cancelled.");
      } else if (err.code === "auth/popup-blocked") {
        setError("Popup blocked. Please allow popups for this site.");
      } else if (err.code === "auth/account-exists-with-different-credential") {
        setError("An account already exists with the same email address.");
      } else {
        setError(err.message || "Failed to sign in with Google.");
      }
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      await signup(email, password, firstName, lastName);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to create account");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Email is required");
      return;
    }

    try {
      await api.auth.resetPassword(email);
      setResetSuccess(true);
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email address.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many requests. Please try again later.");
      } else {
        setError(err.message || "Failed to send reset email.");
      }
    }
  };

  return (
    <div
      className={hideOverlay ? "" : "fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50"}
      onClick={hideOverlay ? undefined : handleCancel}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="rounded-2xl border-0 shadow-xl bg-white">
          <CardHeader className="space-y-2 pt-6 pb-4">
            {!hideOverlay && (
              <button
                onClick={handleCancel}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors p-1"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <div className="mx-auto w-14 h-14 bg-green-700 rounded-2xl flex items-center justify-center mb-2">
              {mode === "forgot-password" ? (
                <KeyRound className="w-7 h-7 text-white" />
              ) : mode === "signup" ? (
                <User className="w-7 h-7 text-white" />
              ) : (
                <LogIn className="w-7 h-7 text-white" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 text-center">
              {mode === "forgot-password" ? "Reset Password" : mode === "signin" ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <p className="text-center text-gray-600 text-sm">
              {mode === "forgot-password" 
                ? "Enter your email address and we'll send you a link to reset your password." 
                : mode === "signin" 
                ? "Sign in to your account" 
                : "Join us today and get started"}
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {mode === "forgot-password" ? (
              resetSuccess ? (
                <div className="space-y-4">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">Check Your Email</h3>
                    <p className="text-sm text-gray-600">
                      We've sent a password reset link to <span className="font-medium text-gray-900">{email}</span>
                    </p>
                    <p className="text-sm text-gray-600 pt-2">
                      Click the link in the email to reset your password.
                    </p>
                  </div>
                  <Button 
                    onClick={() => {
                      setMode("signin");
                      setResetSuccess(false);
                      setEmail("");
                      setError(null);
                    }}
                    className="w-full h-11 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg shadow-md transition-all mt-4"
                  >
                    Back to Sign In
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <Label htmlFor="modal-reset-email" className="text-sm font-medium text-gray-700 mb-1.5 block">Email Address</Label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <Input
                        id="modal-reset-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-11 pl-10 text-base border-gray-300 focus:border-green-600 focus:ring-green-600"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}
                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg shadow-md transition-all"
                  >
                    Send Reset Link
                  </Button>
                  <div className="text-center pt-4">
                    <p className="text-sm text-gray-600">
                      Remember your password?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setMode("signin");
                          setEmail("");
                          setError(null);
                        }}
                        className="font-semibold text-green-700 hover:text-green-800 underline"
                      >
                        Sign In
                      </button>
                    </p>
                  </div>
                </form>
              )
            ) : mode === "signin" && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 flex items-center justify-center gap-3 border-gray-300 hover:bg-gray-50 rounded-lg font-medium"
                  onClick={handleGoogle}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.72 1.21 9.23 3.57l6.85-6.85C35.6 2.88 29.06 0 24 0 14.78 0 6.93 5.4 2.74 13.32l7.97 6.2C12.72 13.3 18.75 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.14-3.14-.4-4.63H24v9.02h12.7c-.55 2.96-2.19 5.47-4.68 7.15l7.32 5.7C44.98 36.1 46.5 30.6 46.5 24.5z"/>
                    <path fill="#FBBC05" d="M10.71 28.47a14.58 14.58 0 0 1 0-9.0l-7.97-6.2A24.07 24.07 0 0 0 1.5 24.5c0 3.86.92 7.5 2.54 10.75l7.97-6.78z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.14 15.91-5.82l-7.32-5.7c-2.03 1.37-4.64 2.18-8.59 2.18-5.25 0-10.28-3.8-11.97-9.06l-7.97 6.2C6.93 42.6 14.78 48 24 48z"/>
                    <path fill="none" d="M0 0h48v48H0z"/>
                  </svg>
                  Continue with Google
                </Button>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">or continue with email</span>
                  </div>
                </div>
              </>
            )}
            {mode !== "forgot-password" && (
              <form onSubmit={mode === "signin" ? handleSubmit : handleSignup} className="space-y-4">
                {mode === "signup" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="modal-firstName" className="text-sm font-medium text-gray-700 mb-1.5 block">First Name</Label>
                    <Input
                      id="modal-firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="h-11 text-base border-gray-300 focus:border-green-600 focus:ring-green-600"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label htmlFor="modal-lastName" className="text-sm font-medium text-gray-700 mb-1.5 block">Last Name</Label>
                    <Input
                      id="modal-lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="h-11 text-base border-gray-300 focus:border-green-600 focus:ring-green-600"
                      placeholder="Doe"
                    />
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="modal-email" className="text-sm font-medium text-gray-700 mb-1.5 block">Email Address</Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    id="modal-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 pl-10 text-base border-gray-300 focus:border-green-600 focus:ring-green-600"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="modal-password" className="text-sm font-medium text-gray-700 mb-1.5 block">Password</Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    id="modal-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pl-10 text-base border-gray-300 focus:border-green-600 focus:ring-green-600"
                    placeholder={mode === "signup" ? "Min. 8 characters" : "Enter your password"}
                  />
                </div>
              </div>
              {mode === "signup" && (
                <div>
                  <Label htmlFor="modal-confirm-password" className="text-sm font-medium text-gray-700 mb-1.5 block">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                      id="modal-confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="h-11 pl-10 text-base border-gray-300 focus:border-green-600 focus:ring-green-600"
                      placeholder="Re-enter password"
                    />
                  </div>
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <Button 
                type="submit" 
                className="w-full h-11 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg shadow-md transition-all"
              >
                {mode === "signin" ? "Sign In" : "Create Account"}
              </Button>
            </form>
            )}
            {mode !== "forgot-password" && (
            <div className="mt-4 text-center space-y-3">
              {mode === "signin" ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot-password");
                      setError(null);
                      setPassword("");
                    }}
                    className="text-sm text-green-700 hover:text-green-800 font-medium"
                  >
                    Forgot password?
                  </button>
                  <p className="text-sm text-gray-600 pt-2">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setMode("signup");
                      }}
                      className="font-semibold text-green-700 hover:text-green-800 underline"
                    >
                      Sign up
                    </button>
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-600 pt-2">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setMode("signin");
                    }}
                    className="font-semibold text-green-700 hover:text-green-800 underline"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}