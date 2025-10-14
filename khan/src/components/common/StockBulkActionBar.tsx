import React from "react";
import "../../styles/components/BulkActionBar.css";

interface StockBulkActionBarProps {
	selectedCount: number;
	onSalesRegister?: () => void;
	onRentalRegister?: () => void;
	onReturnRegister?: () => void;
	onDelete?: () => void;
	className?: string;
}

const StockBulkActionBar: React.FC<StockBulkActionBarProps> = ({
	selectedCount,
	onSalesRegister,
	onRentalRegister,
	onReturnRegister,
	onDelete,
	className = "",
}) => {
	return (
		<div className={`bulk-action-bar ${className}`}>
			<div className="bulk-action-buttons">
				<a
					href="#"
					className={`bulk-action-btn sales-register ${
						selectedCount === 0 ? "disabled" : ""
					}`}
					onClick={(e) => {
						e.preventDefault();
						if (selectedCount > 0 && onSalesRegister) {
							onSalesRegister();
						}
					}}
				>
					판매
				</a>
				<a
					href="#"
					className={`bulk-action-btn rental-register ${
						selectedCount === 0 ? "disabled" : ""
					}`}
					onClick={(e) => {
						e.preventDefault();
						if (selectedCount > 0 && onRentalRegister) {
							onRentalRegister();
						}
					}}
				>
					대여
				</a>
				<a
					href="#"
					className={`bulk-action-btn return-register ${
						selectedCount === 0 ? "disabled" : ""
					}`}
					onClick={(e) => {
						e.preventDefault();
						if (selectedCount > 0 && onReturnRegister) {
							onReturnRegister();
						}
					}}
				>
					반납
				</a>
				<a
					href="#"
					className={`bulk-action-btn delete ${
						selectedCount === 0 ? "disabled" : ""
					}`}
					onClick={(e) => {
						e.preventDefault();
						if (selectedCount > 0 && onDelete) {
							onDelete();
						}
					}}
				>
					삭제
				</a>
			</div>
		</div>
	);
};

export default StockBulkActionBar;
