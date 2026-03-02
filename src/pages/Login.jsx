import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/api/firebaseClient";
import LoginModal from "@/components/LoginModal";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoadingAuth } = useAuth();

  const redirectAfterLogin = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("redirect") || "/BrowseTasks";
  }, [location.search]);

  useEffect(() => {
    // Extra safety for mobile redirect flow: use auth.currentUser as fallback
    const resolvedUser = user || auth.currentUser;
    if (resolvedUser) {
      navigate(redirectAfterLogin, { replace: true });
    }
  }, [user, redirectAfterLogin, navigate]);

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-500">Checking sign in...</div>
      </div>
    );
  }

  return (
    <LoginModal onCancel={() => navigate("/")} />
  );
}
