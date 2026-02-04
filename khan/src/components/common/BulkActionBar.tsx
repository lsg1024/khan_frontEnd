// 범용 일괄 작업 바 컴포넌트
import "../../styles/components/common/BulkActionBar.css";

interface BulkAction {
	label: string;
	onClick: () => void;
	className?: string;
	disabled?: boolean;
}

interface BulkActionBarProps {
	selectedCount: number;
	actions: BulkAction[];
	className?: string;
}

function BulkActionBar({ selectedCount, actions, className = "" }: BulkActionBarProps) {
	return (
		<div className={`bulk-action-bar ${className}`}>
			<div className="bulk-action-buttons">
				{actions.map((action, index) => (
					<a
						key={index}
						href="#"
						className={`bulk-action-btn ${action.className || ""} ${
							action.disabled || selectedCount === 0 ? "disabled" : ""
						}`}
						onClick={(e) => {
							e.preventDefault();
							if (!action.disabled && selectedCount > 0) {
								action.onClick();
							}
						}}
					>
						{action.label}
					</a>
				))}
			</div>
		</div>
	);
}

export default BulkActionBar;
