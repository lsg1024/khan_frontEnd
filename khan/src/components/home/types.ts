import type { Event } from "react-big-calendar";
import type { RepeatType } from "../../types/scheduleDto";

export interface MyEvent extends Event {
	title: string;
	start: Date;
	end: Date;
	allDay?: boolean;
	resource?: unknown;
	scheduleId?: string;
	content?: string;
	color?: string;
	repeatType?: RepeatType;
}

export const COLOR_OPTIONS = [
	{ value: "#4A90A4", label: "파랑" },
	{ value: "#FF5733", label: "빨강" },
	{ value: "#28A745", label: "초록" },
	{ value: "#FFC107", label: "노랑" },
	{ value: "#6F42C1", label: "보라" },
	{ value: "#17A2B8", label: "청록" },
	{ value: "#E83E8C", label: "분홍" },
	{ value: "#6C757D", label: "회색" },
];

export const REPEAT_OPTIONS: { value: RepeatType; label: string }[] = [
	{ value: "NONE", label: "반복 없음" },
	{ value: "DAILY", label: "매일" },
	{ value: "WEEKLY", label: "매주" },
	{ value: "MONTHLY", label: "매월" },
	{ value: "YEARLY", label: "매년" },
];
