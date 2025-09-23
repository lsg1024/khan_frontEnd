import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

interface SidebarItem {
	path: string;
	label: string;
	icon?: string;
	children?: SidebarItem[];
}

interface SidebarProps {
	isOpen?: boolean;
}

const sidebarItems: SidebarItem[] = [
	{ path: "/", label: "홈", icon: "🏠" },
	{ path: "/profile", label: "프로필", icon: "👤" },
	{ path: "/catalog", label: "카탈로그", icon: "🛒" },
	{ path: "/stone", label: "스톤", icon: "💎" },
	{
		path: "/orders",
		label: "주문",
		icon: "📝",
		children: [
			{ path: "/orders", label: "주문 목록", icon: "📋" },
			{ path: "/fix", label: "수리 목록", icon: "🔧" },
			{ path: "/expact", label: "출고 목록", icon: "📦" },
			{ path: "/order-deleted", label: "삭제 목록", icon: "🗑️" },
		],
	},
	{ path: "/settings", label: "설정", icon: "⚙️" },
	{ path: "/help", label: "도움말", icon: "❓" },
];

export const Sidebar = ({ isOpen = true }: SidebarProps) => {
	const navigate = useNavigate();
	const location = useLocation();
	const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

	const handleNavigation = (path: string) => {
		navigate(path);
	};

	const toggleExpanded = (path: string) => {
		setExpandedItems((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(path)) {
				newSet.delete(path);
			} else {
				newSet.add(path);
			}
			return newSet;
		});
	};

	const isItemActive = (item: SidebarItem): boolean => {
		if (location.pathname === item.path) return true;
		if (item.children) {
			return item.children.some((child) => location.pathname === child.path);
		}
		return false;
	};

	// 현재 페이지에 해당하는 하위 메뉴가 있으면 자동으로 펼치기
	useEffect(() => {
		sidebarItems.forEach((item) => {
			if (item.children) {
				const hasActiveChild = item.children.some(
					(child) => location.pathname === child.path
				);
				if (hasActiveChild) {
					setExpandedItems((prev) => new Set([...prev, item.path]));
				}
			}
		});
	}, [location.pathname]);

	return (
		<div className={`sidebar ${isOpen ? "open" : "closed"}`}>
			<nav className="sidebar-nav">
				<ul className="nav-list">
					{sidebarItems.map((item) => (
						<li key={item.path} className="nav-item">
							<button
								className={`nav-link ${isItemActive(item) ? "active" : ""}`}
								onClick={() => {
									if (item.children) {
										toggleExpanded(item.path);
									} else {
										handleNavigation(item.path);
									}
								}}
							>
								{item.icon && <span className="nav-icon">{item.icon}</span>}
								<span className="nav-label">{item.label}</span>
								{item.children && (
									<span className="expand-icon">
										{expandedItems.has(item.path) ? "▼" : "▶"}
									</span>
								)}
							</button>

							{/* 하위 메뉴 */}
							{item.children && expandedItems.has(item.path) && (
								<ul className="nav-sub-list">
									{item.children.map((subItem) => (
										<li key={subItem.path} className="nav-sub-item">
											<button
												className={`nav-sub-link ${
													location.pathname === subItem.path ? "active" : ""
												}`}
												onClick={() => handleNavigation(subItem.path)}
											>
												{subItem.icon && (
													<span className="nav-icon">{subItem.icon}</span>
												)}
												<span className="nav-label">{subItem.label}</span>
											</button>
										</li>
									))}
								</ul>
							)}
						</li>
					))}
				</ul>
			</nav>
		</div>
	);
};

export default Sidebar;
