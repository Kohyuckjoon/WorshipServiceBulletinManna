import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { describeSunday, parseYmd, toYmd, latestSunday } from "../../utils/attendanceHwpx";

// 출석부용 날짜 선택 — 주보 발행일 캘린더와 같은 플로팅 레이어 스타일, 주일만 선택 가능
export default function SundayPicker({ value, onChange }: { value: string; onChange: (ymd: string) => void }) {
    const [open, setOpen] = useState(false);
    const [viewDate, setViewDate] = useState(() => parseYmd(value));
    const ref = useRef<HTMLDivElement>(null);
    const info = describeSunday(value);
    const today = toYmd(new Date());
    const thisSunday = latestSunday();

    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    const toggle = () => {
        if (!open) setViewDate(parseYmd(value));
        setOpen(!open);
    };

    const moveWeek = (delta: number) => {
        const date = parseYmd(value);
        date.setDate(date.getDate() + delta * 7);
        onChange(toYmd(date));
    };

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const days: (Date | null)[] = [];
    for (let i = 0; i < new Date(year, month, 1).getDay(); i++) days.push(null);
    for (let d = 1; d <= new Date(year, month + 1, 0).getDate(); d++) days.push(new Date(year, month, d));
    let sundayCount = 0;

    return (
        <div ref={ref} className="relative">
            <div className="flex items-center gap-1.5">
                <button
                    onClick={() => moveWeek(-1)}
                    className="w-10 h-12 shrink-0 rounded-[14px] flex items-center justify-center text-[#8B95A1] hover:bg-[#F2F4F6] active:scale-95 transition-all"
                    aria-label="이전 주일"
                >
                    <ChevronLeft size={20} />
                </button>
                <button
                    onClick={toggle}
                    className={`flex-1 min-w-0 h-12 bg-[#F9FAFB] rounded-[18px] px-4 flex items-center justify-between ring-1 transition-all ${open ? "ring-2 ring-[#3182F6] bg-white" : "ring-[#F2F4F6] hover:ring-[#D1D8E0]"}`}
                >
                    <span className="text-[15px] font-black text-[#191F28] truncate tracking-tight">{info.label}</span>
                    <Calendar className={`shrink-0 transition-transform duration-300 ${open ? "text-[#3182F6] scale-110" : "text-[#ADB5BD]"}`} size={19} strokeWidth={2.5} />
                </button>
                <button
                    onClick={() => moveWeek(1)}
                    className="w-10 h-12 shrink-0 rounded-[14px] flex items-center justify-center text-[#8B95A1] hover:bg-[#F2F4F6] active:scale-95 transition-all"
                    aria-label="다음 주일"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {open && (
                <div className="absolute top-[56px] left-0 right-0 bg-white rounded-[24px] shadow-[0_24px_60px_rgba(0,0,0,0.15)] border border-[#F2F4F6] p-4 z-[100] animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-4 px-1">
                        <h3 className="text-[17px] font-black text-[#191F28]">{year}년 {month + 1}월</h3>
                        <div className="flex gap-1">
                            <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-[#F2F4F6] rounded-full transition-colors" aria-label="이전 달">
                                <ChevronLeft size={20} className="text-[#8B95A1]" />
                            </button>
                            <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-[#F2F4F6] rounded-full transition-colors" aria-label="다음 달">
                                <ChevronRight size={20} className="text-[#8B95A1]" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 mb-2 text-center">
                        {["일", "월", "화", "수", "목", "금", "토"].map((day, idx) => (
                            <span key={day} className={`text-[12px] font-black ${idx === 0 ? "text-[#F04452]" : "text-[#ADB5BD]"}`}>{day}</span>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, idx) => {
                            if (!day) return <div key={idx} />;
                            const ymd = toYmd(day);
                            const isSunday = day.getDay() === 0;
                            const isSelected = ymd === value;
                            const weekNo = isSunday ? ++sundayCount : 0;
                            return (
                                <button
                                    key={idx}
                                    disabled={!isSunday}
                                    onClick={() => { onChange(ymd); setOpen(false); }}
                                    className={`relative h-11 flex flex-col items-center justify-center rounded-[14px] text-[14px] font-bold transition-all
                                        ${isSelected
                                            ? "bg-[#3182F6] text-white shadow-lg shadow-blue-200"
                                            : isSunday
                                                ? "text-[#F04452] bg-[#FFF5F6] hover:bg-[#FFE8EB] cursor-pointer"
                                                : "text-[#D1D8E0] cursor-default"}`}
                                >
                                    <span className="leading-none">{day.getDate()}</span>
                                    {isSunday && (
                                        <span className={`text-[9px] font-black leading-none mt-0.5 ${isSelected ? "text-white/80" : "text-[#F04452]/70"}`}>{weekNo}주</span>
                                    )}
                                    {ymd === today && !isSelected && (
                                        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#3182F6]" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#F2F4F6]">
                        <span className="text-[11px] font-bold text-[#8B95A1]">주일만 선택할 수 있어요</span>
                        <button
                            onClick={() => { onChange(thisSunday); setOpen(false); }}
                            className="text-[13px] font-black text-[#3182F6] px-3 py-1.5 rounded-full hover:bg-[#E8F3FF] transition-colors"
                        >
                            이번 주일
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
