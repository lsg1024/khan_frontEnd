import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useState, useEffect } from "react";

import JoinPage from "./pages/JoinPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import CataLogPage from "./pages/product/CataLogPage";
import ProductCreatePage from "./pages/product/ProductCreatePage";
import ProductDetailPage from "./pages/product/ProductDetailPage";
import StonePage from "./pages/stone/StonePage";
import StoneCreatePage from "./pages/stone/StoneCreatePage";
import OrderPage from "./pages/order/OrderPage";
import FixPage from "./pages/order/FixPage";
import ExpactPage from "./pages/order/ExpactPage";
import OrderCreatePage from "./pages/order/OrderCreatePage";
import OrderDeletedPage from "./pages/order/OrderDeletePage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";

import Layout from "./components/layout/Layout";
import { tokenUtils } from "./utils/tokenUtils";
import { useTokenAutoRefresh } from "./utils/useTokenAutoRefresh";

import "./App.css";
import "./styles/index.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 토큰 자동 갱신 서비스 초기화
  useTokenAutoRefresh();

  useEffect(() => {
    // 앱 시작 시 토큰 확인
    const checkAuth = () => {
      const hasToken = tokenUtils.hasToken();
      setIsAuthenticated(hasToken);
      setIsLoading(false);
    };

    checkAuth();

    // 로컬 스토리지 변화 감지 (다른 탭에서의 변화 감지)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "app:accessToken") {
        checkAuth();
      }
    };

    // 현재 탭에서의 토큰 변화 감지를 위한 커스텀 이벤트
    const handleTokenChange = () => {
      checkAuth();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("tokenChange", handleTokenChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("tokenChange", handleTokenChange);
    };
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {!isAuthenticated ? (
        <Routes>
          <Route path="/join" element={<JoinPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <Routes>
          {/* Layout 없이 단독 페이지 렌더링 */}
          <Route path="/stone/create" element={<StoneCreatePage />} />

          {/* Layout 안에서 렌더링 */}
          <Route
            element={
              <Layout onLogout={handleLogout}>
                <Outlet />
              </Layout>
            }
          >
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/catalog" element={<CataLogPage />} />
            <Route path="/catalog/create" element={<ProductCreatePage />} />
            <Route path="/catalog/:productId" element={<ProductDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/stone" element={<StonePage />} />
            <Route path="/stone/create" element={<StoneCreatePage />} />
            <Route path="/orders" element={<OrderPage />} />
            <Route path="/orders/create" element={<OrderCreatePage />} />
            <Route path="/fix" element={<FixPage />} />
            <Route path="/expact" element={<ExpactPage />} />
            <Route path="/order-deleted" element={<OrderDeletedPage />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/join" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      )}
    </BrowserRouter>
  );
}

export default App;
