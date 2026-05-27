import { useEffect, useState } from "react";
import type { RecentActivityResponse } from "../../types/storeDto";

export type RecentActivityTab = "transactions" | "payment";

interface AccountRecentActivityModalProps {
	accountId: number;
	accountName: string;
	accountType: "store" | "factory";
	/** "transactions": 최근거래일 클릭 / "payment": 최근결제일 클릭 */
	initialTab: RecentActivityTab;
	/** 데이터 로드 함수. storeApi.getStoreRecentActivity 또는 factoryApi.getFactoryRecentActivity 래퍼. */
	loader: (id: string, limit: number) => Promise<{
		success: boolean;
		data?: RecentActivityResponse;
		message?: string;
	}>;
	onClose: () => void;
}

/**
 * Task 4-3 / 4-4 — 거래처/제조사 최근 활동 상세 모달.
 *
 * StorePage / FactoryPage 에서 최근거래일 또는 최근결제일 셀 클릭 시 열리며,
 * BE 의 /account/{stores|factories}/{id}/recent-activity 응답을 두 탭으로 노출한다.
 *
 * - 거래 내역 탭: 최근 N개 SALE 트랜잭션 (material, 순금중량, 금액, 일자).
 *                 상품명/사이즈 등은 order-service 영역이라 추후 확장 포인트.
 * - 결제 집계 탭: PAYMENT 누적 순금 중량, 누적 결제 금액(공임 포함), 결제 건수, 최근 결제일.
 */
