import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { tokenUtils } from "../../utils/tokenUtils";
import { authApi } from "../../../libs/api/authApi";
import { extractSubdomain } from "../../../libs/domain";

interface TopBarProps {
	onLogout?: () => void;
	onToggleSidebar?: () => void;
	isSidebarOpen?: boolean;
}

function TopBar({ onLogout, onToggleSidebar, isSidebarOpen }: TopBarProps) {
	const navigate = useNavigate();
	const [nickname, setNickname] = useState<string | null>(null);
	const [subdomain, setSubdomain] = useState<string>("");

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
		// 닉네임 설정
		const userNickname = tokenUtils.getNickname();
		setNickname(userNickname);

		// 서브도메인 추출
		const currentSubdomain = extractSubdomain(window.location.hostname);
		setSubdomain(currentSubdomain);
	}, []);

	const handleTitleClick = () => {
		navigate("/home");
	};

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
				<h2 onClick={handleTitleClick} style={{ cursor: "pointer" }}>
					{subdomain ? subdomain.toUpperCase() : "Khan System"}
				</h2>
			</div>
			<div className="top-bar-right">
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
