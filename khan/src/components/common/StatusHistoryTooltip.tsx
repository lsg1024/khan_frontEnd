import { useState, useRef } from "react";
import type { StatusHistory } from "../../types/orderDto";
import "./StatusHistoryTooltip.css";

interface StatusHistoryTooltipProps {
	children: React.ReactNode;
	statusHistory?: StatusHistory[];
	className?: string;
}

const StatusHistoryTooltip = ({
	children,
	statusHistory,
	className = "",
}: StatusHistoryTooltipProps) => {
	const [isVisible, setIsVisible] = useState(false);
	const [position, setPosition] = useState({ top: 0, left: 0 });
	const wrapperRef = useRef<HTMLDivElement>(null);

	// 상태 이력이 없으면 그냥 children만 렌더링
	if (!statusHistory || statusHistory.length === 0) {
		return <>{children}</>;
	}

	const handleMouseEnter = () => {
		if (wrapperRef.current) {
			const rect = wrapperRef.current.getBoundingClientRect();
			setPosition({
				top: rect.bottom + 8,
				left: rect.left + rect.width / 2,
			});
		}
		setIsVisible(true);
	};

	return (
		<div
			ref={wrapperRef}
			className={`status-history-tooltip-wrapper ${className}`}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={() => setIsVisible(false)}
		>
			{children}
			{isVisible && (
				<div
					className="status-history-tooltip"
					style={{ top: position.top, left: position.left }}
				>
					<div className="status-history-tooltip-content">
						{statusHistory.map((history, index) => (
							<div key={index} className="status-history-item">
								<span className="status-phase">{history.phase}</span>
								<span className="status-arrow">→</span>
								<span className="status-kind">{history.kind}</span>
								{history.content && (
									<>
										<span className="status-divider">|</span>
										<span className="status-content">{history.content}</span>
									</>
								)}
								<span className="status-divider">|</span>
								<span className="status-date">{history.statusCreateAt}</span>
								<span className="status-divider">|</span>
								<span className="status-author">{history.statusCreateBy}</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export default StatusHistoryTooltip;
