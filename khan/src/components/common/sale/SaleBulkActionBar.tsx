import React from "react";
import "../../../styles/components/BulkActionBar.css";

interface SaleBulkActionBarProps {
	selectedCount: number;
	onReturn?: () => void;
	className?: string;
}

const SaleBulkActionBar: React.FC<SaleBulkActionBarProps> = ({
	selectedCount,
	onReturn,
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
			</div>
		</div>
	);
};

export default SaleBulkActionBar;
