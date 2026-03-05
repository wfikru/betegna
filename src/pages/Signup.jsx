import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, User } from "lucide-react";

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
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

    setLoading(true);
    try {
      // Call signup function with all user data
      await signup(email, password, firstName, lastName);
      // Redirect to home or dashboard after successful signup
      navigate("/");
    } catch (err) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="rounded-2xl border-0 shadow-xl bg-white relative">
          {/* Close Button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 z-10"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <CardHeader className="space-y-2 pt-8 pb-6">
            <div className="mx-auto w-16 h-16 bg-green-700 rounded-2xl flex items-center justify-center mb-2">
              <User className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 text-center">
              Create Account
            </CardTitle>
            <p className="text-center text-gray-600 text-sm">
              Join us today and get started
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 mb-1.5 block">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="h-11 text-base border-gray-300 focus:border-green-600 focus:ring-green-600"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="h-11 text-base border-gray-300 focus:border-green-600 focus:ring-green-600"
                  />
                </div>
              </div>

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

              <div>
                <Label htmlFor="password" className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pl-10 text-base border-gray-300 focus:border-green-600 focus:ring-green-600"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                {loading ? "Creating account..." : "Create Account"}
              </Button>

              <p className="text-center text-sm text-gray-600 pt-2">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="font-semibold text-green-700 hover:text-green-800 underline"
                >
                  Sign In
                </button>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
