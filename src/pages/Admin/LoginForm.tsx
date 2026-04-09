import React, { useState } from 'react';
import { AlertCircle, Eye, EyeOff, Loader2, Smartphone, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LoginFormProps {
    handleLogin: (e: React.FormEvent) => void;
    setEmail: (email: string) => void;
    setPassword: (password: string) => void;
    isLoggingIn: boolean;
    showLoginError: boolean;
    setShowLoginError: (show: boolean) => void;
    errorMessage: string;
}

export default function LoginForm({
    handleLogin,
    setEmail,
    setPassword,
    isLoggingIn,
    showLoginError,
    setShowLoginError,
    errorMessage
}: LoginFormProps) {
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const fontStack = "font-['Malgun_Gothic', '맑은_고딕', 'Apple_SD_Gothic_Neo', 'sans-serif']";

    return (
        <div className={`min-h-screen bg-[#F2F4F6] flex items-center justify-center p-5 ${fontStack} tracking-tight text-[#191F28]`}>

            {showLoginError && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-40px)] max-w-[380px] animate-in slide-in-from-top-5 duration-300">
                    <div className="bg-[#333D4B] text-white px-5 py-4 rounded-[20px] shadow-2xl flex items-center gap-3">
                        <AlertCircle size={20} className="text-[#F04452] flex-shrink-0" />
                        <p className="flex-1 text-[14px] font-bold leading-tight">{errorMessage}</p>
                        <button onClick={() => setShowLoginError(false)} className="text-[14px] font-black text-[#3182F6] px-2">확인</button>
                    </div>
                </div>
            )}

            {/* [수정] 카드 높이 최적화: p-8 -> p-7 / max-w-380px로 슬림하게 */}
            <div className="w-full max-w-[370px] bg-white rounded-[32px] p-7 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-[#F2F4F6] animate-in fade-in zoom-in-95 duration-500">

                {/* 헤더 마진 축소 mb-10 -> mb-7 */}
                <header className="mb-7 text-center">
                    <div className="inline-flex w-11 h-11 rounded-[14px] bg-[#3182F6] items-center justify-center shadow-md shadow-blue-50 mb-4 animate-pulse">
                        <Smartphone size={22} className="text-white" strokeWidth={2.5} />
                    </div>
                    <h1 className="text-[24px] font-black text-[#191F28] mb-1 tracking-tighter">관리자 로그인</h1>
                    <p className="text-[#4E5968] text-[14px] font-bold opacity-70">디지털 주보 관리 페이지</p>
                </header>

                {/* 입력폼 간격 축소 space-y-5 -> space-y-4 */}
                <form onSubmit={handleLogin} className="space-y-3.5">
                    <div className="space-y-1.5 group">
                        <label className="block text-[12.5px] font-bold text-[#8B95A1] ml-1 group-focus-within:text-[#3182F6]">이메일 주소</label>
                        <input
                            type="email"
                            className="w-full h-[52px] bg-[#F9FAFB] rounded-[14px] px-4 text-[15.5px] font-bold text-[#191F28] border-2 border-transparent focus:border-[#3182F6] focus:bg-white outline-none transition-all placeholder:text-[#D1D8E0]"
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="example@email.com"
                            required
                        />
                    </div>

                    <div className="space-y-1.5 group">
                        <label className="block text-[12.5px] font-bold text-[#8B95A1] ml-1 group-focus-within:text-[#3182F6]">비밀번호</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="w-full h-[52px] bg-[#F9FAFB] rounded-[14px] px-4 pr-12 text-[15.5px] font-bold text-[#191F28] border-2 border-transparent focus:border-[#3182F6] focus:bg-white outline-none transition-all placeholder:text-[#D1D8E0]"
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="비밀번호 입력"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#D1D8E0] p-2 hover:text-[#4E5968]"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* 로그인 버튼 높이 축소 68px -> 54px */}
                    <div className="pt-3">
                        <button
                            type="submit"
                            disabled={isLoggingIn}
                            className={`w-full h-[54px] rounded-[16px] font-black text-[16.5px] transition-all active:scale-[0.97] flex items-center justify-center
                                ${isLoggingIn
                                    ? 'bg-[#E5E8EB] text-[#ADB5BD]'
                                    : 'bg-[#3182F6] text-white shadow-lg shadow-blue-50 hover:bg-[#2D77E5]'
                                }`}
                        >
                            {isLoggingIn ? <Loader2 size={20} className="animate-spin" /> : "로그인 하기"}
                        </button>
                    </div>
                </form>

                {/* 하단 영역 마진 축소 mt-10 -> mt-6 */}
                <div className="mt-6 text-center space-y-2">
                    <p className="text-[13.5px] font-bold text-[#8B95A1]">
                        계정이 없으신가요?
                        <button type="button" className="ml-1.5 text-[#4E5968] font-black border-b border-[#F2F4F6] hover:text-[#3182F6]">관리자에게 문의하세요.</button>
                    </p>
                    <div>
                        <button
                            type="button"
                            onClick={() => navigate("/")}
                            className="inline-flex items-center gap-1 text-[12px] font-bold text-[#ADB5BD] hover:text-[#8B95A1] transition-all"
                        >
                            <ChevronLeft size={13} strokeWidth={3} />
                            <span>주보 화면으로 돌아가기</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}