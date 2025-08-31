import { useState, useEffect, useCallback } from "react";
import { tokenUtils } from "../../utils/tokenUtils";
import { apiRequest } from "../../../libs/api";

interface TopBarProps {
  onLogout?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

function TopBar({ onLogout, onToggleSidebar, isSidebarOpen }: TopBarProps) {
  const [remainingTime, setRemainingTime] = useState<string>("");
  const [isTokenExpired, setIsTokenExpired] = useState<boolean>(false);
  const [isTokenExpiringSoon, setIsTokenExpiringSoon] = useState<boolean>(false);
  const [nickname, setNickname] = useState<string | null>(null);

  const handleLogout = useCallback(async () => {
    console.log("TopBar 로그아웃 시작");
    
    try {
      // 서버에 로그아웃 요청
      await apiRequest.post("/auth/logout");
      console.log("서버 로그아웃 성공");
    } catch (error) {
      console.error("서버 로그아웃 실패:", error);
    }
    
    // 로컬 토큰 삭제
    tokenUtils.removeToken();
    
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = '/login';
    }
  }, [onLogout]);

  useEffect(() => {
    const updateTokenTime = () => {
      if (tokenUtils.hasToken()) {
        const remaining = tokenUtils.formatRemainingTime();
        const expired = tokenUtils.isTokenExpired();
        const expiringSoon = tokenUtils.isTokenExpiringSoon();
        const userNickname = tokenUtils.getNickname();
        
        setRemainingTime(remaining);
        setIsTokenExpired(expired);
        setIsTokenExpiringSoon(expiringSoon);
        setNickname(userNickname);
        
        // 토큰이 만료되었다면 자동 로그아웃
        if (expired) {
          console.log("토큰이 만료되어 자동 로그아웃됩니다.");
          handleLogout();
        }
      } else {
        setRemainingTime("");
        setIsTokenExpired(false);
        setIsTokenExpiringSoon(false);
        setNickname(null);
      }
    };

    // 초기 실행
    updateTokenTime();

    // 1초마다 업데이트
    const interval = setInterval(updateTokenTime, 1000);

    return () => clearInterval(interval);
  }, [handleLogout]);

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <button 
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "사이드바 숨기기" : "사이드바 보이기"}
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
        <h2>Khan System</h2>
      </div>
      <div className="top-bar-right">
        {remainingTime && (
          <div className={`token-timer ${isTokenExpired ? 'expired' : isTokenExpiringSoon ? 'warning' : ''}`}>
            <span className="timer-icon">⏰</span>
            <span className="timer-text">{remainingTime}</span>
          </div>
        )}
        {nickname && (
          <div className="user-info">
            <span className="user-icon">👤</span>
            <span className="user-nickname">{nickname}님</span>
          </div>
        )}
        <button 
          className="btn btn-outline-light btn-sm" 
          onClick={handleLogout}
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}

export default TopBar;
