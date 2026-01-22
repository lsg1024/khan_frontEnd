import { useState, useEffect, useCallback, useRef } from "react";
import { factoryApi } from "../../../libs/api/factory";
import { isApiSuccess } from "../../../libs/api/config";
import type { FactorySearchDto } from "../../types/factory";
import { useErrorHandler } from "../../utils/errorHandler";
import Pagination from "../../components/common/Pagination";
import AccountTable from "../../components/common/AccountTable";
import AccountBulkActionBar from "../../components/common/AccountBulkActionBar";
import AccountSearchBar from "../../components/common/AccountSearchBar";
import "../../styles/pages/account/FactoryPage.css";

export const FactoryPage = () => {
	const [searchName, setSearchName] = useState("");
	const [factories, setFactories] = useState<FactorySearchDto[]>([]);
	const [loading, setLoading] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [totalElements, setTotalElements] = useState(0);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const accountDetailPopups = useRef<Map<number, Window>>(new Map());
	const accountCreatePopup = useRef<Window | null>(null);

	const size = 20;

	const { handleError } = useErrorHandler();

	// 제조사 목록 조회
	const loadFactories = useCallback(
		async (name: string, page: number) => {
			setLoading(true);

			try {
				const res = await factoryApi.getFactories(name, page, false, size);

				if (!isApiSuccess(res)) {
					alert(res.message || "제조사 데이터를 불러오지 못했습니다.");
					setFactories([]);
					setCurrentPage(1);
					setTotalPages(0);
					setTotalElements(0);
					return;
				}

				const data = res.data;
				const content = data?.content ?? [];
				const pageInfo = data?.page;

				setFactories(content);
				const uiPage = (pageInfo?.number ?? page - 1) + 1;
				setCurrentPage(uiPage);
				setTotalPages(pageInfo?.totalPages ?? 1);
				setTotalElements(pageInfo?.totalElements ?? content.length);
			} catch (err) {
				handleError(err);
				setFactories([]);
				setCurrentPage(1);
				setTotalPages(0);
				setTotalElements(0);
			} finally {
				setLoading(false);
			}
		},
		[handleError]
	);

	// 초기 데이터 로드
	useEffect(() => {
		loadFactories("", 1);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// 메시지 이벤트 리스너
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			if (event.origin !== window.location.origin) return;

			if (
				event.data.type === "ACCOUNT_CREATED" ||
				event.data.type === "ACCOUNT_UPDATED"
			) {
				if (event.data.accountType === "factory") {
					loadFactories(searchName, currentPage);
				}
			}
		};

		window.addEventListener("message", handleMessage);
		return () => {
			window.removeEventListener("message", handleMessage);
		};
	}, [searchName, currentPage, loadFactories]);

	// 검색 처리
	const handleSearch = () => {
		setCurrentPage(1);
		loadFactories(searchName, 1);
	};

	// 초기화 처리
	const handleReset = () => {
		setSearchName("");
		setCurrentPage(1);
		loadFactories("", 1);
	};

	// 생성 페이지 팝업으로 열기
	const handleCreate = () => {
		const url = "/accounts/detail?type=factory";
		const NAME = "account_create_factory";
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

	const handleExcel = async () => {
		try {
			const response = await factoryApi.downloadExcel();
			const blob = new Blob([response.data], {
				type: response.headers["content-type"],
			});

			const contentDisposition = response.headers["content-disposition"];
			let fileName = "매입처.xlsx";
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

	// 개별 선택/해제
	const handleSelectOne = (id: number) => {
		if (selectedId === id) {
			setSelectedId(null);
		} else {
			setSelectedId(id);
		}
	};

	// 해리 수정
	const handleUpdateHarry = async (harryId: string) => {
		if (!selectedId) return;

		try {
			const res = await factoryApi.updateHarry(String(selectedId), harryId);
			if (!isApiSuccess(res)) {
				alert(res.message || "해리 수정에 실패했습니다.");
				return;
			}
			alert("해리가 수정되었습니다.");
			loadFactories(searchName, currentPage);
		} catch {
			alert("해리 수정 중 오류가 발생했습니다.");
		}
	};

	// 등급 수정
	const handleUpdateGrade = async (grade: string) => {
		if (!selectedId) return;

		try {
			const res = await factoryApi.updateGrade(String(selectedId), grade);
			if (!isApiSuccess(res)) {
				alert(res.message || "등급 수정에 실패했습니다.");
				return;
			}
			alert("등급이 수정되었습니다.");
			loadFactories(searchName, currentPage);
		} catch {
			alert("등급 수정 중 오류가 발생했습니다.");
		}
	};

	// 삭제
	const handleDelete = async () => {
		if (!selectedId) return;

		try {
			const res = await factoryApi.deleteFactory(String(selectedId));
			if (!isApiSuccess(res)) {
				alert(res.message || "삭제에 실패했습니다.");
				return;
			}
			alert("삭제되었습니다.");
			setSelectedId(null);
			loadFactories(searchName, currentPage);
		} catch {
			alert("삭제 중 오류가 발생했습니다.");
		}
	};

	// 상세 페이지 팝업으로 열기
	const handleDetailClick = (id: number) => {
		const url = `/accounts/detail/${id}?type=factory`;
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

			{/* 제조사 목록 */}
			<div className="list">
				{loading ? (
					<div className="loading-container">
						<div className="spinner"></div>
						<p>제조사 목록을 불러오는 중...</p>
					</div>
				) : factories.length === 0 ? (
					<div className="empty-state">
						<span className="empty-icon">🏭</span>
						<h3>제조사가 없습니다</h3>
						<p>등록된 제조사가 없습니다.</p>
					</div>
				) : (
					<AccountTable
						data={factories}
						columns={[
							{ key: "factoryName", label: "제조사명" },
							{ key: "factoryOwnerName", label: "대표자" },
							{ key: "factoryPhoneNumber", label: "전화번호" },
							{ key: "factoryContactNumber1", label: "연락처1" },
							{ key: "factoryContactNumber2", label: "연락처2" },
							{ key: "factoryFaxNumber", label: "팩스" },
							{ key: "grade", label: "등급" },
							{ key: "goldHarryLoss", label: "해리" },
							{ key: "tradeType", label: "거래방식" },
							{ key: "address", label: "주소", maxWidth: "200px" },
							{ key: "factoryNote", label: "비고", maxWidth: "150px" },
						]}
						selectedIds={
							selectedId !== null ? new Set([selectedId]) : new Set()
						}
						currentPage={currentPage}
						size={size}
						onSelectOne={handleSelectOne}
						onDetailClick={handleDetailClick}
						getItemId={(item) => (item as FactorySearchDto).factoryId!}
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
				{!loading && factories.length > 0 && (
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						totalElements={totalElements}
						loading={loading}
						onPageChange={(page) => {
							loadFactories(searchName, page);
						}}
						className="factory"
					/>
				)}
			</div>
		</div>
	);
};

export default FactoryPage;
