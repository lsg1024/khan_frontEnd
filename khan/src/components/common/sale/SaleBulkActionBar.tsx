import React from "react";
import "../../../styles/components/common/BulkActionBar.css";

interface SaleBulkActionBarProps {
	selectedCount: number;
	onReturn?: () => void;
	onAddMarketPrice?: () => void;
	onPrintProductBarcode?: () => void;
	onPrintDeliveryBarcode?: () => void;
	className?: string;
}

const SaleBulkActionBar: React.FC<SaleBulkActionBarProps> = ({
	selectedCount,
	onReturn,
	onAddMarketPrice,
	onPrintProductBarcode,
	onPrintDeliveryBarcode,
	className = "",
}) => {
	return (
		<div className={`bulk-action-bar ${className}`}>
			<div className="bulk-action-buttons">
				{onReturn && (
					<a
						href="#"
						className={`bulk-action-btn return-register ${
							selectedCount === 0 ? "disabled" : ""
						}`}
						onClick={(e) => {
							e.preventDefault();
							if (selectedCount > 0) {
								onReturn();
							}
						}}
					>
						반품
					</a>
				)}
				{onAddMarketPrice && (
					<a
						href="#"
						className={`bulk-action-btn change-delivery-date ${
							selectedCount === 0 ? "disabled" : ""
						}`}
						onClick={(e) => {
							e.preventDefault();
							if (selectedCount > 0) {
								onAddMarketPrice();
							}
						}}
					>
						시세 추가
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

export default SaleBulkActionBar;
