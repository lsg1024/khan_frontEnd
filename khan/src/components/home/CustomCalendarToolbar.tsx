import { format } from "date-fns/format";
import { ko } from "date-fns/locale/ko";
import type { ToolbarProps } from "react-big-calendar";
import type { MyEvent } from "./types";

const CustomCalendarToolbar = ({ date, onNavigate }: ToolbarProps<MyEvent, object>) => {
	const goToPrevMonth = () => {
		onNavigate("PREV");
	};

	const goToNextMonth = () => {
		onNavigate("NEXT");
	};

	return (
		<div className="custom-calendar-toolbar">
			<button className="nav-button" onClick={goToPrevMonth}>
				◀
			</button>
			<div className="current-date">
				<span className="date-label">
					{format(date, "yyyy년 M월", { locale: ko })}
				</span>
			</div>
			<button className="nav-button" onClick={goToNextMonth}>
				▶
			</button>
		</div>
	);
};

export default CustomCalendarToolbar;
