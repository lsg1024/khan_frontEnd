import { useState, useEffect, useCallback, useRef } from "react";
import { tokenUtils } from "../../utils/tokenUtils";
import { authApi } from "../../../libs/api/auth";
import { useTokenAutoRefresh } from "../../utils/useTokenAutoRefresh";

interface TopBarProps {
	onLogout?: () => void;
	onToggleSidebar?: () => void;
	isSidebarOpen?: boolean;
}

function TopBar({ onLogout, onToggleSidebar, isSidebarOpen }: TopBarProps) {
	const [remainingTime, setRemainingTime] = useState<string>("");
	const [isTokenExpired, setIsTokenExpired] = useState<boolean>(false);
	const [isTokenExpiringSoon, setIsTokenExpiringSoon] =
		useState<boolean>(false);
	const [nickname, setNickname] = useState<string | null>(null);
	const [showTokenDetails, setShowTokenDetails] = useState<boolean>(false);
	const tokenSectionRef = useRef<HTMLDivElement>(null);

	// 토큰 자동 갱신 Hook 사용
	const { tokenStatus, manualRefresh, serviceStatus } = useTokenAutoRefresh();

	// 수동 갱신 함수
	const handleManualRefresh = useCallback(async () => {
		await manualRefresh();
	}, [manualRefresh]);

	// 토큰 세부사항 토글
	const toggleTokenDetails = useCallback(() => {
		setShowTokenDetails((prev) => !prev);
	}, []);

	const handleLogout = useCallback(async () => {
		try {
			// 서버에 로그아웃 요청
			await authApi.logout();
		} catch (error) {
			console.error("서버 로그아웃 실패:", error);
		}

		// 로컬 토큰 삭제
		tokenUtils.removeToken();

		if (onLogout) {
			onLogout();
		} else {
			window.location.href = "/login";
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

	// 외부 클릭 감지하여 드롭다운 닫기
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				tokenSectionRef.current &&
				!tokenSectionRef.current.contains(event.target as Node)
			) {
				setShowTokenDetails(false);
			}
		};

		if (showTokenDetails) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [showTokenDetails]);

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
					<div className="token-section" ref={tokenSectionRef}>
						<div
							className={`token-timer ${
								isTokenExpired
									? "expired"
									: isTokenExpiringSoon
									? "warning"
									: ""
							}`}
							onClick={toggleTokenDetails}
							style={{ cursor: "pointer" }}
						>
							<span className="timer-icon">⏰</span>
							<span className="timer-text">{remainingTime}</span>
							{tokenStatus.isRefreshing && (
								<span className="refresh-indicator">🔄</span>
							)}
							<span className="toggle-icon">
								{showTokenDetails ? "▲" : "▼"}
							</span>
						</div>

						{showTokenDetails && (
							<div className="token-details-dropdown">
								<div className="token-detail-row">
									<span>곧 만료:</span>
									<span
										className={
											tokenStatus.isExpiringSoon ? "warning" : "normal"
										}
									>
										{tokenStatus.isExpiringSoon ? "예" : "아니오"}
									</span>
								</div>
								<div className="token-detail-row">
									<span>갱신 중:</span>
									<span>{tokenStatus.isRefreshing ? "예" : "아니오"}</span>
								</div>
								<div className="token-detail-row">
									<span>서비스 상태:</span>
									<span>{serviceStatus.isRunning ? "실행 중" : "중지됨"}</span>
								</div>
								<div className="token-detail-row">
									<span>갱신 임계값:</span>
									<span>{serviceStatus.refreshThresholdMinutes}분</span>
								</div>
								<div className="token-actions">
									<button
										onClick={handleManualRefresh}
										className="manual-refresh-btn"
										disabled={tokenStatus.isRefreshing}
									>
										수동 갱신
									</button>
								</div>
							</div>
						)}
					</div>
				)}
				{nickname && (
					<div className="user-info">
						<span className="user-icon">👤</span>
						<span className="user-nickname">{nickname}님</span>
					</div>
				)}
				<button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
					로그아웃
				</button>
			</div>
		</div>
	);
}

export default TopBar;
