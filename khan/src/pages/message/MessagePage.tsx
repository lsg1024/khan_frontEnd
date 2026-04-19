import { useState, useEffect } from "react";
import { messageApi } from "../../../libs/api/messageApi";
import { storeApi } from "../../../libs/api/storeApi";
import { saleApi } from "../../../libs/api/saleApi";
import { getLocalDate } from "../../utils/dateUtils";
import type { SendResult } from "../../types/messageDto";
import { useToast } from "../../components/common/toast/Toast";
import "../../styles/pages/message.css";

interface StoreItem {
	storeId: number;
	storeName: string;
	storePhoneNumber?: string;
}

const DEFAULT_MESSAGE =
	"안녕하세요.\n오늘 물품이 내려갑니다.\n내일 통상 확인해주세요~";

const MessagePage = () => {
	const [stores, setStores] = useState<StoreItem[]>([]);
	const [selectedStoreIds, setSelectedStoreIds] = useState<Set<number>>(
		new Set()
	);
	const [content, setContent] = useState(DEFAULT_MESSAGE);
	const [loading, setLoading] = useState(false);
	const [saleLoading, setSaleLoading] = useState(false);
	const [results, setResults] = useState<SendResult[] | null>(null);
	const [storeSearch, setStoreSearch] = useState("");
	const [startDate, setStartDate] = useState(getLocalDate());
	const [endDate, setEndDate] = useState(getLocalDate());
	const { showToast } = useToast();

	useEffect(() => {
		loadStores();
	}, []);

	const loadStores = async () => {
		try {
			const response = await storeApi.getStores("", 1, 500);
			if (response.success && response.data) {
				const storeList = response.data.content || [];
				setStores(
					storeList.map((s) => ({
						storeId: s.accountId,
						storeName: s.accountName || "",
						storePhoneNumber: s.businessOwnerNumber,
					}))
				);
			}
		} catch {
			showToast("거래처 목록을 불러올 수 없습니다.", "error", 3000);
		}
	};

	const toggleStore = (storeId: number) => {
		setSelectedStoreIds((prev) => {
			const next = new Set(prev);
			if (next.has(storeId)) {
				next.delete(storeId);
			} else {
				next.add(storeId);
			}
			return next;
		});
	};

	const selectAll = () => {
		const filtered = filteredStores();
		if (selectedStoreIds.size === filtered.length && filtered.length > 0) {
			setSelectedStoreIds(new Set());
		} else {
			setSelectedStoreIds(new Set(filtered.map((s) => s.storeId)));
		}
	};

	const filteredStores = (): StoreItem[] => {
		if (!storeSearch) return stores;
		const keyword = storeSearch.toLowerCase();
		return stores.filter((s) =>
			(s.storeName || "").toLowerCase().includes(keyword)
		);
	};

	// 판매 내역 기반 거래처 자동 선택 — 거래처 ID/이름만 조회 (경량 API)
	const handleSaleLookup = async (start: string, end: string, label: string) => {
		setSaleLoading(true);
		try {
			const response = await saleApi.getSaleStores(start, end);

			if (response.success && response.data) {
				const saleStores = response.data;

				if (saleStores.length === 0) {
					showToast(`${label} 판매 등록된 내역이 없습니다.`, "warning", 3000);
					return;
				}

				// 판매 거래처 storeId 목록
				const saleStoreIds = new Set(
					saleStores.map((s) => s.storeId)
				);

				// 거래처 목록에서 매칭
				const matchedStoreIds = new Set(
					stores
						.filter((store) => saleStoreIds.has(store.storeId))
						.map((store) => store.storeId)
				);

				if (matchedStoreIds.size === 0) {
					// storeId 매칭 실패 시 storeName으로 폴백 시도
					const saleStoreNames = new Set(
						saleStores.map((s) => s.storeName)
					);
					const nameMatchedIds = new Set(
						stores
							.filter((store) => saleStoreNames.has(store.storeName))
							.map((store) => store.storeId)
					);

					if (nameMatchedIds.size === 0) {
						showToast(`${label} 판매 거래처와 일치하는 거래처가 없습니다.`, "warning", 3000);
						return;
					}

					setSelectedStoreIds(nameMatchedIds);
					setStoreSearch("");
					showToast(
						`${label} 판매 거래처 ${nameMatchedIds.size}곳이 선택되었습니다.`,
						"success",
						3000
					);
					return;
				}

				setSelectedStoreIds(matchedStoreIds);
				setStoreSearch("");
				showToast(
					`${label} 판매 거래처 ${matchedStoreIds.size}곳이 선택되었습니다.`,
					"success",
					3000
				);
			} else {
				showToast("판매 데이터를 불러올 수 없습니다.", "error", 3000);
			}
		} catch {
			showToast("판매 조회 중 오류가 발생했습니다.", "error", 3000);
		} finally {
			setSaleLoading(false);
		}
	};

	// 오늘 판매 버튼
	const handleTodaySale = () => {
		const today = getLocalDate();
		setStartDate(today);
		setEndDate(today);
		handleSaleLookup(today, today, "오늘");
	};

	// 판매 내역 버튼 (날짜 범위 기반)
	const handleDateRangeSale = () => {
		if (startDate > endDate) {
			showToast("시작일이 종료일보다 클 수 없습니다.", "warning", 3000);
			return;
		}
		handleSaleLookup(startDate, endDate, `${startDate} ~ ${endDate}`);
	};

	// 날짜 변경 핸들러
	const handleStartDateChange = (value: string) => {
		setStartDate(value);
		if (value > endDate) {
			setEndDate(value);
		}
	};

	const handleSend = async () => {
		if (selectedStoreIds.size === 0) {
			showToast("전송할 거래처를 선택해주세요.", "warning", 3000);
			return;
		}
		if (!content.trim()) {
			showToast("메시지 내용을 입력해주세요.", "warning", 3000);
			return;
		}

		if (!confirm(`${selectedStoreIds.size}개 거래처에 메시지를 전송하시겠습니까?`)) {
			return;
		}

		setLoading(true);
		setResults(null);

		try {
			const response = await messageApi.sendMessage({
				storeIds: Array.from(selectedStoreIds),
				content: content,
			});

			if (response.success && response.data) {
				setResults(response.data);
				const successCount = response.data.filter(
					(r) => r.status === "SUCCESS"
				).length;
				const failCount = response.data.filter(
					(r) => r.status === "FAILED"
				).length;
				showToast(
					`전송 완료: 성공 ${successCount}건, 실패 ${failCount}건`,
					failCount > 0 ? "warning" : "success",
					3000
				);
			} else {
				showToast(response.message || "전송에 실패했습니다.", "error", 3000);
			}
		} catch {
			showToast("메시지 전송 중 오류가 발생했습니다.", "error", 3000);
		} finally {
			setLoading(false);
		}
	};

	const filtered = filteredStores();

	return (
		<div className="page">
			{/* 검색 및 액션 영역 */}
			<div className="search-section-common">
				<div className="search-filters-common">
					{/* 날짜 범위 + 판매 조회 버튼 */}
					<div className="filter-row-common">
						<div className="message-date-range">
							<input
								type="date"
								value={startDate}
								onChange={(e) => handleStartDateChange(e.target.value)}
							/>
							<span>~</span>
							<input
								type="date"
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
							/>
						</div>
						<div className="search-buttons-common">
							<button
								className="search-btn-common"
								onClick={handleDateRangeSale}
								disabled={saleLoading}
							>
								{saleLoading ? "조회 중..." : "기간 판매 조회"}
							</button>
							<button
								className="search-btn-common"
								onClick={handleTodaySale}
								disabled={saleLoading}
							>
								오늘 판매
							</button>
						</div>
					</div>
					{/* 거래처 검색 + 전체 선택/초기화 */}
					<div className="filter-row-common">
						<input
							type="text"
							className="search-input-common"
							style={{ flex: 1, maxWidth: "300px" }}
							placeholder="거래처 검색..."
							value={storeSearch}
							onChange={(e) => setStoreSearch(e.target.value)}
						/>
						<div className="search-buttons-common">
							<button
								className="common-btn-common"
								onClick={selectAll}
							>
								{selectedStoreIds.size === filtered.length && filtered.length > 0
									? "전체 해제"
									: "전체 선택"}
							</button>
							<button
								className="reset-btn-common"
								onClick={() => {
									setStoreSearch("");
									setSelectedStoreIds(new Set());
									setResults(null);
									setContent(DEFAULT_MESSAGE);
									setStartDate(getLocalDate());
									setEndDate(getLocalDate());
								}}
							>
								초기화
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* 메인 레이아웃 */}
			<div className="list">
				<div className="message-layout">
					{/* 거래처 선택 */}
					<div className="message-stores-section">
						<div className="section-header">
							<h3>거래처 선택 ({selectedStoreIds.size}건)</h3>
						</div>

						<div className="store-list">
							{filtered.map((store) => (
								<label
									key={store.storeId}
									className={`store-item ${
										selectedStoreIds.has(store.storeId)
											? "selected"
											: ""
									}`}
								>
									<input
										type="checkbox"
										checked={selectedStoreIds.has(
											store.storeId
										)}
										onChange={() =>
											toggleStore(store.storeId)
										}
									/>
									<span className="store-name">
										{store.storeName}
									</span>
									<span className="store-phone">
										{store.storePhoneNumber || "번호 없음"}
									</span>
								</label>
							))}
							{filtered.length === 0 && (
								<p className="empty-message">
									{storeSearch ? "검색 결과가 없습니다." : "등록된 거래처가 없습니다."}
								</p>
							)}
						</div>
					</div>

					{/* 메시지 작성 */}
					<div className="message-content-section">
						<h3>메시지 내용</h3>
						<textarea
							className="message-textarea"
							value={content}
							onChange={(e) => setContent(e.target.value)}
							rows={6}
							maxLength={90}
							placeholder="메시지 내용을 입력하세요 (90자 이내)"
						/>
						<p className="char-count">{content.length} / 90자</p>

						<button
							className="search-btn-common send-btn"
							onClick={handleSend}
							disabled={
								loading || selectedStoreIds.size === 0
							}
						>
							{loading ? "전송 중..." : `메시지 전송 (${selectedStoreIds.size}건)`}
						</button>
					</div>
				</div>

				{/* 전송 결과 */}
				{results && (
					<div className="message-results-section">
						<h3>전송 결과</h3>
						<table className="table">
							<thead>
								<tr>
									<th>거래처</th>
									<th>전화번호</th>
									<th>상태</th>
									<th>비고</th>
								</tr>
							</thead>
							<tbody>
								{results.map((r, idx) => (
									<tr
										key={idx}
										className={
											r.status === "SUCCESS"
												? "row-success"
												: "row-failed"
										}
									>
										<td>{r.storeName}</td>
										<td>{r.phone || "-"}</td>
										<td>
											{r.status === "SUCCESS"
												? "성공"
												: "실패"}
										</td>
										<td>
											{r.errorMessage || "-"}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
};

export default MessagePage;
