import { useState, useEffect } from "react";
import { stockApi } from "../../../libs/api/stockApi";
import type { ResponseDetail } from "../../types/stockDto";
import "../../styles/components/stock/InventoryStockDetailModal.css";

interface InventoryStockDetailModalProps {
	isOpen: boolean;
	flowCode: string | null;
	onClose: () => void;
}

const InventoryStockDetailModal = ({
	isOpen,
	flowCode,
	onClose,
}: InventoryStockDetailModalProps) => {
	const [stockDetail, setStockDetail] = useState<ResponseDetail | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string>("");

	useEffect(() => {
		if (isOpen && flowCode) {
			fetchStockDetail();
		} else {
			setStockDetail(null);
			setError("");
		}
	}, [isOpen, flowCode]);

	const fetchStockDetail = async () => {
		if (!flowCode) return;

		setLoading(true);
		setError("");

		try {
			const response = await stockApi.getStock([flowCode]);
			if (response.success && response.data && response.data.length > 0) {
				setStockDetail(response.data[0]);
			} else {
				setError("재고 정보를 찾을 수 없습니다.");
			}
		} catch {
			setError("재고 정보를 불러오는데 실패했습니다.");
		} finally {
			setLoading(false);
		}
	};

	const formatDate = (dateStr: string) => {
		if (!dateStr) return "-";
		const date = new Date(dateStr);
		return date.toLocaleString("ko-KR", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	if (!isOpen) return null;

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div
				className="modal-content inventory-stock-detail-modal"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="modal-header">
					<h2>재고 상세 정보</h2>
					<button className="modal-close-button" onClick={onClose}>
						×
					</button>
				</div>
				<div className="modal-body">
					{loading ? (
						<div className="loading-container">
							<div className="spinner"></div>
							<p>로딩 중...</p>
						</div>
					) : error ? (
						<div className="error-container">
							<p>{error}</p>
						</div>
					) : stockDetail ? (
						<div className="stock-detail-content">
							{/* 기본 정보 */}
							<div className="detail-section">
								<h3 className="section-title">기본 정보</h3>
								<div className="detail-grid">
									<div className="detail-item">
										<span className="detail-label">고유번호</span>
										<span className="detail-value highlight">
											{stockDetail.flowCode}
										</span>
									</div>
									<div className="detail-item">
										<span className="detail-label">등록일</span>
										<span className="detail-value">
											{formatDate(stockDetail.createAt)}
										</span>
									</div>
									<div className="detail-item">
										<span className="detail-label">상태</span>
										<span className="detail-value">
											{stockDetail.originalProductStatus}
										</span>
									</div>
								</div>
							</div>

							{/* 상품 정보 */}
							<div className="detail-section">
								<h3 className="section-title">상품 정보</h3>
								<div className="detail-grid">
									<div className="detail-item">
										<span className="detail-label">상품명</span>
										<span className="detail-value">
											{stockDetail.productName}
										</span>
									</div>
									<div className="detail-item">
										<span className="detail-label">사이즈</span>
										<span className="detail-value">
											{stockDetail.productSize || "-"}
										</span>
									</div>
									<div className="detail-item">
										<span className="detail-label">재질</span>
										<span className="detail-value">
											{stockDetail.materialName}
										</span>
									</div>
									<div className="detail-item">
										<span className="detail-label">색상</span>
										<span className="detail-value">
											{stockDetail.colorName || "-"}
										</span>
									</div>
								</div>
							</div>

							{/* 중량 정보 */}
							<div className="detail-section">
								<h3 className="section-title">중량 정보</h3>
								<div className="detail-grid">
									<div className="detail-item">
										<span className="detail-label">금중량</span>
										<span className="detail-value">
											{stockDetail.goldWeight}g
										</span>
									</div>
									<div className="detail-item">
										<span className="detail-label">알중량</span>
										<span className="detail-value">
											{stockDetail.stoneWeight}g
										</span>
									</div>
								</div>
							</div>

							{/* 가격 정보 */}
							<div className="detail-section">
								<h3 className="section-title">가격 정보</h3>
								<div className="detail-grid">
									<div className="detail-item">
										<span className="detail-label">매입가</span>
										<span className="detail-value">
											{stockDetail.productPurchaseCost?.toLocaleString()}원
										</span>
									</div>
									<div className="detail-item">
										<span className="detail-label">기본 공임</span>
										<span className="detail-value">
											{stockDetail.productLaborCost?.toLocaleString()}원
										</span>
									</div>
									<div className="detail-item">
										<span className="detail-label">추가 공임</span>
										<span className="detail-value">
											{stockDetail.productAddLaborCost?.toLocaleString()}원
										</span>
									</div>
									<div className="detail-item">
										<span className="detail-label">스톤 추가 공임</span>
										<span className="detail-value">
											{stockDetail.stoneAddLaborCost?.toLocaleString()}원
										</span>
									</div>
								</div>
							</div>

							{/* 거래처 정보 */}
							<div className="detail-section">
								<h3 className="section-title">거래처 정보</h3>
								<div className="detail-grid">
									<div className="detail-item">
										<span className="detail-label">판매처</span>
										<span className="detail-value">
											{stockDetail.storeName || "-"}
										</span>
									</div>
									<div className="detail-item">
										<span className="detail-label">제조사</span>
										<span className="detail-value">
											{stockDetail.factoryName || "-"}
										</span>
									</div>
									<div className="detail-item">
										<span className="detail-label">해리</span>
										<span className="detail-value">
											{stockDetail.storeHarry || "-"}
										</span>
									</div>
								</div>
							</div>

							{/* 스톤 정보 */}
							<div className="detail-section">
								<h3 className="section-title">스톤 정보</h3>
								<div className="detail-grid">
									<div className="detail-item full-width">
										<span className="detail-label">메인스톤</span>
										<span className="detail-value">
											{stockDetail.mainStoneNote || "-"}
										</span>
									</div>
									<div className="detail-item full-width">
										<span className="detail-label">보조스톤</span>
										<span className="detail-value">
											{stockDetail.assistanceStoneNote || "-"}
										</span>
									</div>
									<div className="detail-item">
										<span className="detail-label">보조석 입고</span>
										<span className="detail-value">
											{stockDetail.assistantStone ? "Y" : "N"}
										</span>
									</div>
									<div className="detail-item">
										<span className="detail-label">보조석 종류</span>
										<span className="detail-value">
											{stockDetail.assistantStoneName || "-"}
										</span>
									</div>
								</div>

								{/* 스톤 상세 리스트 */}
								{stockDetail.stoneInfos && stockDetail.stoneInfos.length > 0 && (
									<div className="stone-list">
										<h4>스톤 상세</h4>
										<table className="stone-table">
											<thead>
												<tr>
													<th>스톤명</th>
													<th>수량</th>
													<th>매입가</th>
													<th>공임</th>
													<th>메인</th>
												</tr>
											</thead>
											<tbody>
												{stockDetail.stoneInfos.map((stone, idx) => (
													<tr key={idx}>
														<td>{stone.stoneName}</td>
														<td>{stone.quantity}</td>
														<td>
															{stone.purchaseCost?.toLocaleString()}원
														</td>
														<td>{stone.laborCost?.toLocaleString()}원</td>
														<td>{stone.mainStone ? "Y" : "N"}</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								)}
							</div>

							{/* 비고 */}
							{stockDetail.note && (
								<div className="detail-section">
									<h3 className="section-title">비고</h3>
									<div className="note-content">{stockDetail.note}</div>
								</div>
							)}
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
};

export default InventoryStockDetailModal;
