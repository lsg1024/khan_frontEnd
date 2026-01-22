import { useState, useEffect, useCallback, useRef } from "react";
import { storeApi } from "../../../libs/api/store";
import { isApiSuccess } from "../../../libs/api/config";
import type { StoreSearchDto } from "../../types/store";
import { useErrorHandler } from "../../utils/errorHandler";
import Pagination from "../../components/common/Pagination";
import AccountTable from "../../components/common/AccountTable";
import AccountBulkActionBar from "../../components/common/AccountBulkActionBar";
import AccountSearchBar from "../../components/common/AccountSearchBar";
import "../../styles/pages/account/StorePage.css";

export const StorePage = () => {
	const [searchName, setSearchName] = useState("");
	const [stores, setStores] = useState<StoreSearchDto[]>([]);
	const [loading, setLoading] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const accountDetailPopups = useRef<Map<number, Window>>(new Map());
	const accountCreatePopup = useRef<Window | null>(null);
	const size = 20;

	const { handleError } = useErrorHandler();

	const loadStores = useCallback(
		async (name: string, page: number) => {
			setLoading(true);

			try {
				const res = await storeApi.getStores(name, page, size);

				if (!isApiSuccess(res)) {
					alert(res.message || "거래처 데이터를 불러오지 못했습니다.");
					setStores([]);
					setCurrentPage(1);
					setTotalPages(0);
					setTotalElements(0);
					return;
				}

				const data = res.data;
				const content = data?.content ?? [];
				const pageInfo = data?.page;

				setStores(content);
				const uiPage = (pageInfo?.number ?? page - 1) + 1;
				setCurrentPage(uiPage);
				setTotalPages(pageInfo?.totalPages ?? 1);
				setTotalElements(pageInfo?.totalElements ?? content.length);
			} catch (err) {
				handleError(err);
				setStores([]);
				setCurrentPage(1);
				setTotalPages(0);
				setTotalElements(0);
			} finally {
				setLoading(false);
			}
		},
		[handleError]
	);

	useEffect(() => {
		loadStores("", 1);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			if (event.origin !== window.location.origin) return;

			if (
				event.data.type === "ACCOUNT_CREATED" ||
				event.data.type === "ACCOUNT_UPDATED"
			) {
				if (event.data.accountType === "store") {
					loadStores(searchName, currentPage);
				}
			}
		};

		window.addEventListener("message", handleMessage);
		return () => {
			window.removeEventListener("message", handleMessage);
		};
	}, [searchName, currentPage, loadStores]);

	const handleSearch = () => {
		setCurrentPage(1);
		loadStores(searchName, 1);
	};

	const handleReset = () => {
		setSearchName("");
		setCurrentPage(1);
		loadStores("", 1);
	};

	const handleSelectOne = (id: number) => {
		if (selectedId === id) {
			setSelectedId(null);
		} else {
			setSelectedId(id);
		}
	};

	const handleDetailClick = (id: number) => {
		const url = `/accounts/detail/${id}?type=store`;
		const NAME = `account_detail_${id}`;
		const FEATURES = "resizable=yes,scrollbars=yes,width=800,height=800";
		const existingPopup = accountDetailPopups.current.get(id);

		if (existingPopup && !existingPopup.closed) {
			existingPopup.focus();
		} else {
			const newPopup = window.open(url, NAME, FEATURES);
			if (newPopup) {
				accountDetailPopups.current.set(id, newPopup);

				// 팝업 닫힘 감지
				const checkClosed = setInterval(() => {
					if (newPopup.closed) {
						clearInterval(checkClosed);
						accountDetailPopups.current.delete(id);
					}
				}, 1000);
			} else {
				alert("팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.");
			}
		}
	};

	// 생성 페이지 팝업으로 열기
	const handleCreate = () => {
		const url = "/accounts/detail?type=store";
		const NAME = "account_create_store";
		const FEATURES = "resizable=yes,scrollbars=yes,width=800,height=800";

		if (accountCreatePopup.current && !accountCreatePopup.current.closed) {
			accountCreatePopup.current.focus();
		} else {
			const newPopup = window.open(url, NAME, FEATURES);
			if (newPopup) {
				accountCreatePopup.current = newPopup;

				// 팝업 닫힘 감지
				const checkClosed = setInterval(() => {
					if (newPopup.closed) {
						clearInterval(checkClosed);
						accountCreatePopup.current = null;
					}
				}, 1000);
			} else {
				alert("팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.");
			}
		}
	};

	// 해리 수정
	const handleUpdateHarry = async (harryId: string) => {
		if (!selectedId) return;

		try {
			const res = await storeApi.updateHarry(String(selectedId), harryId);
			if (!isApiSuccess(res)) {
				alert(res.message || "해리 수정에 실패했습니다.");
				return;
			}
			alert("해리가 수정되었습니다.");
			loadStores(searchName, currentPage);
		} catch {
			alert("해리 수정 중 오류가 발생했습니다.");
		}
	};

	// 등급 수정
	const handleUpdateGrade = async (grade: string) => {
		if (!selectedId) return;

		try {
			const res = await storeApi.updateGrade(String(selectedId), grade);
			if (!isApiSuccess(res)) {
				alert(res.message || "등급 수정에 실패했습니다.");
				return;
			}
			alert("등급이 수정되었습니다.");
			loadStores(searchName, currentPage);
		} catch {
			alert("등급 수정 중 오류가 발생했습니다.");
		}
	};

	// 삭제
	const handleDelete = async () => {
		if (!selectedId) return;

		try {
			const res = await storeApi.deleteStore(String(selectedId));
			if (!isApiSuccess(res)) {
				alert(res.message || "삭제에 실패했습니다.");
				return;
			}
			alert("삭제되었습니다.");
			setSelectedId(null);
			loadStores(searchName, currentPage);
		} catch {
			alert("삭제 중 오류가 발생했습니다.");
		}
	};

	const handleExcel = async () => {
		try {
			const response = await storeApi.downloadExcel();
			const blob = new Blob([response.data], {
				type: response.headers["content-type"],
			});

			const contentDisposition = response.headers["content-disposition"];
			let fileName = "판매처.xlsx";
			if (contentDisposition) {
				const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
				if (fileNameMatch && fileNameMatch.length === 2) {
					fileName = decodeURIComponent(fileNameMatch[1]);
				}
			}

			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.setAttribute("download", fileName);
			document.body.appendChild(link);
			link.click();

			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch (err) {
			handleError(err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="page">
			{/* 검색 영역 */}
			<AccountSearchBar
				searchName={searchName}
				onSearchNameChange={setSearchName}
				onSearch={handleSearch}
				onReset={handleReset}
				onCreate={handleCreate}
				onExcelDownload={handleExcel}
				loading={loading}
			/>

			{/* 거래처 목록 */}
			<div className="list">
				{loading ? (
					<div className="loading-container">
						<div className="spinner"></div>
						<p>거래처 목록을 불러오는 중...</p>
					</div>
				) : stores.length === 0 ? (
					<div className="empty-state">
						<span className="empty-icon">📋</span>
						<h3>거래처가 없습니다</h3>
						<p>등록된 거래처가 없습니다.</p>
					</div>
				) : (
					<AccountTable
						data={stores}
						columns={[
							{ key: "accountName", label: "거래처명" },
							{ key: "businessOwnerName", label: "대표자" },
							{ key: "businessOwnerNumber", label: "연락처" },
							{ key: "faxNumber", label: "팩스" },
							{ key: "businessNumber1", label: "사업장번호1" },
							{ key: "businessNumber2", label: "사업장번호2" },
							{ key: "address", label: "주소", maxWidth: "200px" },
							{ key: "grade", label: "등급" },
							{ key: "goldHarryLoss", label: "해리" },
							{ key: "tradeType", label: "거래방식" },
							{ key: "note", label: "비고", maxWidth: "150px" },
						]}
						selectedIds={
							selectedId !== null ? new Set([selectedId]) : new Set()
						}
						currentPage={currentPage}
						size={size}
						onSelectOne={handleSelectOne}
						onDetailClick={handleDetailClick}
						getItemId={(item) => (item as StoreSearchDto).accountId!}
					/>
				)}
				{/* BulkActionBar */}
				<AccountBulkActionBar
					selectedCount={selectedId !== null ? 1 : 0}
					onUpdateHarry={handleUpdateHarry}
					onUpdateGrade={handleUpdateGrade}
					onDelete={handleDelete}
					onCancel={() => setSelectedId(null)}
				/>{" "}
				{/* 페이지네이션 */}
				{!loading && stores.length > 0 && (
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						totalElements={totalElements}
						loading={loading}
						onPageChange={(page) => {
							loadStores(searchName, page);
						}}
						className="store"
					/>
				)}
			</div>
		</div>
	);
};

export default StorePage;
