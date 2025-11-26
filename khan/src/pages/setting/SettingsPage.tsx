import { useState, type JSX } from "react";
import BarcodePrinterSettings from "../../components/setting/BarcodePrinterSettings";
import "../../styles/pages/settingsPage.css";

type SettingCategory =
	| "생품관련"
	| "주문관련"
	| "재고관련"
	| "스톤관련"
	| "경비관련"
	| "사원및문자관련"
	| "프로그램설정";

interface SettingItem {
	id: string;
	label: string;
	category: SettingCategory;
	adminOnly?: boolean;
}

const settingItems: SettingItem[] = [
	// 생품관련
	{ id: "material", label: "재질 (14K,18K...)", category: "생품관련" },
	{ id: "harry", label: "해리 (1.1, 1.07...)", category: "생품관련" },
	{
		id: "product-type",
		label: "생품분류 (반지, 귀걸이...)",
		category: "생품관련",
	},
	{ id: "color", label: "색상 (G, W, B, R)", category: "생품관련" },
	{ id: "set-type", label: "세트 구분 (예륜, 전주)", category: "생품관련" },

	// 주문 / 판매 / 대여 관련
	{
		id: "order-classification",
		label: "급지구분 (급, 초급)",
		category: "주문관련",
	},

	// 재고 관련
	{
		id: "stock-classification",
		label: "메대구분 (금의, 벽정...)",
		category: "재고관련",
	},
	{ id: "barcode-printer", label: "바코드 프린터 설정", category: "재고관련" },

	// 스톤관련
	{
		id: "stone-type",
		label: "스톤 종류 (이큐비, 블랙큐빅...)",
		category: "스톤관련",
	},
	{
		id: "stone-shape",
		label: "스톤 모양 (라운드, 스퀘어...)",
		category: "스톤관련",
	},

	// 경비관련
	{ id: "expense-type", label: "지출(출비) 계정", category: "경비관련" },
	{ id: "income-type", label: "수입(챔A) 계정", category: "경비관련" },
	{ id: "special-type", label: "특정 구분", category: "경비관련" },

	// 사원 및 문자 관련
	{
		id: "employee-classification",
		label: "사원부서구분 (판리부, 판매부)",
		category: "사원및문자관련",
	},
	{
		id: "message-type",
		label: "문자구분 (안내, 축하...)",
		category: "사원및문자관련",
	},

	// 프로그램 사용 제한(Admin만 조작 가능)
	{
		id: "login-restriction",
		label: "로그인 후치 시간 제한",
		category: "프로그램설정",
		adminOnly: true,
	},
	{
		id: "user-alert-option",
		label: "사용 금지 요원 조정",
		category: "프로그램설정",
		adminOnly: true,
	},
	{
		id: "user-time-restriction",
		label: "사용 시간 조정",
		category: "프로그램설정",
		adminOnly: true,
	},
	{
		id: "purchase-code",
		label: "보산 코드 변경(사앨린 허용시 X하는 해당사항 없슴)",
		category: "프로그램설정",
		adminOnly: true,
	},
	{
		id: "harry-restriction",
		label: "허용할 PK(사앨린 해당인무겨처는 해당사항 없슴)",
		category: "프로그램설정",
		adminOnly: true,
	},
];

const categories: SettingCategory[] = [
	"생품관련",
	"주문관련",
	"재고관련",
	"스톤관련",
	"경비관련",
	"사원및문자관련",
	"프로그램설정",
];

export default function SettingsPage(): JSX.Element {
	const [selectedCategory, setSelectedCategory] =
		useState<SettingCategory>("생품관련");
	const [selectedItem, setSelectedItem] = useState<string | null>(null);

	const filteredItems = settingItems.filter(
		(item) => item.category === selectedCategory
	);

	const renderSettingContent = () => {
		if (!selectedItem) {
			return (
				<div className="no-selection">
					<p>왼쪽 메뉴에서 설정 항목을 선택하세요.</p>
				</div>
			);
		}

		// 바코드 프린터 설정인 경우
		if (selectedItem === "barcode-printer") {
			return (
				<div className="setting-content">
					<h2>바코드 프린터 설정</h2>
					<BarcodePrinterSettings />
				</div>
			);
		}

		// 다른 설정 항목들은 준비 중 표시
		const item = settingItems.find((i) => i.id === selectedItem);
		return (
			<div className="setting-content">
				<h2>{item?.label}</h2>
				<div className="coming-soon">
					<p>이 설정 페이지는 개발 중입니다.</p>
				</div>
			</div>
		);
	};

	return (
		<div className="settings-page">
			<div className="settings-sidebar">
				<h2 className="sidebar-title">설정</h2>
				{categories.map((category) => (
					<div key={category} className="category-section">
						<div
							className={`category-header ${
								selectedCategory === category ? "active" : ""
							}`}
							onClick={() => setSelectedCategory(category)}
						>
							{category}
						</div>
						{selectedCategory === category && (
							<div className="category-items">
								{filteredItems.map((item) => (
									<div
										key={item.id}
										className={`setting-item ${
											selectedItem === item.id ? "active" : ""
										} ${item.adminOnly ? "admin-only" : ""}`}
										onClick={() => setSelectedItem(item.id)}
									>
										{item.label}
										{item.adminOnly && (
											<span className="admin-badge">Admin</span>
										)}
									</div>
								))}
							</div>
						)}
					</div>
				))}
			</div>
			<div className="settings-content">{renderSettingContent()}</div>
		</div>
	);
}
