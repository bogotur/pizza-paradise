import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import CartPage from "./pages/CartPage";
import PaymentPage from "./pages/PaymentPage";
import ProfilePage from "./pages/ProfilePage";
import MyOrdersPage from "./pages/MyOrdersPage";

import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminGuard from "./pages/admin/AdminGuard";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminHomePage from "./pages/admin/AdminHomePage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";

import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

function AppLayout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <>
      {!isAdminRoute && <Navbar />}

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2200,
          style: {
            background: "rgba(0,0,0,0.75)",
            color: "#fff",
            border: "1px solid rgba(255,153,49,0.35)",
            borderRadius: "14px",
            boxShadow: "0 0 22px rgba(255,105,57,0.25)",
            backdropFilter: "blur(8px)",
            fontWeight: 700,
          },
        }}
      />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/payment/:orderId" element={<PaymentPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/my-orders" element={<MyOrdersPage />} />

        <Route path="/admin/login" element={<AdminLoginPage />} />

        <Route
          path="/admin/*"
          element={
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          }
        >
          <Route index element={<AdminHomePage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="menu" element={<AdminHomePage />} />
          <Route path="ingredients" element={<AdminHomePage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>

      {!isAdminRoute && <Footer />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <AppLayout />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;