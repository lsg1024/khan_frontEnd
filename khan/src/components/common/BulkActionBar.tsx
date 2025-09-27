import React from "react";
import "../../styles/components/BulkActionBar.css";

interface BulkActionBarProps {
	selectedCount: number;
	onChangeDeliveryDate?: () => void;
	onStockRegister?: () => void;
	onSalesRegister?: () => void;
	onDelete?: () => void;
	className?: string;
}

const BulkActionBar: React.FC<BulkActionBarProps> = ({
	selectedCount,
	onChangeDeliveryDate,
	onStockRegister,
	onSalesRegister,
	onDelete,
	className = "",
}) => {
	return (
		<div className={`bulk-action-bar ${className}`}>
			<div className="bulk-action-buttons">
				{onChangeDeliveryDate && (
					<a
						href="#"
						className={`bulk-action-btn change-delivery-date ${
							selectedCount === 0 ? "disabled" : ""
						}`}
						onClick={(e) => {
							e.preventDefault();
							if (selectedCount > 0) {
								onChangeDeliveryDate();
							}
						}}
					>
						출고일변경
					</a>
				)}
				{onStockRegister && (
					<a
						href="#"
						className={`bulk-action-btn stock-register ${
							selectedCount === 0 ? "disabled" : ""
						}`}
						onClick={(e) => {
							e.preventDefault();
							if (selectedCount > 0) {
								onStockRegister();
							}
						}}
					>
						재고등록
					</a>
				)}
				{onSalesRegister && (
					<a
						href="#"
						className={`bulk-action-btn sales-register ${
							selectedCount === 0 ? "disabled" : ""
						}`}
						onClick={(e) => {
							e.preventDefault();
							if (selectedCount > 0) {
								onSalesRegister();
							}
						}}
					>
						판매등록
					</a>
				)}
				{onDelete && (
					<a
						href="#"
						className={`bulk-action-btn delete ${
							selectedCount === 0 ? "disabled" : ""
						}`}
						onClick={(e) => {
							e.preventDefault();
							if (selectedCount > 0) {
								onDelete();
							}
						}}
					>
						삭제
					</a>
				)}
			</div>
		</div>
	);
};

export default BulkActionBar;
