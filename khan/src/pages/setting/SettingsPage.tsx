import { useState, type JSX } from "react";
import BarcodePrinterSettings from "../../components/setting/BarcodePrinterSettings";
import "../../styles/pages/settingsPage.css";

type SettingCategory = "상품" | "주문" | "재고" | "스톤" | "사용자 관리";

interface SettingItem {
	id: string;
	label: string;
	category: SettingCategory;
	modalType?:
		| "material"
		| "harry"
		| "classification"
		| "color"
		| "setType"
		| "priority"
		| "stoneType"
		| "stoneShape"
		| "user"
		| "role";
	adminOnly?: boolean;
}

const settingItems: SettingItem[] = [
	// 상품
	{
		id: "material",
		label: "재질",
		category: "상품",
		modalType: "material",
	},
	{ id: "harry", label: "해리", category: "상품", modalType: "harry" },
	{
		id: "product-type",
		label: "분류",
		category: "상품",
		modalType: "classification",
	},
	{ id: "color", label: "색상", category: "상품", modalType: "color" },
	{
		id: "set-type",
		label: "세트",
		category: "상품",
		modalType: "setType",
	},

	// 주문 / 판매 / 대여 관련
	{
		id: "order-classification",
		label: "급 구분",
		category: "주문",
		modalType: "priority",
	},

	// 재고 관련
	{ id: "barcode-printer", label: "바코드 프린터 설정", category: "재고" },

	// 스톤
	{
		id: "stone-type",
		label: "스톤 종류",
		category: "스톤",
		modalType: "stoneType",
	},
	{
		id: "stone-shape",
		label: "스톤 모양",
		category: "스톤",
		modalType: "stoneShape",
	},

	// 회원관리
	{
		id: "user",
		label: "사용자 목록",
		category: "사용자 관리",
		modalType: "user",
	}
];

const categories: SettingCategory[] = [
	"상품",
	"주문",
	"재고",
	"스톤",
	"사용자 관리",
];

export default function SettingsPage(): JSX.Element {
	const [showPrinterSettings, setShowPrinterSettings] = useState(false);

	const handleItemClick = (item: SettingItem) => {
		if (item.id === "barcode-printer") {
			setShowPrinterSettings(true);
		} else if (item.id === "user") {
			// 사용자 관리는 별도 팝업
			const width = 550;
			const height = 650;
			const left = window.screenX + (window.outerWidth - width) / 2;
			const top = window.screenY + (window.outerHeight - height) / 2;

			window.open(
				`/user-management`,
				`user_management_popup`,
				`width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
			);
		} else if (item.modalType) {
			// 새 창으로 설정 페이지 열기 (동일한 이름으로 하나의 팝업만 유지)
			const width = 550;
			const height = 600;
			const left = window.screenX + (window.outerWidth - width) / 2;
			const top = window.screenY + (window.outerHeight - height) / 2;

			const params = new URLSearchParams({
				type: item.modalType,
				title: item.label,
			});

			window.open(
				`/setting-item?${params.toString()}`,
				`setting_popup`,
				`width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
			);
		}
	};

	const closePrinterSettings = () => {
		setShowPrinterSettings(false);
	};

	// 카테고리별로 아이템을 그룹화
	const groupedItems = categories.map((category) => ({
		category,
		items: settingItems.filter((item) => item.category === category),
	}));

	return (
		<div className="setting-page">
			<div className="setting-list">
				{groupedItems.map((group) => (
					<div key={group.category} className="category-group">
						<h3 className="category-title">{group.category}</h3>
						<div className="category-grid">
							{group.items.map((item) => (
								<div
									key={item.id}
									className={`setting-card ${
										item.adminOnly ? "admin-only" : ""
									}`}
									onClick={() => handleItemClick(item)}
								>
									<div className="card-content">
										<span className="card-label">{item.label}</span>
										{item.adminOnly && (
											<span className="admin-badge">Admin</span>
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				))}
			</div>

			{/* 바코드 프린터 설정 모달 */}
			{showPrinterSettings && (
				<div className="modal-overlay" onClick={closePrinterSettings}>
					<div className="modal-content" onClick={(e) => e.stopPropagation()}>
						<div className="modal-header">
							<h2>바코드 프린터 설정</h2>
							<button className="close-btn" onClick={closePrinterSettings}>
								×
							</button>
						</div>
						<div className="modal-body">
							<BarcodePrinterSettings />
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
