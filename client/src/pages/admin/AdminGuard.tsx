import React, { useEffect, useState } from "react";
import { api } from "../../api/api";
import { useNavigate } from "react-router-dom";
import PageLoader from "../../components/PageLoader";

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
        await api.get("/api/admin/me", {
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