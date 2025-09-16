import { useState, useEffect, useCallback } from "react";
import { stoneApi } from "../../../libs/api/stone";
import { isApiSuccess } from "../../../libs/api/config";
import type { StoneSearchDto, ProductStoneDto } from "../../types/stone";
import type { PageInfo } from "../../types/page";
import StoneListTable from "../../components/common/stone/StoneListTable";
import Pagination from "../../components/common/Pagination";
import { useErrorHandler } from "../../utils/errorHandler";
import "../../styles/pages/StonePage.css";

const convertToProductStone = (stone: StoneSearchDto): ProductStoneDto => {
	return {
		productStoneId: stone.stoneId, // stoneId를 productStoneId로 사용
		stoneId: stone.stoneId,
		stoneName: stone.stoneName,
		stoneWeight: stone.stoneWeight,
		mainStone: false, // 기본값
		includeStone: true, // 기본값
		stonePurchase: stone.stonePurchasePrice,
		stoneQuantity: 1, // 기본값
		productStoneNote: stone.stoneNote || "",
		stoneWorkGradePolicyDtos: stone.stoneWorkGradePolicyDto || [],
	};
};

export const StonePage = () => {
	const [stones, setStones] = useState<ProductStoneDto[]>([]);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string>("");
	const [searchTerm, setSearchTerm] = useState<string>("");
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [pageInfo, setPageInfo] = useState<PageInfo>({
		size: 10,
		number: 1,
		totalElements: 0,
		totalPages: 0,
	});

	const { handleError } = useErrorHandler();

	// 스톤 목록 로드
	const loadStones = useCallback(async (search?: string, page: number = 1) => {
		try {
			setLoading(true);
			setError("");

			const response = await stoneApi.getStones(search, page, 20);

			if (isApiSuccess(response) && response.data) {
				const convertedStones = response.data.content.map((stone) =>
					convertToProductStone(stone)
				);
				setStones(convertedStones);
				setPageInfo(response.data.page);
				setCurrentPage(page);
			} else {
				setError("스톤 목록을 불러올 수 없습니다.");
			}
		} catch (err: unknown) {
			handleError(err, setError);
		} finally {
			setLoading(false);
		}
	}, []);

	const handleSearch = () => {
		setCurrentPage(1);
		loadStones(searchTerm, 1);
	};

	// 검색어 초기화
	const handleClearSearch = () => {
		setSearchTerm("");
		setCurrentPage(1);
		loadStones("", 1);
	};

	// 스톤 생성 핸들러
	const handleCreateStone = () => {
		const popup = window.open(
			"/stone/create", // 새 라우트
			"StoneCreateWindow", // 창 이름
			"width=1200,height=800,scrollbars=yes,resizable=yes"
		);
		if (!popup) {
			alert("팝업 차단을 해제해주세요.");
		}
	};

	// 엑셀 다운로드 핸들러 (임시로 alert 사용)
	const handleDownExcel = () => {
		alert("엑셀 다운로드 기능은 아직 구현되지 않았습니다.");
	};

	// 페이지 변경 핸들러
	const handlePageChange = (page: number) => {
		loadStones(searchTerm, page);
	};

	// Enter 키 검색
	const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			handleSearch();
		}
	};

	useEffect(() => {
		loadStones("", 1);
	}, [loadStones]);

	useEffect(() => {
		const onMessage = (e: MessageEvent) => {
			if (e.origin !== window.location.origin) return;
			if (e.data && e.data.type === "STONE_CREATED") {
				loadStones(searchTerm, currentPage);
			}
		};
		window.addEventListener("message", onMessage);
		return () => window.removeEventListener("message", onMessage);
	}, [loadStones, searchTerm, currentPage]);

	return (
		<div className="stone-page">
			{/* 검색 섹션 */}
			<div className="search-section-stone">
				<div className="search-input-group">
					<input
						type="text"
						className="search-input"
						placeholder="스톤명으로 검색..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						onKeyDown={handleKeyPress}
					/>
					<button
						className="search-button"
						onClick={handleSearch}
						disabled={loading}
					>
						검색
					</button>
					<button
						className="clear-button"
						onClick={handleClearSearch}
						disabled={loading}
					>
						초기화
					</button>
					<button
						className="create-button"
						onClick={handleCreateStone}
						disabled={loading}
					>
						생성
					</button>
					<button
						className="excel-button"
						onClick={handleDownExcel}
						disabled={loading}
					>
						엑셀 다운로드
					</button>
				</div>
			</div>

			{/* 로딩 상태 */}
			{loading && (
				<div className="loading-container">
					<div className="spinner"></div>
					<p>스톤 정보를 불러오는 중...</p>
				</div>
			)}

			{/* 에러 상태 */}
			{error && (
				<div className="error-container">
					<span className="error-icon">⚠️</span>
					<p>{error}</p>
					<button
						onClick={() => loadStones(searchTerm, currentPage)}
						className="retry-button"
					>
						다시 시도
					</button>
				</div>
			)}

			{/* 스톤 테이블 */}
			{!loading && !error && (
				<>
					<StoneListTable
						stones={stones}
						showTitle={false} // 페이지 헤더에 이미 제목이 있음
						showTotalRow={true}
					/>

					{/* 페이지네이션 */}
					{pageInfo.totalPages > 0 && (
						<Pagination
							currentPage={currentPage}
							totalPages={pageInfo.totalPages}
							totalElements={pageInfo.totalElements}
							onPageChange={handlePageChange}
						/>
					)}
				</>
			)}

			{/* 데이터가 없는 경우 */}
			{!loading && !error && stones.length === 0 && (
				<div className="no-data-container">
					<p>검색 결과가 없습니다.</p>
					{searchTerm && (
						<button onClick={handleClearSearch} className="clear-search-button">
							전체 목록 보기
						</button>
					)}
				</div>
			)}
		</div>
	);
};

export default StonePage;
