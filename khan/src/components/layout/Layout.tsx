import { useState, type ReactNode } from "react";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";

interface LayoutProps {
	children: ReactNode;
	onLogout?: () => void;
}

function Layout({ children, onLogout }: LayoutProps) {
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);

	const toggleSidebar = () => {
		setIsSidebarOpen(!isSidebarOpen);
	};

	return (
		<div className="container">
			<TopBar
				onLogout={onLogout}
				onToggleSidebar={toggleSidebar}
				isSidebarOpen={isSidebarOpen}
			/>
			<div className="layout-body">
				<Sidebar isOpen={isSidebarOpen} />
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
