import { useState, useEffect, type ReactNode } from "react";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";

interface LayoutProps {
	children: ReactNode;
	onLogout?: () => void;
}

function Layout({ children, onLogout }: LayoutProps) {
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [isMobile, setIsMobile] = useState(false);

	// 화면 크기 감지
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 767);
			// 모바일에서는 기본적으로 사이드바 닫기
			if (window.innerWidth <= 767) {
				setIsSidebarOpen(false);
			}
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	const toggleSidebar = () => {
		setIsSidebarOpen(!isSidebarOpen);
	};

	const closeSidebar = () => {
		if (isMobile) {
			setIsSidebarOpen(false);
		}
	};

	return (
		<div className="container">
			<TopBar
				onLogout={onLogout}
				onToggleSidebar={toggleSidebar}
				isSidebarOpen={isSidebarOpen}
			/>
			<div className="layout-body">
				{/* 모바일 사이드바 오버레이 */}
				{isMobile && isSidebarOpen && (
					<div
						className="sidebar-overlay visible"
						onClick={closeSidebar}
					/>
				)}
				<Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
				<main
					className={`main-content ${
						isSidebarOpen ? "with-sidebar" : "without-sidebar"
					}`}
				>
					{children}
				</main>
			</div>
		</div>
	);
}

export default Layout;
