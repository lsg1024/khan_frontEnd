import React from "react";

interface PaginationProps {
	currentPage: number;
	totalPages: number;
	totalElements: number;
	loading?: boolean;
	onPageChange: (page: number) => void;
	className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
	currentPage,
	totalPages,
	totalElements,
	loading = false,
	onPageChange,
	className = "",
}) => {
	// 이전 페이지로 이동
	const handlePrevPage = () => {
		if (currentPage > 1) {
			onPageChange(currentPage - 1);
		}
	};

	// 다음 페이지로 이동
	const handleNextPage = () => {
		if (currentPage < totalPages) {
			onPageChange(currentPage + 1);
		}
	};
	return (
		<div
			className={`pagination-footer ${
				className ? `pagination-footer-${className}` : ""
			}`}
		>
			<div
				className={`pagination-controls ${
					className ? `pagination-controls-${className}` : ""
				}`}
			>
				<button
					className="page-btn"
					onClick={handlePrevPage}
					disabled={currentPage <= 1 || loading}
				>
					이전
				</button>
				<span className="page-info">
					{totalPages > 0 && totalElements > 0
						? `페이지 ${currentPage}/ ${totalPages} (총 ${totalElements}개)`
						: "데이터 없음"}
				</span>
				<button
					className="page-btn"
					onClick={handleNextPage}
					disabled={currentPage >= totalPages || totalPages <= 1 || loading}
				>
					다음
				</button>
			</div>
		</div>
	);
};

export default Pagination;
