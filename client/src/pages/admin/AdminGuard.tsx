import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import PageLoader from "../../components/PageLoader";

const API = "http://localhost:5000";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/admin/login", { replace: true });
        return;
      }

      try {
        await axios.get(`${API}/api/admin/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setChecking(false);
      } catch {
        navigate("/admin/login", { replace: true });
      }
    })();
  }, [navigate]);

  return (
    <>
      <PageLoader open={checking} text="Перевірка доступу..." />
      {!checking && children}
    </>
  );
}