const AccountRecentActivityModal: React.FC<AccountRecentActivityModalProps> = ({
	accountId,
	accountName,
	accountType,
	initialTab,
	loader,
	onClose,
}) => {
	const [activeTab, setActiveTab] = useState<RecentActivityTab>(initialTab);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string>("");
	const [data, setData] = useState<RecentActivityResponse | null>(null);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError("");
		loader(String(accountId), 20)
			.then((res) => {
				if (cancelled) return;
				if (res.success && res.data) {
					setData(res.data);
				} else {
					setError(res.message || "최근 활동을 불러오지 못했습니다.");
				}
			})
			.catch((err) => {
				if (cancelled) return;
				const msg =
					err instanceof Error ? err.message : "최근 활동 조회 중 오류.";
				setError(msg);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [accountId, loader]);

	const formatDate = (raw: string | null | undefined): string => {
		if (!raw) return "-";
		const d = new Date(raw);
		if (isNaN(d.getTime())) return raw;
		const yy = String(d.getFullYear()).slice(-2);
		const mm = String(d.getMonth() + 1).padStart(2, "0");
		const dd = String(d.getDate()).padStart(2, "0");
		const hh = String(d.getHours()).padStart(2, "0");
		const mi = String(d.getMinutes()).padStart(2, "0");
		return `${yy}-${mm}-${dd} ${hh}:${mi}`;
	};

	const formatMoney = (raw: string | null | undefined): string => {
		if (!raw) return "0";
		const n = Number(raw);
		return isNaN(n) ? raw : n.toLocaleString();
	};

	const headerLabel = accountType === "store" ? "거래처" : "제조사";

	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				background: "rgba(0,0,0,0.4)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				zIndex: 9999,
			}}
			onClick={onClose}
		>
			<div
				style={{
					background: "white",
					borderRadius: 8,
					width: "min(720px, 90vw)",
					maxHeight: "85vh",
					display: "flex",
					flexDirection: "column",
					boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
				}}
				onClick={(e) => e.stopPropagation()}
			>
				{/* 헤더 */}
				<div
					style={{
						padding: "16px 20px",
						borderBottom: "1px solid #e0e0e0",
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					<div>
						<div style={{ fontSize: 12, color: "#888" }}>{headerLabel}</div>
						<div style={{ fontSize: 18, fontWeight: 600 }}>{accountName}</div>
					</div>
					<button
						onClick={onClose}
						style={{
							border: "none",
							background: "transparent",
							fontSize: 24,
							cursor: "pointer",
							color: "#666",
						}}
						aria-label="닫기"
					>
						×
					</button>
				</div>

				{/* 탭 */}
				<div
					style={{
						display: "flex",
						borderBottom: "1px solid #e0e0e0",
					}}
				>
					<button
						onClick={() => setActiveTab("transactions")}
						style={{
							flex: 1,
							padding: "12px",
							border: "none",
							background:
								activeTab === "transactions" ? "white" : "#f5f5f5",
							borderBottom:
								activeTab === "transactions"
									? "2px solid var(--primary-color, #1976d2)"
									: "2px solid transparent",
							fontWeight: activeTab === "transactions" ? 600 : 400,
							cursor: "pointer",
						}}
					>
						거래 내역 (상품)
					</button>
					<button
						onClick={() => setActiveTab("payment")}
						style={{
							flex: 1,
							padding: "12px",
							border: "none",
							background: activeTab === "payment" ? "white" : "#f5f5f5",
							borderBottom:
								activeTab === "payment"
									? "2px solid var(--primary-color, #1976d2)"
									: "2px solid transparent",
							fontWeight: activeTab === "payment" ? 600 : 400,
							cursor: "pointer",
						}}
					>
						결제 집계 (금/공임)
					</button>
				</div>

				{/* 본문 */}
				<div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
					{loading && <div>불러오는 중...</div>}
					{!loading && error && (
						<div style={{ color: "#c62828" }}>{error}</div>
					)}
					{!loading && !error && data && activeTab === "transactions" && (
						<>
							{data.recentTransactions.length === 0 ? (
								<div style={{ color: "#999" }}>
									최근 거래 내역이 없습니다.
								</div>
							) : (
								<table
									className="table"
									style={{ width: "100%", fontSize: 13 }}
								>
									<thead>
										<tr>
											<th>거래일시</th>
											<th>재질</th>
											<th style={{ textAlign: "right" }}>순금(g)</th>
											<th style={{ textAlign: "right" }}>금액(원)</th>
											<th>거래번호</th>
											<th>비고</th>
										</tr>
									</thead>
									<tbody>
										{data.recentTransactions.map((t, idx) => (
											<tr key={`${t.saleCode || "nosale"}-${idx}`}>
												<td>{formatDate(t.transactionDate)}</td>
												<td>{t.material || "-"}</td>
												<td style={{ textAlign: "right" }}>
													{formatMoney(t.goldAmount)}
												</td>
												<td style={{ textAlign: "right" }}>
													{formatMoney(t.moneyAmount)}
												</td>
												<td>{t.saleCode || "-"}</td>
												<td>{t.note || "-"}</td>
											</tr>
										))}
									</tbody>
								</table>
							)}
						</>
					)}
					{!loading && !error && data && activeTab === "payment" && (
						<div style={{ lineHeight: 1.8 }}>
							<div
								style={{
									display: "grid",
									gridTemplateColumns: "140px 1fr",
									rowGap: 8,
								}}
							>
								<div style={{ color: "#666" }}>누적 순금 중량</div>
								<div style={{ fontWeight: 600 }}>
									{formatMoney(data.paymentSummary.totalGoldWeight)} g
								</div>
								<div style={{ color: "#666" }}>누적 결제 금액</div>
								<div style={{ fontWeight: 600 }}>
									{formatMoney(data.paymentSummary.totalMoneyAmount)} 원
								</div>
								<div style={{ color: "#666" }}>결제 건수</div>
								<div style={{ fontWeight: 600 }}>
									{data.paymentSummary.paymentCount}건
								</div>
								<div style={{ color: "#666" }}>최근 결제일</div>
								<div style={{ fontWeight: 600 }}>
									{formatDate(data.paymentSummary.lastPaymentDate)}
								</div>
							</div>
							<div
								style={{
									marginTop: 16,
									padding: 12,
									background: "#fafafa",
									borderRadius: 6,
									fontSize: 12,
									color: "#666",
								}}
							>
								※ "금액"은 transaction_history.moneyAmount 기반 누적값 입니다
								(결제에 포함된 공임 포함). 상품별 공임 분해는 향후 order-service
								연동 필요.
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default AccountRecentActivityModal;
