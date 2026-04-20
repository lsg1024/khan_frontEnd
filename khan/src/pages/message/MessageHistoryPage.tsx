import { useState, useEffect, useCallback } from "react";
import { messageApi } from "../../../libs/api/messageApi";
import type { MessageHistoryItem } from "../../types/messageDto";
import Pagination from "../../components/common/Pagination";
import { useToast } from "../../components/common/toast/Toast";
import "../../styles/pages/message.css";

interface HistoryFilters {
	receiverName: string;
	receiverPhone: string;
	content: string;
	startDate: string;
	endDate: string;
}

const EMPTY_FILTERS: HistoryFilters = {
	receiverName: "",
	receiverPhone: "",
	content: "",
	startDate: "",
	endDate: "",
};

const MessageHistoryPage = () => {
	const [history, setHistory] = useState<MessageHistoryItem[]>([]);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);
	const [loading, setLoading] = useState(false);
	// 입력값(input state)
	const [filters, setFilters] = useState<HistoryFilters>(EMPTY_FILTERS);
	// 실제로 적용된 검색 조건 (검색 버튼 누를 때 반영)
	const [appliedFilters, setAppliedFilters] =
		useState<HistoryFilters>(EMPTY_FILTERS);
	const { showToast } = useToast();

	const loadHistory = useCallback(
		async (currentPage: number, applied: HistoryFilters) => {
			setLoading(true);
			try {
				const response = await messageApi.getHistory(
					currentPage,
					20,
					applied
				);
				if (response.success && response.data) {
					setHistory(response.data.content || []);
					setTotalPages(response.data.totalPages || 0);
					setTotalElements(response.data.totalElements || 0);
				}
			} catch {
				showToast("전송 이력을 불러올 수 없습니다.", "error", 3000);
			} finally {
				setLoading(false);
			}
		},
		[showToast]
	);

	useEffect(() => {
		loadHistory(page, appliedFilters);
	}, [page, appliedFilters, loadHistory]);

	const handleSearch = () => {
		if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
			showToast("시작일이 종료일보다 클 수 없습니다.", "warning", 3000);
			return;
		}
		setPage(1);
		setAppliedFilters(filters);
	};

	const handleReset = () => {
		setFilters(EMPTY_FILTERS);
		setPage(1);
		setAppliedFilters(EMPTY_FILTERS);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			handleSearch();
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

	return (
		<div className="page">
			{/* 검색 영역 */}
			<div className="search-section-common">
				<div className="search-filters-common">
					<div className="filter-row-common">
						<input
							type="text"
							className="search-input-common"
							style={{ maxWidth: "180px" }}
							placeholder="수신자(거래처)"
							value={filters.receiverName}
							onChange={(e) =>
								setFilters((prev) => ({
									...prev,
									receiverName: e.target.value,
								}))
							}
							onKeyDown={handleKeyDown}
						/>
						<input
							type="text"
							className="search-input-common"
							style={{ maxWidth: "160px" }}
							placeholder="전화번호"
							value={filters.receiverPhone}
							onChange={(e) =>
								setFilters((prev) => ({
									...prev,
									receiverPhone: e.target.value,
								}))
							}
							onKeyDown={handleKeyDown}
						/>
						<input
							type="text"
							className="search-input-common"
							style={{ flex: 1, minWidth: "180px" }}
							placeholder="내용"
							value={filters.content}
							onChange={(e) =>
								setFilters((prev) => ({
									...prev,
									content: e.target.value,
								}))
							}
							onKeyDown={handleKeyDown}
						/>
					</div>
					<div className="filter-row-common">
						<div className="message-date-range">
							<input
								type="date"
								value={filters.startDate}
								onChange={(e) =>
									setFilters((prev) => ({
										...prev,
										startDate: e.target.value,
									}))
								}
							/>
							<span>~</span>
							<input
								type="date"
								value={filters.endDate}
								onChange={(e) =>
									setFilters((prev) => ({
										...prev,
										endDate: e.target.value,
									}))
								}
							/>
						</div>
						<div className="search-buttons-common">
							<button
								className="search-btn-common"
								onClick={handleSearch}
								disabled={loading}
							>
								검색
							</button>
							<button
								className="reset-btn-common"
								onClick={handleReset}
								disabled={loading}
							>
								초기화
							</button>
						</div>
					</div>
				</div>
			</div>

			<div className="list">
				<table className="table">
					<thead>
						<tr>
							<th>전송일시</th>
							<th>수신자</th>
							<th>전화번호</th>
							<th>내용</th>
							<th>상태</th>
							<th>전송자</th>
							<th>비고</th>
						</tr>
					</thead>
					<tbody>
						{history.length === 0 ? (
							<tr>
								<td colSpan={7} className="empty-row">
									{loading ? "로딩 중..." : "전송 이력이 없습니다."}
								</td>
							</tr>
						) : (
							history.map((item) => (
								<tr
									key={item.id}
									className={
										item.status === "SUCCESS"
											? "row-success"
											: "row-failed"
									}
								>
									<td>{formatDate(item.createdAt)}</td>
									<td>{item.receiverName}</td>
									<td>{item.receiverPhone || "-"}</td>
									<td className="content-cell">
										{item.content}
									</td>
									<td>
										{item.status === "SUCCESS"
											? "성공"
											: "실패"}
									</td>
									<td>{item.sentBy}</td>
									<td>{item.errorMessage || "-"}</td>
								</tr>
							))
						)}
					</tbody>
				</table>

				<Pagination
					currentPage={page}
					totalPages={totalPages}
					totalElements={totalElements}
					loading={loading}
					onPageChange={setPage}
				/>
			</div>
		</div>
	);
};

export default MessageHistoryPage;
