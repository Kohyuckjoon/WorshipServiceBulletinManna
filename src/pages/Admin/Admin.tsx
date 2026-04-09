import { useAdminData } from '../../hooks/useAdminData';
import {
    Calendar, Plus, Trash2, LogOut, Lock, CheckCircle2,
    AlertCircle, CalendarDays, Edit3, BookOpen, User, ChevronLeft, ChevronRight, RefreshCw,
    GripVertical, MessageSquare, Quote, Eye, EyeOff, Check, Info
} from "lucide-react";
import LoginForm from './LoginForm';
import React, { useState } from 'react';

export default function Admin() {

    const [editingIdx, setEditingIdx] = useState<number | null>(null);
    const [editingApplyIdx, setEditingApplyIdx] = useState<number | null>(null);
    // const [preacher, setPreacher] = useState("");
    // const [benedictionBy, setBenedictionBy] = useState("");

    const {
        // 사용자 및 상태
        user, showLoginSuccess, setShowLoginSuccess, showLogoutConfirm, setShowLogoutConfirm,
        showUpdateSuccess, setShowUpdateSuccess, showLoginError, setShowLoginError, errorMessage,
        showCalendar, setShowCalendar, viewDate, setViewDate, calendarRef,
        activeTab, setActiveTab, loading,

        // 로그인 관련
        email, setEmail, password, setPassword, isLoggingIn,

        // 주보 기본 정보 (설교자, 축도자 포함)
        fixedDate, date, setDate, scripture, setScripture, title, setTitle,
        preacher, setPreacher, benedictionBy, setBenedictionBy,
        newsInCharge, setNewsInCharge,

        // 주보 상세 컨텐츠
        churchNews, setChurchNews, newNewsTitle, setNewNewsTitle, newNewsContent, setNewNewsContent,
        showApplyQuestions, setShowApplyQuestions, applyQuestions, setApplyQuestions,
        newQTitle, setNewQTitle, newQQuote, setNewQQuote, newQContent, setNewQContent,
        historyList, worshipperConfession, setWorshipperConfession,
        apostlesCreed, setApostlesCreed, psalms, setPsalms,

        // 실행 함수들
        renderCalendarDays, handleLogin, handleLogout, handleUpdate,
        handleDragStart, handleDragEnter, handleDragEnd
    } = useAdminData();

    if (!user) {
        return (
            <LoginForm
                handleLogin={handleLogin}
                setEmail={setEmail}
                setPassword={setPassword}
                isLoggingIn={isLoggingIn}
                showLoginError={showLoginError}
                setShowLoginError={setShowLoginError}
                errorMessage={errorMessage}
            />
        );
    }

    const fontStack = "font-['Malgun_Gothic','Apple_SD_Gothic_Neo','Noto_Sans_KR','dotum','sans-serif']";

    return (
        // <div className="min-h-screen bg-[#F7F2FA] ${fontStack} pb-32 font-sans tracking-tight">
        <div className={`min-h-screen bg-[#F2F4F6] ${fontStack} pb-32 tracking-tight text-[#191F28]`}>
            {/* Modals */}
            {/* {showLoginSuccess && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
                    <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in duration-300">
                        <div className="flex justify-center mb-4 text-[#6750A4]"><CheckCircle2 size={56} /></div>
                        <h2 className="text-2xl font-bold text-[#1C1B1F] mb-6">환영합니다!</h2>
                        <button onClick={() => setShowLoginSuccess(false)} className="w-full bg-[#6750A4] text-white py-3 rounded-full font-medium">시작하기</button>
                    </div>
                </div>
            )} */}
            {showLoginSuccess && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] p-8 max-w-[340px] w-full text-center shadow-[0_20px_50px_rgba(0,0,0,0.1)] animate-in zoom-in-95 duration-300 border border-white/20">

                        {/* 체크 아이콘 영역: 신뢰감을 주는 토스 블루 컬러 사용 */}
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 bg-[#E8F3FF] rounded-full flex items-center justify-center animate-bounce-subtle">
                                <CheckCircle2 size={48} className="text-[#3182F6]" strokeWidth={2.5} />
                            </div>
                        </div>

                        {/* 텍스트 영역: 가독성 중심의 레이아웃 */}
                        <h2 className="text-[24px] font-black text-[#191F28] mb-2 tracking-tighter">로그인 성공!</h2>
                        <p className="text-[#4E5968] font-bold text-[16px] mb-8 leading-tight">
                            반가워요!<br />
                            주보 관리를 시작해볼까요?
                        </p>

                        {/* 액션 버튼: 기존 함수명 setShowLoginSuccess 유지 */}
                        <button
                            onClick={() => setShowLoginSuccess(false)}
                            className="w-full h-[58px] bg-[#3182F6] text-white rounded-[18px] font-black text-[17px] shadow-lg shadow-blue-100 hover:bg-[#2D77E5] active:scale-[0.96] transition-all duration-200 ease-out"
                        >
                            시작하기
                        </button>
                    </div>

                    {/* 미세한 바운스 애니메이션을 위한 스타일 (선택사항) */}
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        @keyframes bounce-subtle {
                            0%, 100% { transform: translateY(0); }
                            50% { transform: translateY(-4px); }
                        }
                        .animate-bounce-subtle {
                            animation: bounce-subtle 2s ease-in-out infinite;
                        }
                    `}} />
                </div>
            )}

            {/* 주보 발행 성공 모달 (커스텀 디자인) */}
            {/* {showUpdateSuccess && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
                    <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in duration-300 border border-[#EADDFF]">
                        <div className="flex justify-center mb-4 text-[#6750A4]">
                            <div className="bg-[#EADDFF] p-5 rounded-full">
                                <Check size={48} className="text-[#21005D]" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-[#1C1B1F] mb-2">업데이트 완료</h2>
                        <p className="text-[#49454F] mb-8 leading-relaxed">성공적으로 주보 데이터가<br />반영되었습니다.</p>
                        <button onClick={() => setShowUpdateSuccess(false)} className="w-full bg-[#6750A4] text-white py-4 rounded-full font-bold shadow-lg active:scale-95 transition-all">
                            확인
                        </button>
                    </div>
                </div>
            )} */}

            {showUpdateSuccess && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] p-8 max-w-[340px] w-full text-center shadow-[0_20px_50px_rgba(0,0,0,0.1)] animate-in zoom-in-95 duration-300 border border-white/20">

                        {/* 상단 아이콘: 발행 완료를 상징하는 원형 배경과 체크 아이콘 */}
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 bg-[#F2F4F6] rounded-full flex items-center justify-center shadow-inner">
                                <Check size={42} className="text-[#3182F6]" strokeWidth={3} />
                            </div>
                        </div>

                        {/* 메인 텍스트 영역 */}
                        <h2 className="text-[24px] font-black text-[#191F28] mb-3 tracking-tighter">업데이트 완료</h2>

                        {/* 가독성을 높인 본문 문구 */}
                        <p className="text-[#4E5968] font-bold text-[16px] mb-8 leading-relaxed">
                            새로운 주보 데이터가<br />
                            <span className="text-[#3182F6]">성공적으로 반영</span>되었습니다.
                        </p>

                        {/* 액션 버튼: 기존 함수명 setShowUpdateSuccess 유지 */}
                        <button
                            onClick={() => setShowUpdateSuccess(false)}
                            className="w-full h-[58px] bg-[#191F28] text-white rounded-[18px] font-black text-[17px] active:scale-[0.96] transition-all duration-200 ease-out shadow-lg shadow-gray-200"
                        >
                            확인
                        </button>
                    </div>
                </div>
            )}

            {/* {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
                    <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl">
                        <div className="flex justify-center mb-4 text-[#B3261E]"><AlertCircle size={56} /></div>
                        <h2 className="text-xl font-bold text-[#1C1B1F] mb-6 text-center">로그아웃 하시겠습니까?</h2>
                        <div className="flex gap-3">
                            <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 bg-[#F7F2FA] text-[#6750A4] py-3 rounded-full font-medium">취소</button>
                            <button onClick={handleLogout} className="flex-1 bg-[#B3261E] text-white py-3 rounded-full font-medium">로그아웃</button>
                        </div>
                    </div>
                </div>
            )} */}

            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] p-8 max-w-[340px] w-full shadow-[0_20px_50px_rgba(0,0,0,0.1)] animate-in zoom-in-95 duration-300 border border-white/20">

                        {/* 경고 아이콘: 주의를 환기하는 레드 배경과 아이콘 */}
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 bg-[#FFF0F0] rounded-full flex items-center justify-center">
                                <AlertCircle size={32} className="text-[#F04452]" strokeWidth={2.5} />
                            </div>
                        </div>

                        {/* 질문 텍스트 영역 */}
                        <div className="text-center mb-8">
                            <h2 className="text-[22px] font-black text-[#191F28] mb-2 tracking-tighter">로그아웃 하시겠습니까?</h2>
                            <p className="text-[#8B95A1] font-bold text-[15px]">언제든 다시 돌아와 관리하실 수 있어요.</p>
                        </div>

                        {/* 버튼 영역: 취소와 로그아웃의 시각적 구분 */}
                        <div className="flex gap-3">
                            {/* 취소 버튼: 덜 강조되도록 연한 회색 배경 */}
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 h-[58px] bg-[#F2F4F6] text-[#4E5968] rounded-[18px] font-black text-[16px] active:scale-[0.96] transition-all duration-200"
                            >
                                취소
                            </button>

                            {/* 로그아웃 버튼: 명확한 액션을 위해 강렬한 레드 배경 */}
                            <button
                                onClick={handleLogout}
                                className="flex-1 h-[58px] bg-[#F04452] text-white rounded-[18px] font-black text-[16px] shadow-lg shadow-red-100 active:scale-[0.96] transition-all duration-200"
                            >
                                로그아웃
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 주보 관리자 페이지 TITLE */}
            {/* <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-[#EADDFF] px-6 py-4 mb-8">
                <div className="max-w-3xl mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold text-[#1C1B1F] flex items-center gap-3">
                        <div className="bg-[#EADDFF] p-2 rounded-lg text-[#21005D]"><CalendarDays size={20} /></div>
                        주보 관리자 페이지
                    </h1>
                    <button onClick={() => setShowLogoutConfirm(true)} className="p-2 text-[#49454F] hover:bg-[#EADDFF] rounded-full transition"><LogOut size={22} /></button>
                </div>
            </nav> */}

            <nav className="bg-white/80 backdrop-blur-xl sticky top-0 z-30 border-b border-[#F2F4F6] px-6 h-[72px] flex items-center">
                <div className="max-w-3xl mx-auto w-full flex justify-between items-center">

                    {/* 서비스 타이틀: 직관적인 아이콘과 굵은 텍스트 */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#F2F4F6] rounded-xl flex items-center justify-center text-[#3182F6] shadow-sm">
                            <CalendarDays size={22} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-[18px] font-black text-[#191F28] leading-none tracking-tighter">
                                주보 관리자
                            </h1>
                            <p className="text-[11px] font-bold text-[#3182F6] mt-1 opacity-80 uppercase tracking-wider">
                                Admin Console
                            </p>
                        </div>
                    </div>

                    {/* 로그아웃 버튼: 기존 함수명 setShowLogoutConfirm 유지 */}
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="group relative w-11 h-11 flex items-center justify-center rounded-full hover:bg-[#FFF0F0] transition-all duration-200"
                        title="로그아웃"
                    >
                        <LogOut
                            size={22}
                            className="text-[#8B95A1] group-hover:text-[#F04452] transition-colors"
                            strokeWidth={2}
                        />

                        {/* 호버 시 살짝 나타나는 툴팁 효과 (선택 사항) */}
                        <span className="absolute -bottom-8 scale-0 group-hover:scale-100 transition-all bg-[#333D4B] text-white text-[10px] px-2 py-1 rounded font-bold">
                            로그아웃
                        </span>
                    </button>
                </div>
            </nav>

            {/* 탭 버튼 추가 */}
            {/* <div className="max-w-2xl mx-auto px-4 mb-8">
                <div className="flex bg-[#EADDFF]/30 p-1.5 rounded-[1.2rem] gap-2">
                    <button
                        onClick={() => setActiveTab('edit')}
                        className={`flex-1 py-3 rounded-[1rem] font-bold text-sm transition-all flex items-center justify-center gap-2
                            ${activeTab === 'edit'
                                ? 'bg-[#6750A4] text-white shadow-md'
                                : 'text-[#6750A4] hover:bg-[#EADDFF]/50'}`}
                    >
                        <Edit3 size={18} /> 주보 편집
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-3 rounded-[1rem] font-bold text-sm transition-all flex items-center justify-center gap-2
                            ${activeTab === 'history'
                                ? 'bg-[#6750A4] text-white shadow-md'
                                : 'text-[#6750A4] hover:bg-[#EADDFF]/50'}`}
                    >
                        <CalendarDays size={18} /> 주보 이력
                    </button>
                </div>
            </div> */}

            <div className="max-w-2xl mx-auto px-5 mt-12 mb-10"> {/* mt-8 -> mt-12로 상단 간격 확장 */}
                <div className="relative flex bg-[#EEEFf1] p-[5px] rounded-[22px] transition-all duration-500 ease-in-out">

                    {/* 활성화된 탭 배경 (더 부드러운 이동과 쫀득한 그림자) */}
                    <div
                        className={`absolute top-[5px] bottom-[5px] w-[calc(50%-5px)] bg-white rounded-[17px] shadow-[0_4px_12px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1)
                            ${activeTab === 'edit' ? 'left-[5px]' : 'left-[calc(50%)]'}`}
                    />

                    {/* 주보 편집 탭 */}
                    <button
                        onClick={() => setActiveTab('edit')}
                        className={`relative flex-1 h-[52px] rounded-[17px] font-black text-[15px] transition-all duration-300 flex items-center justify-center gap-2.5 z-10
                            ${activeTab === 'edit'
                                ? 'text-[#191F28]'
                                : 'text-[#8B95A1] hover:text-[#505967]'}`}
                    >
                        <div className={`transition-transform duration-300 ${activeTab === 'edit' ? 'scale-110' : 'scale-100'}`}>
                            <Edit3 size={19} strokeWidth={activeTab === 'edit' ? 2.5 : 2} />
                        </div>
                        <span>주보 편집</span>
                    </button>

                    {/* 주보 이력 탭 */}
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`relative flex-1 h-[52px] rounded-[17px] font-black text-[15px] transition-all duration-300 flex items-center justify-center gap-2.5 z-10
                            ${activeTab === 'history'
                                ? 'text-[#191F28]'
                                : 'text-[#8B95A1] hover:text-[#505967]'}`}
                    >
                        <div className={`transition-transform duration-300 ${activeTab === 'history' ? 'scale-110' : 'scale-100'}`}>
                            <CalendarDays size={19} strokeWidth={activeTab === 'history' ? 2.5 : 2} />
                        </div>
                        <span>주보 이력</span>
                    </button>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-5">
                {activeTab === 'edit' ? (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-40">

                        {/* 1. 날짜 선택 섹션 (기존 개선안 유지하며 정제) */}
                        <section className="p-8 rounded-[2.5rem] border-0 bg-white shadow-xl shadow-blue-500/5 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
                            {/* 헤더: 토스 스타일의 사이드 바 포인트 */}
                            <header className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-black flex items-center gap-3 text-[#191F28] tracking-tight">
                                    <div className="w-2.5 h-8 bg-[#3182F6] rounded-full shadow-[0_0_12px_rgba(49,130,246,0.3)]"></div>
                                    발행일 설정
                                </h2>

                                {/* 상태 배지: 현재 DB에 등록된 날짜 표시 */}
                                <div className="flex items-center gap-2 bg-[#F9FAFB] px-4 py-2 rounded-full border border-[#F2F4F6]">
                                    <div className="w-2 h-2 rounded-full bg-[#3182F6] animate-pulse" />
                                    <span className="text-[13px] font-black text-[#4E5968]">현재: {fixedDate || "미등록"}</span>
                                </div>
                            </header>

                            <div className="grid md:grid-cols-1 gap-6 relative">
                                <div className="space-y-3 group">
                                    <label className="text-[14px] font-black text-[#8B95A1] group-focus-within:text-[#3182F6] transition-colors ml-1">
                                        예배 날짜 (주보 발행일)
                                    </label>

                                    {/* 날짜 선택 커스텀 인풋 */}
                                    <div
                                        onClick={() => setShowCalendar(!showCalendar)}
                                        className="relative flex items-center cursor-pointer group"
                                    >
                                        <div className={`w-full h-14 bg-[#F9FAFB] border-0 rounded-[18px] px-5 flex items-center justify-between outline-none ring-1 transition-all ${showCalendar ? 'ring-2 ring-[#3182F6] bg-white' : 'ring-[#F2F4F6] hover:ring-[#D1D8E0]'}`}>
                                            <span className={`text-[16px] font-bold ${date ? "text-[#191F28]" : "text-[#D1D8E0]"}`}>
                                                {date || "날짜를 선택해 주세요"}
                                            </span>
                                            <Calendar className={`transition-transform duration-300 ${showCalendar ? "text-[#3182F6] scale-110" : "text-[#ADB5BD]"}`} size={22} strokeWidth={2.5} />
                                        </div>
                                    </div>

                                    {/* 변경 감지 안내 문구 */}
                                    {date && date !== fixedDate && (
                                        <div className="mt-4 flex items-center gap-2 animate-in fade-in slide-in-from-left-2 bg-[#E8F3FF]/50 p-3 rounded-xl border border-[#E8F3FF]">
                                            <span className="bg-[#3182F6] text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">Update</span>
                                            <p className="text-[13px] font-bold text-[#4E5968]">
                                                발행일이 <span className="text-[#3182F6]">{date}</span>로 변경됩니다.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* 캘린더 팝업: 토스 스타일의 플로팅 레이어 */}
                                {showCalendar && (
                                    <div
                                        ref={calendarRef}
                                        className="absolute top-[100px] left-0 right-0 bg-white rounded-[28px] shadow-[0_24px_60px_rgba(0,0,0,0.15)] border border-[#F2F4F6] p-7 z-[100] animate-in fade-in zoom-in-95 duration-200"
                                    >
                                        <div className="flex justify-between items-center mb-6 px-1">
                                            <h3 className="text-[18px] font-black text-[#191F28]">{viewDate.getFullYear()}년 {viewDate.getMonth() + 1}월</h3>
                                            <div className="flex gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)); }} className="p-2 hover:bg-[#F2F4F6] rounded-full transition-colors"><ChevronLeft size={20} className="text-[#8B95A1]" /></button>
                                                <button onClick={(e) => { e.stopPropagation(); setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)); }} className="p-2 hover:bg-[#F2F4F6] rounded-full transition-colors"><ChevronRight size={20} className="text-[#8B95A1]" /></button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-7 mb-3 text-center">
                                            {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
                                                <span key={day} className={`text-[12px] font-black ${idx === 0 ? 'text-[#F04452]' : 'text-[#ADB5BD]'}`}>{day}</span>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-7 gap-1">
                                            {renderCalendarDays().map((day, idx) => {
                                                const currentDayStr = day ? `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}` : "";
                                                const isSelected = day && date === currentDayStr;

                                                return (
                                                    <div
                                                        key={idx}
                                                        onClick={() => {
                                                            if (day) {
                                                                setDate(currentDayStr);
                                                                setShowCalendar(false);
                                                            }
                                                        }}
                                                        className={`
                                    h-11 flex items-center justify-center text-[14px] font-bold cursor-pointer rounded-[14px] transition-all
                                    ${!day ? "pointer-events-none opacity-0" : "hover:bg-[#F2F4F6]"}
                                    ${isSelected ? "bg-[#3182F6] text-white shadow-lg shadow-blue-200" : "text-[#4E5968]"}
                                    ${day && day.getDay() === 0 && !isSelected ? "text-[#F04452]" : ""}
                                `}
                                                    >
                                                        {day ? day.getDate() : ""}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* 2. 예배 정보 (Toss Input 스타일) */}
                        <section className="p-8 rounded-[2.5rem] border-0 bg-white shadow-xl shadow-blue-500/5 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* 헤더: 메테리얼 디자인 3 스타일의 강조 포인트 */}
                            <h2 className="text-2xl font-black mb-10 flex items-center gap-3 text-[#191F28] tracking-tight">
                                <div className="w-2.5 h-8 bg-[#3182F6] rounded-full shadow-[0_0_12px_rgba(49,130,246,0.3)]"></div>
                                예배 정보
                            </h2>

                            {/* 그리드 레이아웃: 직관적인 2열 배치 */}
                            <div className="grid md:grid-cols-2 gap-x-10 gap-y-8">

                                {/* 설교자 입력 (신규) */}
                                <div className="space-y-3 group">
                                    <label className="text-[14px] font-black text-[#8B95A1] group-focus-within:text-[#3182F6] transition-colors ml-1 flex items-center gap-2">
                                        설교자
                                    </label>
                                    <div className="relative flex items-center">
                                        <input
                                            type="text"
                                            value={preacher}
                                            onChange={(e) => setPreacher(e.target.value)}
                                            placeholder="예: 청년부 목사님"
                                            className="w-full h-14 bg-[#F9FAFB] border-0 rounded-[18px] px-5 text-[16px] font-bold text-[#191F28] outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] focus:bg-white transition-all placeholder:text-[#D1D8E0]"
                                        />
                                    </div>
                                </div>

                                {/* 축도자 입력 */}
                                <div className="space-y-3 group">
                                    <label className="text-[14px] font-black text-[#8B95A1] group-focus-within:text-[#3182F6] transition-colors ml-1 flex items-center gap-2">
                                        축도자
                                    </label>
                                    <div className="relative flex items-center">
                                        <input
                                            type="text"
                                            value={benedictionBy}
                                            onChange={(e) => setBenedictionBy(e.target.value)}
                                            placeholder="예: 청년부 목사님"
                                            className="w-full h-14 bg-[#F9FAFB] border-0 rounded-[18px] px-5 text-[16px] font-bold text-[#191F28] outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] focus:bg-white transition-all placeholder:text-[#D1D8E0]"
                                        />
                                    </div>
                                </div>

                                {/* 본문 말씀 입력 */}
                                <div className="space-y-3 group pt-2 border-t border-[#F9FAFB] md:border-t-0">
                                    <label className="text-[14px] font-black text-[#8B95A1] group-focus-within:text-[#3182F6] transition-colors ml-1">
                                        본문 말씀
                                    </label>
                                    <div className="relative flex items-center">
                                        <input
                                            type="text"
                                            value={scripture}
                                            onChange={(e) => setScripture(e.target.value)}
                                            placeholder="예: 마태복음 5:13-16"
                                            className="w-full h-14 bg-[#F9FAFB] border-0 rounded-[18px] px-5 text-[16px] font-bold text-[#191F28] outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] focus:bg-white transition-all placeholder:text-[#D1D8E0]"
                                        />
                                    </div>
                                </div>

                                {/* 소식 담당자 입력 */}
                                <div className="space-y-3 group pt-2 border-t border-[#F9FAFB] md:border-t-0">
                                    <label className="text-[14px] font-black text-[#8B95A1] group-focus-within:text-[#3182F6] transition-colors ml-1">
                                        소식 담당자
                                    </label>
                                    <div className="relative flex items-center">
                                        <input
                                            type="text"
                                            value={newsInCharge}
                                            onChange={(e) => setNewsInCharge(e.target.value)}
                                            placeholder="이름을 입력하세요"
                                            className="w-full h-14 bg-[#F9FAFB] border-0 rounded-[18px] px-5 text-[16px] font-bold text-[#191F28] outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] focus:bg-white transition-all placeholder:text-[#D1D8E0]"
                                        />
                                    </div>
                                </div>

                                {/* 설교 제목 입력 (Full Width) */}
                                <div className="md:col-span-2 space-y-3 group pt-4 border-t border-[#F9FAFB]">
                                    <label className="text-[14px] font-black text-[#8B95A1] group-focus-within:text-[#3182F6] transition-colors ml-1 flex items-center gap-2">
                                        <Edit3 size={14} strokeWidth={3} className="text-[#3182F6]" />
                                        설교 제목
                                    </label>
                                    <textarea
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="제목을 입력하세요"
                                        className="w-full min-h-[100px] bg-[#F9FAFB] border-0 rounded-[22px] p-5 text-[20px] font-black text-[#191F28] outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] focus:bg-white transition-all placeholder:text-[#D1D8E0] resize-none leading-relaxed"
                                    />
                                </div>
                            </div>
                        </section>
                        {/* 3. 신앙고백 및 예배자의 고백 (Grouped Card) */}
                        <div className="grid grid-cols-1 gap-6">
                            <section className="p-8 rounded-[2.5rem] border-0 bg-white shadow-xl shadow-blue-500/5 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* 헤더: 메테리얼 디자인 3 스타일의 시그니처 바 */}
                                <header className="flex items-center gap-3 mb-10">
                                    <div className="w-2.5 h-8 bg-[#3182F6] rounded-full shadow-[0_0_12px_rgba(49,130,246,0.2)]"></div>
                                    <h2 className="text-2xl font-black text-[#191F28] tracking-tight flex items-center gap-2">
                                        신앙 고백 문구
                                        <Quote size={20} strokeWidth={3} className="text-[#3182F6] opacity-50" />
                                    </h2>
                                </header>

                                <div className="grid md:grid-cols-2 gap-8">
                                    {/* 사도신경 입력 영역 */}
                                    <div className="space-y-4 group">
                                        <div className="flex items-center justify-between ml-1">
                                            <label className="text-[14px] font-black text-[#8B95A1] group-focus-within:text-[#3182F6] transition-colors">
                                                사도신경
                                            </label>
                                            <span className="text-[11px] font-bold text-[#D1D8E0] bg-[#F9FAFB] px-2 py-1 rounded-md">필수 입력</span>
                                        </div>
                                        <textarea
                                            value={apostlesCreed}
                                            onChange={(e) => setApostlesCreed(e.target.value)}
                                            placeholder="사도신경 내용을 입력하세요"
                                            className="w-full h-48 bg-[#F9FAFB] border-0 rounded-[24px] p-6 text-[15px] font-bold text-[#4E5968] leading-relaxed outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] focus:bg-white transition-all placeholder:text-[#D1D8E0] resize-none"
                                        />
                                    </div>

                                    {/* 시편 입력 영역 */}
                                    <div className="space-y-4 group">
                                        <div className="flex items-center justify-between ml-1">
                                            <label className="text-[14px] font-black text-[#8B95A1] group-focus-within:text-[#3182F6] transition-colors">
                                                교독문 (시편)
                                            </label>
                                            <span className="text-[11px] font-bold text-[#D1D8E0] bg-[#F9FAFB] px-2 py-1 rounded-md">선택 사항</span>
                                        </div>
                                        <textarea
                                            value={psalms}
                                            onChange={(e) => setPsalms(e.target.value)}
                                            placeholder="시편 내용을 입력하세요"
                                            className="w-full h-48 bg-[#F9FAFB] border-0 rounded-[24px] p-6 text-[15px] font-bold text-[#4E5968] leading-relaxed outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] focus:bg-white transition-all placeholder:text-[#D1D8E0] resize-none"
                                        />
                                    </div>
                                </div>

                                {/* 하단 안내 팁: 사용 편의성 증대 */}
                                <div className="mt-8 pt-6 border-t border-[#F9FAFB] flex items-start gap-2 px-2">
                                    <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                                        <span className="text-[#3182F6] text-[10px] font-black">TIP</span>
                                    </div>
                                    <p className="text-[12px] font-medium text-[#ADB5BD] leading-snug">
                                        입력된 문구는 주보의 신앙 고백 섹션에 자동으로 줄바꿈 처리되어 반영됩니다.
                                    </p>
                                </div>
                            </section>

                            <section className="p-8 rounded-[2.5rem] border-0 bg-white shadow-xl shadow-blue-500/5 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* 헤더: 메테리얼 디자인의 강조 바와 토스 스타일의 타이포그래피 */}
                                <header className="flex items-center gap-3 mb-2">
                                    <div className="w-2.5 h-8 bg-[#3182F6] rounded-full shadow-[0_0_12px_rgba(49,130,246,0.3)]"></div>
                                    <h2 className="text-2xl font-black text-[#191F28] tracking-tight flex items-center gap-2">
                                        예배자의 고백
                                        <MessageSquare size={20} strokeWidth={3} className="text-[#3182F6] opacity-50" />
                                    </h2>
                                </header>

                                {/* 가이드 문구: 목적을 명확히 설명하여 직관성 부여 */}
                                <p className="text-[14px] font-bold text-[#8B95A1] mb-8 ml-1 flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-[#D1D8E0]"></span>
                                    앱 접속 시 성도들에게 보여줄 첫 고백 문구를 작성해주세요.
                                </p>

                                <div className="space-y-6 group">
                                    <div className="flex items-center justify-between ml-1">
                                        <label className="text-[14px] font-black text-[#8B95A1] group-focus-within:text-[#3182F6] transition-colors">
                                            상세 문구 설정
                                        </label>
                                        {/* 노출 위치 표시 태그 */}
                                        <div className="flex items-center gap-1.5 bg-[#E8F3FF] px-3 py-1 rounded-lg border border-[#3182F6]/10">
                                            <span className="text-[11px] font-black text-[#3182F6]">메인 화면 팝업</span>
                                        </div>
                                    </div>

                                    {/* 입력 영역: 메시지 카드 느낌의 텍스트 에어리어 */}
                                    <div className="relative">
                                        <textarea
                                            value={worshipperConfession}
                                            onChange={(e) => setWorshipperConfession(e.target.value)}
                                            placeholder="예: 오늘도 주님 앞에 나온 당신을 환영합니다. 함께 기쁨으로 예배드립시다."
                                            className="w-full h-44 bg-[#F9FAFB] border-0 rounded-[28px] p-7 text-[16px] font-bold text-[#4E5968] leading-relaxed outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] focus:bg-white transition-all placeholder:text-[#D1D8E0] resize-none"
                                        />

                                        {/* 디자인 포인트: 우측 하단 쿼터 아이콘으로 '고백/문구' 성격 강조 */}
                                        <div className="absolute bottom-6 right-8 opacity-5 pointer-events-none">
                                            <Quote size={48} className="text-[#191F28]" />
                                        </div>
                                    </div>

                                    {/* 도움말 박스: 처음 보는 사용자도 안심하고 쓸 수 있게 함 */}
                                    <div className="bg-[#F2F4F6]/50 rounded-2xl p-4 flex items-start gap-3 border border-[#F2F4F6]/50">
                                        <div className="mt-0.5">
                                            <Info size={16} className="text-[#3182F6]" />
                                        </div>
                                        <p className="text-[12px] font-bold text-[#8B95A1] leading-snug">
                                            작성하신 문구는 성도용 앱 메인 화면의 팝업창에 그대로 노출됩니다. <br />
                                            정중하고 따뜻한 환영의 인사를 권장합니다.
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* 4. 공동체 소식 (List UI 개선) */}
                        <section className="p-8 rounded-[2.5rem] border-0 bg-white shadow-xl shadow-blue-500/5 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* 헤더 부분 */}
                            <header className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-black flex items-center gap-3 text-[#191F28] tracking-tight">
                                    <div className="w-2.5 h-8 bg-[#3182F6] rounded-full shadow-[0_0_12px_rgba(49,130,246,0.3)]"></div>
                                    공동체 소식
                                </h2>
                                <div className="flex items-center gap-1.5 bg-[#F9FAFB] px-3 py-1.5 rounded-full border border-[#F2F4F6]">
                                    <span className="text-[12px] font-black text-[#8B95A1]">현재 소식 {churchNews.length}개</span>
                                </div>
                            </header>

                            {/* 소식 추가 영역 (상단 고정) */}
                            <div className="bg-[#F9FAFB] p-7 rounded-[28px] border border-[#F2F4F6] mb-10 transition-all focus-within:ring-2 focus-within:ring-[#3182F6]/10 focus-within:bg-white">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-black text-[#8B95A1] ml-1">새 소식 제목</label>
                                        <input
                                            className="w-full h-14 bg-white border-0 ring-1 ring-[#E5E8EB] p-5 rounded-[18px] outline-none focus:ring-2 focus:ring-[#3182F6] font-bold text-[16px] text-[#191F28] transition-all placeholder:text-[#D1D8E0]"
                                            placeholder="예: 새가족 환영회 안내"
                                            value={newNewsTitle}
                                            onChange={(e) => setNewNewsTitle(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-black text-[#8B95A1] ml-1">상세 내용</label>
                                        <textarea
                                            className="w-full bg-white border-0 ring-1 ring-[#E5E8EB] p-5 rounded-[22px] outline-none focus:ring-2 focus:ring-[#3182F6] font-bold text-[15px] text-[#4E5968] leading-relaxed transition-all placeholder:text-[#D1D8E0] resize-none"
                                            placeholder="성도들에게 전달할 상세한 내용을 입력하세요"
                                            value={newNewsContent}
                                            onChange={(e) => setNewNewsContent(e.target.value)}
                                            rows={3}
                                        />
                                    </div>
                                    <button
                                        onClick={() => { if (newNewsTitle && newNewsContent) { setChurchNews([...churchNews, { title: newNewsTitle, content: newNewsContent }]); setNewNewsTitle(""); setNewNewsContent(""); } }}
                                        className="w-full h-14 bg-[#3182F6] text-white rounded-[20px] font-black text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] hover:bg-[#1B64DA] transition-all shadow-lg shadow-blue-100 mt-2"
                                    >
                                        <Plus size={20} strokeWidth={3} />
                                        소식 추가하기
                                    </button>
                                </div>
                            </div>

                            {/* 리스트 영역 */}
                            <div className="space-y-4">
                                {churchNews.length === 0 ? (
                                    <div className="py-12 flex flex-col items-center justify-center text-[#D1D8E0] border-2 border-dashed border-[#F2F4F6] rounded-[28px]">
                                        <Plus size={40} strokeWidth={1.5} className="mb-2 opacity-50" />
                                        <p className="text-[14px] font-bold">등록된 소식이 없습니다</p>
                                    </div>
                                ) : (
                                    churchNews.map((item, idx) => {
                                        const isEditing = editingIdx === idx;

                                        return (
                                            <div
                                                key={idx}
                                                draggable={!isEditing}
                                                onDragStart={() => !isEditing && handleDragStart(idx, "news")}
                                                onDragEnter={() => !isEditing && handleDragEnter(idx)}
                                                onDragEnd={handleDragEnd}
                                                onDragOver={(e) => e.preventDefault()}
                                                className={`group flex flex-col gap-4 bg-white border p-6 rounded-[24px] transition-all duration-300 ${isEditing ? 'border-[#3182F6] ring-4 ring-[#3182F6]/5 shadow-xl' : 'border-[#F2F4F6] hover:shadow-xl hover:shadow-blue-500/5 cursor-move hover:border-[#3182F6]/20'}`}
                                            >
                                                {isEditing ? (
                                                    /* --- [수정 모드 UI] --- */
                                                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[13px] font-black text-[#3182F6] bg-blue-50 px-2 py-1 rounded">소식 수정 중</span>
                                                            <button onClick={() => setEditingIdx(null)} className="text-[12px] font-bold text-[#8B95A1] hover:text-[#F04452]">취소하기</button>
                                                        </div>
                                                        <input
                                                            className="w-full h-12 bg-[#F9FAFB] border-0 ring-1 ring-[#3182F6]/30 p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#3182F6] font-bold text-[15px] text-[#191F28]"
                                                            value={item.title}
                                                            onChange={(e) => {
                                                                const updated = [...churchNews];
                                                                updated[idx].title = e.target.value;
                                                                setChurchNews(updated);
                                                            }}
                                                        />
                                                        <textarea
                                                            className="w-full bg-[#F9FAFB] border-0 ring-1 ring-[#3182F6]/30 p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#3182F6] font-bold text-[14px] text-[#4E5968] leading-relaxed resize-none"
                                                            rows={3}
                                                            value={item.content}
                                                            onChange={(e) => {
                                                                const updated = [...churchNews];
                                                                updated[idx].content = e.target.value;
                                                                setChurchNews(updated);
                                                            }}
                                                        />
                                                        <button
                                                            onClick={() => setEditingIdx(null)}
                                                            className="w-full h-12 bg-[#191F28] text-white rounded-xl font-black text-[14px] active:scale-95 transition-all shadow-md"
                                                        >
                                                            수정 완료 (저장)
                                                        </button>
                                                    </div>
                                                ) : (
                                                    /* --- [일반 모드 UI] --- */
                                                    <div className="flex items-center gap-5">
                                                        <div className="text-[#D1D8E0] group-hover:text-[#3182F6] transition-colors flex-shrink-0">
                                                            <GripVertical size={22} strokeWidth={2.5} />
                                                        </div>

                                                        <div className="flex-1 min-w-0" onClick={() => setEditingIdx(idx)}>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-[11px] font-black text-[#3182F6] bg-blue-50 px-2 py-0.5 rounded-md">Notice</span>
                                                                <p className="font-black text-[#191F28] text-[16px] truncate group-hover:text-[#3182F6] transition-colors cursor-text">{item.title}</p>
                                                            </div>
                                                            <p className="text-[#8B95A1] text-[14px] font-bold line-clamp-1 cursor-text">{item.content}</p>
                                                        </div>

                                                        <div className="flex items-center gap-1">
                                                            <button onClick={() => setEditingIdx(idx)} className="w-10 h-10 flex items-center justify-center text-[#8B95A1] hover:bg-[#F2F4F6] rounded-full transition-all">
                                                                <Edit3 size={18} />
                                                            </button>
                                                            <button onClick={() => setChurchNews(churchNews.filter((_, i) => i !== idx))} className="w-10 h-10 flex items-center justify-center text-[#F04452] hover:bg-[#FFF0F1] rounded-full transition-all">
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </section>

                        {/* 5. 말씀 적용 질문 (Toggle UI 개선) */}
                        <section className="p-8 rounded-[2.5rem] border-0 bg-white shadow-xl shadow-blue-500/5 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* 헤더 부분 */}
                            <header className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-black flex items-center gap-3 text-[#191F28] tracking-tight">
                                    <div className="w-2.5 h-8 bg-[#3182F6] rounded-full shadow-[0_0_12px_rgba(49,130,246,0.3)]"></div>
                                    말씀 적용 질문
                                </h2>
                                <div className="flex items-center gap-3 bg-[#F9FAFB] px-4 py-2 rounded-full border border-[#F2F4F6]">
                                    <span className={`text-[13px] font-black transition-colors ${showApplyQuestions ? 'text-[#3182F6]' : 'text-[#8B95A1]'}`}>
                                        {showApplyQuestions ? '노출 중' : '숨김 상태'}
                                    </span>
                                    <button
                                        onClick={() => setShowApplyQuestions(!showApplyQuestions)}
                                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ${showApplyQuestions ? 'bg-[#3182F6]' : 'bg-[#E5E8EB]'}`}
                                    >
                                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-all duration-300 ${showApplyQuestions ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </header>

                            <div className={`transition-all duration-500 ${showApplyQuestions ? 'opacity-100' : 'opacity-30 grayscale pointer-events-none'}`}>

                                {/* 질문 추가 영역 */}
                                <div className="bg-[#F9FAFB] p-7 rounded-[28px] border border-[#F2F4F6] mb-10 transition-all focus-within:ring-2 focus-within:ring-[#3182F6]/10 focus-within:bg-white">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[13px] font-black text-[#8B95A1] ml-1">질문 제목</label>
                                            <input
                                                className="w-full h-14 bg-white border-0 ring-1 ring-[#E5E8EB] p-5 rounded-[18px] outline-none focus:ring-2 focus:ring-[#3182F6] font-bold text-[16px] text-[#191F28] transition-all placeholder:text-[#D1D8E0]"
                                                placeholder="예: 1. 믿음과 삶에 대하여"
                                                value={newQTitle}
                                                onChange={(e) => setNewQTitle(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[13px] font-black text-[#8B95A1] ml-1">핵심 인용구 (선택사항)</label>
                                                <div className="relative">
                                                    <Quote size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#3182F6] opacity-50" />
                                                    <input
                                                        className="w-full h-14 bg-white border-0 ring-1 ring-[#E5E8EB] p-5 pl-12 rounded-[18px] outline-none focus:ring-2 focus:ring-[#3182F6] font-bold text-[15px] text-[#4E5968] transition-all placeholder:text-[#D1D8E0]"
                                                        placeholder="질문의 중심이 되는 말씀을 적어주세요"
                                                        value={newQQuote}
                                                        onChange={(e) => setNewQQuote(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[13px] font-black text-[#8B95A1] ml-1">상세 질문 내용</label>
                                                <textarea
                                                    className="w-full bg-white border-0 ring-1 ring-[#E5E8EB] p-5 rounded-[22px] outline-none focus:ring-2 focus:ring-[#3182F6] font-bold text-[15px] text-[#4E5968] leading-relaxed transition-all placeholder:text-[#D1D8E0] resize-none"
                                                    placeholder="성도들이 깊이 묵상할 수 있는 질문을 입력하세요"
                                                    value={newQContent}
                                                    onChange={(e) => setNewQContent(e.target.value)}
                                                    rows={3}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => { if (newQTitle && newQContent) { setApplyQuestions([...applyQuestions, { title: newQTitle, quote: newQQuote, content: newQContent }]); setNewQTitle(""); setNewQQuote(""); setNewQContent(""); } }}
                                            className="w-full h-14 bg-[#3182F6] text-white rounded-[20px] font-black text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] hover:bg-[#1B64DA] transition-all shadow-lg shadow-blue-100 mt-2"
                                        >
                                            <Plus size={20} strokeWidth={3} />
                                            질문 리스트 추가
                                        </button>
                                    </div>
                                </div>

                                {/* 리스트 및 수정 영역 */}
                                <div className="space-y-4">
                                    {applyQuestions.length === 0 ? (
                                        <div className="py-12 flex flex-col items-center justify-center text-[#D1D8E0] border-2 border-dashed border-[#F2F4F6] rounded-[28px]">
                                            <MessageSquare size={40} strokeWidth={1.5} className="mb-2 opacity-50" />
                                            <p className="text-[14px] font-bold">등록된 질문이 없습니다</p>
                                        </div>
                                    ) : (
                                        applyQuestions.map((item, idx) => {
                                            const isEditing = editingApplyIdx === idx;

                                            return (
                                                <div
                                                    key={idx}
                                                    draggable={!isEditing}
                                                    onDragStart={() => !isEditing && handleDragStart(idx, "apply")}
                                                    onDragEnter={() => !isEditing && handleDragEnter(idx)}
                                                    onDragEnd={handleDragEnd}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    className={`group flex flex-col gap-4 bg-white border p-6 rounded-[24px] transition-all duration-300 ${isEditing ? 'border-[#3182F6] ring-4 ring-[#3182F6]/5 shadow-xl' : 'border-[#F2F4F6] hover:shadow-xl hover:shadow-blue-500/5 cursor-move hover:border-[#3182F6]/20'}`}
                                                >
                                                    {isEditing ? (
                                                        /* --- [질문 수정 모드] --- */
                                                        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[13px] font-black text-[#3182F6] bg-blue-50 px-2 py-1 rounded">질문 수정 중</span>
                                                                <button onClick={() => setEditingApplyIdx(null)} className="text-[12px] font-bold text-[#8B95A1] hover:text-[#F04452]">취소</button>
                                                            </div>
                                                            <input
                                                                className="w-full h-12 bg-[#F9FAFB] border-0 ring-1 ring-[#3182F6]/30 p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#3182F6] font-bold text-[15px] text-[#191F28]"
                                                                value={item.title}
                                                                onChange={(e) => {
                                                                    const updated = [...applyQuestions];
                                                                    updated[idx].title = e.target.value;
                                                                    setApplyQuestions(updated);
                                                                }}
                                                            />
                                                            <input
                                                                className="w-full h-12 bg-[#F9FAFB] border-0 ring-1 ring-[#3182F6]/30 p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#3182F6] font-bold text-[14px] text-[#3182F6]"
                                                                placeholder="핵심 인용구 수정"
                                                                value={item.quote}
                                                                onChange={(e) => {
                                                                    const updated = [...applyQuestions];
                                                                    updated[idx].quote = e.target.value;
                                                                    setApplyQuestions(updated);
                                                                }}
                                                            />
                                                            <textarea
                                                                className="w-full bg-[#F9FAFB] border-0 ring-1 ring-[#3182F6]/30 p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#3182F6] font-bold text-[14px] text-[#4E5968] leading-relaxed resize-none"
                                                                rows={3}
                                                                value={item.content}
                                                                onChange={(e) => {
                                                                    const updated = [...applyQuestions];
                                                                    updated[idx].content = e.target.value;
                                                                    setApplyQuestions(updated);
                                                                }}
                                                            />
                                                            <button
                                                                onClick={() => setEditingApplyIdx(null)}
                                                                className="w-full h-12 bg-[#191F28] text-white rounded-xl font-black text-[14px] active:scale-95 transition-all"
                                                            >
                                                                수정 완료
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        /* --- [질문 일반 모드] --- */
                                                        <div className="flex items-center gap-5">
                                                            <div className="text-[#D1D8E0] group-hover:text-[#3182F6] transition-colors flex-shrink-0">
                                                                <GripVertical size={22} strokeWidth={2.5} />
                                                            </div>

                                                            <div className="flex-1 min-w-0" onClick={() => setEditingApplyIdx(idx)}>
                                                                <div className="flex items-center gap-2 mb-1.5">
                                                                    <span className="text-[11px] font-black text-[#3182F6] bg-blue-50 px-2 py-0.5 rounded-md">Question {idx + 1}</span>
                                                                    <p className="font-black text-[#191F28] text-[16px] truncate group-hover:text-[#3182F6] transition-colors">{item.title}</p>
                                                                </div>
                                                                {item.quote && (
                                                                    <p className="text-[#3182F6] text-[13px] font-black italic mb-1 line-clamp-1">"{item.quote}"</p>
                                                                )}
                                                                <p className="text-[#8B95A1] text-[14px] font-bold leading-relaxed line-clamp-2">{item.content}</p>
                                                            </div>

                                                            <div className="flex items-center gap-1">
                                                                <button onClick={() => setEditingApplyIdx(idx)} className="w-10 h-10 flex items-center justify-center text-[#8B95A1] hover:bg-[#F2F4F6] rounded-full transition-all">
                                                                    <Edit3 size={18} />
                                                                </button>
                                                                <button onClick={() => setApplyQuestions(applyQuestions.filter((_, i) => i !== idx))} className="w-10 h-10 flex items-center justify-center text-[#F04452] hover:bg-[#FFF0F1] rounded-full transition-all">
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                        </section>

                        

                        {/* 고정 하단 저장 버튼 (Toss 스타일 FAB) */}
                        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-[440px] px-6 z-[60]">
                            {/* <button onClick={handleUpdate} disabled={loading}
                                className="w-full bg-[#3182F6] text-white py-5 rounded-[22px] font-black text-[18px] shadow-[0_12px_40px_rgba(49,130,246,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:bg-[#E5E8EB] disabled:shadow-none">
                                {loading ? <RefreshCw className="animate-spin" /> : <Check size={24} strokeWidth={3} />}
                                {loading ? "데이터 저장 중" : "주보 업데이트 발행"}
                            </button> */}
                            <button
                                onClick={handleUpdate}
                                disabled={loading}
                                className="w-full h-16 bg-[#3182F6] text-white rounded-[20px] font-black text-[18px] shadow-xl shadow-blue-200 hover:bg-[#1B64DA] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {loading ? "주보 발행 중..." : "주보 발행하기"}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* 주보 이력 탭 (Toss 리스트 디자인) */
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                        <header className="flex items-center justify-between px-2">
                            <h3 className="text-[20px] font-black text-[#191F28] tracking-tight flex items-center gap-2">
                                <CalendarDays size={22} className="text-[#3182F6]" strokeWidth={2.5} />
                                저장된 주보 이력
                            </h3>
                            <span className="text-[13px] font-bold text-[#8B95A1]">총 {historyList.length}개</span>
                        </header>

                        {historyList.length > 0 ? (
                            <div className="grid gap-4">
                                {historyList.map((item) => (
                                    <div key={item.id} onClick={() => {
                                        if (window.confirm(`${item.date} 주보를 불러오시겠습니까?`)) {
                                            setDate(item.date); setScripture(item.scripture); setTitle(item.title); setNewsInCharge(item.newsInCharge);
                                            setChurchNews(item.churchNews || []); setApplyQuestions(item.applyQuestions || []);
                                            setWorshipperConfession(item.worshipperConfession || ""); setApostlesCreed(item.apostlesCreed || ""); setPsalms(item.psalms || "");
                                            setActiveTab('edit'); window.scrollTo(0, 0);
                                        }
                                    }}
                                        className="bg-white p-7 rounded-[28px] border border-[#F2F4F6] shadow-[0_4px_16px_rgba(0,0,0,0.02)] hover:border-[#3182F6] hover:shadow-lg transition-all cursor-pointer group active:scale-[0.98]">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="bg-[#E8F3FF] text-[#3182F6] px-3 py-1 rounded-lg text-[12px] font-black">{item.date}</span>
                                            <span className="text-[11px] font-bold text-[#ADB5BD]">{item.updatedAt?.toDate().toLocaleDateString()}</span>
                                        </div>
                                        <h4 className="text-[19px] font-black text-[#191F28] group-hover:text-[#3182F6] transition-colors">{item.title}</h4>
                                        <p className="text-[#8B95A1] text-[14px] mt-2 font-bold line-clamp-1">{item.scripture}</p>
                                        <div className="mt-6 flex gap-2">
                                            <div className="bg-[#F9FAFB] px-3 py-1.5 rounded-full text-[11px] font-black text-[#4E5968]">담당: {item.newsInCharge}</div>
                                            <div className="bg-[#F9FAFB] px-3 py-1.5 rounded-full text-[11px] font-black text-[#4E5968]">소식 {item.churchNews?.length || 0}개</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-24 bg-white rounded-[32px] border border-dashed border-[#E5E8EB]">
                                <CalendarDays size={48} className="mx-auto mb-4 text-[#D1D8E0]" />
                                <p className="text-[#8B95A1] font-bold">아직 저장된 주보 이력이 없습니다.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin-slow { animation: spin-slow 3s linear infinite; }
                [draggable="true"] { user-select: none; }
            `}</style>
        </div>
    );
}