import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowLeft, CheckCircle, KeyRound } from "lucide-react";
import { api } from "@/api/firebaseClient";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Email is required");
      return;
    }

    setLoading(true);
    try {
      await api.auth.resetPassword(email);
      setEmailSent(true);
    } catch (err) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <button 
        onClick={() => navigate("/login")} 
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors z-10"
        aria-label="Back to sign in"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Back</span>
      </button>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
        <Card className="rounded-2xl border-0 shadow-xl bg-white">
          <CardHeader className="space-y-2 pt-8 pb-6">
            <div className="mx-auto w-16 h-16 bg-green-700 rounded-2xl flex items-center justify-center mb-2">
              <KeyRound className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 text-center">
              {emailSent ? "Check Your Email" : "Reset Password"}
            </CardTitle>
            <p className="text-center text-gray-600 text-sm">
              {emailSent ? "We've sent you a reset link" : "Enter your email to reset your password"}
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-8">
            {emailSent ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="w-14 h-14 text-green-600" />
                </div>
                <p className="text-base text-gray-700">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
                <p className="text-sm text-gray-600">
                  Click the link in the email to reset your password. 
                  The link will expire in 1 hour.
                </p>
                <div className="space-y-3 pt-2">
                  <Button
                    onClick={() => navigate("/login")}
                    className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold h-11 rounded-lg shadow-md transition-all"
                  >
                    Back to Sign In
                  </Button>
                  <p className="text-sm text-gray-600">
                    Didn't receive the email?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setEmailSent(false);
                        setEmail("");
                      }}
                      className="font-semibold text-green-700 hover:text-green-800 underline"
                    >
                      Try again
                    </button>
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11 pl-10 text-base border-gray-300 focus:border-green-600 focus:ring-green-600"
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
                  disabled={loading}
                  className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold h-11 rounded-lg shadow-md transition-all"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>

                <p className="text-center text-sm text-gray-600 pt-2">
                  Remember your password?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="font-semibold text-green-700 hover:text-green-800 underline"
                  >
                    Sign in
                  </button>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
