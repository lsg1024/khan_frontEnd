import { useState } from "react";
import { Calendar, dateFnsLocalizer, type Event, type ToolbarProps } from "react-big-calendar";
import {format} from "date-fns/format";
import {parse} from "date-fns/parse";
import {startOfWeek} from "date-fns/startOfWeek";
import { getDay } from "date-fns";
import {ko} from "date-fns/locale/ko"; 
import "react-big-calendar/lib/css/react-big-calendar.css"; 
import "../../src/styles/pages/home/HomePage.css";

const locales = {
    "ko": ko,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

interface MyEvent extends Event {
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    resource?: unknown;
}

// 커스텀 툴바 컴포넌트
const CustomToolbar = ({ date, onNavigate }: ToolbarProps) => {
    const goToPrevMonth = () => {
        onNavigate('PREV');
    };

    const goToNextMonth = () => {
        onNavigate('NEXT');
    };

    return (
        <div className="custom-calendar-toolbar">
            <button className="nav-button" onClick={goToPrevMonth}>
                ◀
            </button>
            <div className="current-date">
                <span className="date-label">{format(date, 'yyyy년 M월', { locale: ko })}</span>
            </div>
            <button className="nav-button" onClick={goToNextMonth}>
                ▶
            </button>
        </div>
    );
};

const HomePage = () => {
    const [events] = useState<MyEvent[]>([]);

    return (
        <div className="home-page-content">
            <div className="calendar-container">
                <div className="calendar-wrapper">
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: "100%" }}
                        culture="ko"
                        views={["month"]}
                        view="month" 
                        onView={() => {}} 
                        components={{
                            toolbar: CustomToolbar,
                        }}
                        messages={{
                            noEventsInRange: "이 기간에 일정이 없습니다.",
                        }}
                        selectable
                    />
                </div>
            </div>
        </div>
    );
}

export default HomePage;