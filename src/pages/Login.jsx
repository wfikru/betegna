import { useNavigate } from "react-router-dom";
import LoginModal from "@/components/LoginModal";

export default function Login() {
  const navigate = useNavigate();

  return (
    <LoginModal onCancel={() => navigate("/")} />
  );
}
