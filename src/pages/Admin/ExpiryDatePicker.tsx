import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { buildExpiryDate } from "../../utils/expiryDate";

interface ExpiryDatePickerProps {
    enabled: boolean;
    onEnabledChange: (v: boolean) => void;
    dateStr: string; // "YYYY-MM-DD"
    onDateChange: (v: string) => void;
    hour: string;
    onHourChange: (v: string) => void;
    minute: string;
    onMinuteChange: (v: string) => void;
    second: string;
    onSecondChange: (v: string) => void;
    now: Date;
}

// 노출 마감 날짜 설정 UI (체크박스 + 토스 스타일 캘린더 + 시/분/초 + 실시간 현재 시각 + 계산된 마감 요약)
// 찬양 예배 버튼 / 광고 배너 등 여러 섹션에서 동일하게 재사용
export default function ExpiryDatePicker({
    enabled, onEnabledChange,
    dateStr, onDateChange,
    hour, onHourChange,
    minute, onMinuteChange,
    second, onSecondChange,
    now,
}: ExpiryDatePickerProps) {
    const [showCalendar, setShowCalendar] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());
    const calendarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setShowCalendar(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="rounded-[16px] ring-1 ring-[#F2F4F6] p-3.5 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => onEnabledChange(e.target.checked)}
                    className="w-[18px] h-[18px] rounded-[6px] accent-[#3182F6]"
                />
                <span className="text-[13px] font-bold text-[#191F28]">노출 마감 날짜 설정</span>
            </label>

            {enabled && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="relative">
                        <div onClick={() => setShowCalendar(!showCalendar)} className="cursor-pointer group">
                            <div className={`w-full h-12 bg-[#F9FAFB] border-0 rounded-[14px] px-4 flex items-center justify-between outline-none ring-1 transition-all ${showCalendar ? 'ring-2 ring-[#3182F6] bg-white' : 'ring-[#F2F4F6] hover:ring-[#D1D8E0]'}`}>
                                <span className={`text-[15px] font-bold ${dateStr ? "text-[#191F28]" : "text-[#D1D8E0]"}`}>
                                    {dateStr || "날짜를 선택해 주세요"}
                                </span>
                                <Calendar className={`transition-transform duration-300 ${showCalendar ? "text-[#3182F6] scale-110" : "text-[#ADB5BD]"}`} size={19} strokeWidth={2.5} />
                            </div>
                        </div>

                        {showCalendar && (
                            <div
                                ref={calendarRef}
                                className="absolute top-[56px] left-0 right-0 bg-white rounded-[24px] shadow-[0_24px_60px_rgba(0,0,0,0.15)] border border-[#F2F4F6] p-4 z-[100] animate-in fade-in zoom-in-95 duration-200"
                            >
                                <div className="flex justify-between items-center mb-4 px-1">
                                    <h3 className="text-[16px] font-black text-[#191F28]">{viewDate.getFullYear()}년 {viewDate.getMonth() + 1}월</h3>
                                    <div className="flex gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)); }} className="p-1.5 hover:bg-[#F2F4F6] rounded-full transition-colors"><ChevronLeft size={18} className="text-[#8B95A1]" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)); }} className="p-1.5 hover:bg-[#F2F4F6] rounded-full transition-colors"><ChevronRight size={18} className="text-[#8B95A1]" /></button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-7 mb-2 text-center">
                                    {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
                                        <span key={day} className={`text-[11px] font-black ${idx === 0 ? 'text-[#F04452]' : 'text-[#ADB5BD]'}`}>{day}</span>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {(() => {
                                        const year = viewDate.getFullYear();
                                        const month = viewDate.getMonth();
                                        const totalDays = new Date(year, month + 1, 0).getDate();
                                        const firstDay = new Date(year, month, 1).getDay();
                                        const days: (Date | null)[] = [];
                                        for (let i = 0; i < firstDay; i++) days.push(null);
                                        for (let d = 1; d <= totalDays; d++) days.push(new Date(year, month, d));
                                        return days.map((day, idx) => {
                                            const currentDayStr = day ? `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}` : "";
                                            const isSelected = day && dateStr === currentDayStr;
                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={() => {
                                                        if (day) {
                                                            onDateChange(currentDayStr);
                                                            setShowCalendar(false);
                                                        }
                                                    }}
                                                    className={`h-10 flex items-center justify-center text-[13px] font-bold cursor-pointer rounded-[12px] transition-all
                                                        ${!day ? "pointer-events-none opacity-0" : "hover:bg-[#F2F4F6]"}
                                                        ${isSelected ? "bg-[#3182F6] text-white shadow-lg shadow-blue-200" : "text-[#4E5968]"}
                                                        ${day && day.getDay() === 0 && !isSelected ? "text-[#F04452]" : ""}`}
                                                >
                                                    {day ? day.getDate() : ""}
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-[#8B95A1] ml-1">시</label>
                            <select
                                value={hour}
                                onChange={(e) => onHourChange(e.target.value)}
                                className="w-full h-11 bg-[#F9FAFB] border-0 rounded-[12px] px-1 text-[14px] font-bold text-[#191F28] outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] text-center"
                            >
                                {Array.from({ length: 25 }, (_, i) => String(i).padStart(2, "0")).map(h => <option key={h} value={h}>{h}시</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-[#8B95A1] ml-1">분</label>
                            <select
                                value={minute}
                                onChange={(e) => onMinuteChange(e.target.value)}
                                className="w-full h-11 bg-[#F9FAFB] border-0 rounded-[12px] px-1 text-[14px] font-bold text-[#191F28] outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] text-center"
                            >
                                {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map(m => <option key={m} value={m}>{m}분</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-[#8B95A1] ml-1">초</label>
                            <select
                                value={second}
                                onChange={(e) => onSecondChange(e.target.value)}
                                className="w-full h-11 bg-[#F9FAFB] border-0 rounded-[12px] px-1 text-[14px] font-bold text-[#191F28] outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] text-center"
                            >
                                {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map(s => <option key={s} value={s}>{s}초</option>)}
                            </select>
                        </div>
                    </div>

                    <p className="text-[12px] font-bold text-[#F04452] leading-snug px-1">
                        현재 시간은 (한국 기준) {now.getFullYear()}년 {String(now.getMonth() + 1).padStart(2, "0")}월 {String(now.getDate()).padStart(2, "0")}일 {String(now.getHours()).padStart(2, "0")}시 {String(now.getMinutes()).padStart(2, "0")}분 {String(now.getSeconds()).padStart(2, "0")}초 입니다.
                    </p>

                    {dateStr && (() => {
                        const target = buildExpiryDate(dateStr, hour, minute, second);
                        if (!target) return null;
                        const isPast = target.getTime() <= now.getTime();
                        return (
                            <div className={`rounded-[12px] px-3 py-2.5 ${isPast ? 'bg-[#FFF0F1]' : 'bg-[#EBF4FF]'}`}>
                                <p className={`text-[12px] font-bold ${isPast ? 'text-[#F04452]' : 'text-[#1A66DB]'}`}>
                                    {target.getFullYear()}년 {String(target.getMonth() + 1).padStart(2, "0")}월 {String(target.getDate()).padStart(2, "0")}일 {String(target.getHours()).padStart(2, "0")}시 {String(target.getMinutes()).padStart(2, "0")}분 {String(target.getSeconds()).padStart(2, "0")}초까지 노출{isPast ? ' (이미 지났어요, 저장하면 바로 꺼져요)' : ''}
                                </p>
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}
