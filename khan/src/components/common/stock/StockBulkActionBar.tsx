import React from "react";
import "../../../styles/components/common/BulkActionBar.css";

interface StockBulkActionBarProps {
	selectedCount: number;
	onSalesRegister?: () => void;
	onRentalRegister?: () => void;
	onReturnRegister?: () => void;
	onDelete?: () => void;
	onRollBack?: () => void;
	onPrintProductBarcode?: () => void;
	onPrintDeliveryBarcode?: () => void;
	className?: string;
}

const StockBulkActionBar: React.FC<StockBulkActionBarProps> = ({
	selectedCount,
	onSalesRegister,
	onRentalRegister,
	onReturnRegister,
	onDelete,
	onRollBack,
	onPrintProductBarcode,
	onPrintDeliveryBarcode,
	className = "",
}) => {
	return (
		<div className={`bulk-action-bar ${className}`}>
			<div className="bulk-action-buttons">
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
						판매 등록
					</a>
				)}
				{onRentalRegister && (
					<a
						href="#"
						className={`bulk-action-btn rental-register ${
							selectedCount === 0 ? "disabled" : ""
						}`}
						onClick={(e) => {
							e.preventDefault();
							if (selectedCount > 0) {
								onRentalRegister();
							}
						}}
					>
						대여 등록
					</a>
				)}
				{onReturnRegister && (
					<a
						href="#"
						className={`bulk-action-btn return-register ${
							selectedCount === 0 ? "disabled" : ""
						}`}
						onClick={(e) => {
							e.preventDefault();
							if (selectedCount > 0) {
								onReturnRegister();
							}
						}}
					>
						반납 등록
					</a>
				)}
				{onRollBack && (
					<a
						href="#"
						className={`bulk-action-btn rollback ${
							selectedCount === 0 ? "disabled" : ""
						}`}
						onClick={(e) => {
							e.preventDefault();
							if (selectedCount > 0) {
								onRollBack();
							}
						}}
					>
						복구 등록
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
						삭제 등록
					</a>
				)}
				{onPrintProductBarcode && (
					<a
						href="#"
						className={`bulk-action-btn print-product-barcode ${
							selectedCount === 0 ? "disabled" : ""
						}`}
						onClick={(e) => {
							e.preventDefault();
							if (selectedCount > 0) {
								onPrintProductBarcode();
							}
						}}
					>
						제품 바코드
					</a>
				)}
				{onPrintDeliveryBarcode && (
					<a
						href="#"
						className={`bulk-action-btn print-delivery-barcode ${
							selectedCount === 0 ? "disabled" : ""
						}`}
						onClick={(e) => {
							e.preventDefault();
							if (selectedCount > 0) {
								onPrintDeliveryBarcode();
							}
						}}
					>
						출고 바코드
					</a>
				)}
			</div>
		</div>
	);
};

export default StockBulkActionBar;
