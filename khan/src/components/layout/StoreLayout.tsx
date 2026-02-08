// STORE 역할 전용 레이아웃
// 심플한 헤더와 전체 너비 콘텐츠 영역

import { type ReactNode, useCallback } from "react";
import { tokenUtils } from "../../utils/tokenUtils";
import { authApi } from "../../../libs/api/authApi";
import "../../styles/components/layout/StoreLayout.css";

interface StoreLayoutProps {
	children: ReactNode;
	onLogout?: () => void;
}

function StoreLayout({ children, onLogout }: StoreLayoutProps) {
	const nickname = tokenUtils.getNickname();

	const handleLogout = useCallback(async () => {
		try {
			await authApi.logout();
		} catch (error) {
			console.error("서버 로그아웃 실패:", error);
		}

		tokenUtils.removeToken();
		if (onLogout) {
			onLogout();
		}
	}, [onLogout]);

	return (
		<div className="store-layout">
			{/* 심플한 헤더 */}
			<header className="store-header">
				<div className="store-header-left">
					<h1 className="store-logo">Product Catalog</h1>
				</div>
				<div className="store-header-right">
					{nickname && <span className="store-user-name">{nickname}</span>}
					<button className="store-logout-btn" onClick={handleLogout}>
						로그아웃
					</button>
				</div>
			</header>

			{/* 메인 콘텐츠 영역 */}
			<main className="store-main">{children}</main>
		</div>
	);
}

export default StoreLayout;
