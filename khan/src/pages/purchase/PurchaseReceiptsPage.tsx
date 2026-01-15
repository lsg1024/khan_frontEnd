import { useState, useEffect } from "react";
import { factoryApi } from "../../../libs/api/factory";
import type { FactoryPurchaseDto } from "../../types/factory";
import { getLocalDate } from "../../utils/dateUtils";
import { getGoldTransferWeight } from "../../utils/goldUtils";
import Pagination from "../../components/common/Pagination";
import "../../styles/pages/purchase/PurchaseReceiptsPage.css";

export const PurchaseReceiptsPage = () => {
	const [loading, setLoading] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);
	const [purchases, setPurchases] = useState<FactoryPurchaseDto[]>([]);
	const [endAt, setEndAt] = useState<string>(getLocalDate());
	const pageSize = 12;

	// 공장 매입금 조회
	const fetchPurchases = async () => {
		setLoading(true);
		try {
			const response = await factoryApi.getFactoriesPurchase(
				endAt || undefined,
				currentPage,
				pageSize
			);

			if (response.success && response.data) {
				setPurchases(response.data.content);
				setTotalPages(response.data.page.totalPages);
				setTotalElements(response.data.page.totalElements);
			} else {
				alert("공장 매입금 조회에 실패했습니다.");
			}
		} catch (error) {
			console.error("공장 매입금 조회 오류:", error);
			alert("공장 매입금 조회 중 오류가 발생했습니다.");
		} finally {
			setLoading(false);
		}
	};

	// 페이지 변경 시 조회
	useEffect(() => {
		fetchPurchases();
	}, []);

	// 검색 버튼 클릭
	const handleSearch = () => {
		setCurrentPage(1);
		fetchPurchases();
	};

	// 페이지 변경
	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	return (
		<div className="purchase-receipts-page">
			{/* 검색 영역 */}
			<div className="search-section-common">
				<div className="search-filters-common">
					<div className="filter-row-common">
						<div className="date-range-common">
							<label htmlFor="endAt">기준일:</label>
							<input
								type="date"
								id="endAt"
								value={endAt}
								onChange={(e) => setEndAt(e.target.value)}
								max={getLocalDate()}
							/>
							<button
								className="search-btn-common"
								onClick={handleSearch}
								disabled={loading}
							>
								{loading ? "조회 중..." : "조회"}
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* 결과 테이블 */}
			<div className="purchase-list">
				<table className="table purchase-table">
					<thead>
						<tr>
							<th>No</th>
							<th>공장명</th>
							<th>금 중량 (g)</th>
							<th>순금 (돈)</th>
							<th>미수금 (원)</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr>
								<td colSpan={5} className="loading-cell">
									조회 중...
								</td>
							</tr>
						) : purchases.length === 0 ? (
							<tr>
								<td colSpan={5} className="empty-cell">
									조회된 데이터가 없습니다.
								</td>
							</tr>
						) : (
							purchases.map((purchase, index) => (
								<tr key={purchase.accountId}>
									<td>{(currentPage - 1) * pageSize + index + 1}</td>
									<td>{purchase.accountName}</td>
									<td className="number-cell">{purchase.goldWeight}g</td>
									<td className="number-cell">
										{getGoldTransferWeight(purchase.goldWeight, "24K")}돈
									</td>
									<td className="number-cell">
										{Number(purchase.moneyAmount).toLocaleString()}원
									</td>
								</tr>
							))
						)}
					</tbody>
					{!loading && purchases.length > 0 && (
						<tfoot>
							<tr className="summary-row final-summary">
								<td colSpan={2} className="summary-label">
									합계
								</td>
								<td style={{ textAlign: "end" }}>
									{purchases
										.reduce((sum, p) => sum + (Number(p.goldWeight) || 0), 0)
										.toFixed(3)}
									g
								</td>
								<td style={{ textAlign: "end" }}>
									{purchases
										.reduce(
											(sum, p) =>
												sum +
												Number(getGoldTransferWeight(p.goldWeight, "24K")),
											0
										)
										.toFixed(3)}
									돈
								</td>
								<td style={{ textAlign: "end" }}>
									{purchases
										.reduce((sum, p) => sum + (Number(p.moneyAmount) || 0), 0)
										.toLocaleString()}
									원
								</td>
							</tr>
						</tfoot>
					)}
				</table>

				{/* 페이징 */}
				<Pagination
					currentPage={currentPage}
					totalPages={totalPages}
					totalElements={totalElements}
					loading={loading}
					onPageChange={handlePageChange}
				/>
			</div>
		</div>
	);
};

export default PurchaseReceiptsPage;
