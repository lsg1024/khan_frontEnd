import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

import JoinPage from "./pages/JoinPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import CataLogPage from "./pages/CataLogPage";
import ProductDetailPage from "./pages/ProductDetailPage";
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
        // 인증되지 않은 경우: 로그인/회원가입 페이지만 표시
        <Routes>
          <Route path="/join" element={<JoinPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        // 인증된 경우: 레이아웃과 함께 메인 콘텐츠 표시
        <Layout onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/catalog" element={<CataLogPage />} />
            <Route path="/catalog/:productId" element={<ProductDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/join" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      )}
    </BrowserRouter>
  );
}

export default App;
