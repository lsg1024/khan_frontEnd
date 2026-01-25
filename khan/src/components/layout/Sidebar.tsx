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
	onClose?: () => void;
}

const sidebarItems: SidebarItem[] = [
	{ path: "/", label: "홈", icon: "🏠" },
	{ path: "/catalog", label: "카탈로그", icon: "🛒" },
	{ path: "/stone", label: "스톤", icon: "💎" },
	{
		path: "/orders",
		label: "주문 관리",
		icon: "📝",
		children: [
			{ path: "/orders", label: "주문 목록"},
			{ path: "/fix", label: "수리 목록"},
			{ path: "/expect", label: "출고 목록"},
			{ path: "/order-deleted", label: "삭제 목록"},
		],
	},
	{
		path: "/stocks",
		label: "재고 관리",
		icon: "📦",
		children: [
			{ path: "/stocks", label: "재고 목록"},
			{ path: "/stocks/history", label: "누적 재고"},
			{ path: "/stocks/return", label: "반납 재고"},
			{ path: "/stocks/delete", label: "삭제 재고"},
		],
	},
	{
		path: "/sales",
		label: "판매 관리",
		icon: "💳",
		children: [
			{ path: "/sales", label: "판매 목록"},
			{ path: "/sales/receipts", label: "미수 금액"},
		],
	},
	{
		path: "/rentals",
		label: "대여 관리",
		icon: "📃",
		children: [
			{ path: "/rentals/now", label: "대여 현황"},
			{ path: "/rentals/records", label: "누적 대여"},
		],
	},
	// {
	// 	path: "/gold-money",
	// 	label: "금&현금",
	// 	icon: "💰"
	// },
	{
		path: "/purchase",
		label: "매입 관리",
		icon: "🛍️",
		children: [
			{ path: "/purchase", label: "매입 목록"},
			{ path: "/purchase/receipts", label: "매입 금액"},
		],
	},
	{
		path:"/accounts",
		label: "거래처",
		icon: "🏢",
		children: [
			{ path: "/accounts/store", label: "판매처"},
			{ path: "/accounts/factory", label: "매입처"},
		],
	},
	{ path: "/settings", label: "기초 관리", icon: "⚙️" }
];

export const Sidebar = ({ isOpen = true, onClose }: SidebarProps) => {
	const navigate = useNavigate();
	const location = useLocation();
	const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

	const handleNavigation = (path: string) => {
		navigate(path);
		// 모바일에서 메뉴 선택 시 사이드바 닫기
		onClose?.();
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
