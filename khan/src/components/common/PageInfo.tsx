import React from "react";
import type { PaginationState } from "../../hooks/usePagination";

interface PageInfoProps {
	pagination: PaginationState;
	className?: string;
}

const PageInfo: React.FC<PageInfoProps> = ({ pagination, className = "" }) => {
	const { currentPage, totalPages, totalElements } = pagination;

	return (
		<div className={`catalog-info ${className}`}>
			<div className="total-count">
				총 {totalElements.toLocaleString()}개 상품
			</div>
			<div className="page-info">
				{totalElements > 0
					? `${currentPage}/${totalPages} 페이지`
					: "데이터가 없습니다"}
			</div>
		</div>
	);
};

export default PageInfo;
