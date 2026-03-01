import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import LoginModal from "@/components/LoginModal";

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <button 
        onClick={() => navigate("/")} 
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Back to tasks</span>
      </button>
      <LoginModal onCancel={() => navigate("/")} hideOverlay={true} />
    </div>
  );
}
