import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function App() {
    // 🔴 실시간 남은 시간 상태 관리 (서울 시간 기준 카운트다운용)
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: false });

    // 🔴 상단 탭 메뉴 상태 (신청서 / 일정표 / 조편성 / 포스터)
    const [activeTab, setActiveTab] = useState<"apply" | "schedule" | "group" | "poster">("apply");
    const [scheduleDay, setScheduleDay] = useState<0 | 1 | 2>(0);

    // 🔴 관리자 페이지에서 업로드한 수련회 포스터/조 편성 이미지 + 수련회 사용 여부 실시간 반영
    const [posterImageUrl, setPosterImageUrl] = useState("");
    const [groupImageUrl, setGroupImageUrl] = useState("");
    const [retreatEnabled, setRetreatEnabled] = useState(true);

    // 🔴 관리자 페이지에서 직접 입력하는 수련회 정보 카드 내용 (기본값은 기존 하드코딩 값과 동일)
    const [retreatDate, setRetreatDate] = useState("2026. 8. 16 (주일) — 8. 18 (화)");
    const [retreatLocation, setRetreatLocation] = useState("삼은교회");
    const [retreatLocationDetail, setRetreatLocationDetail] = useState("충남 태안군 소원면 시목길 337");
    const [retreatFeeAmount, setRetreatFeeAmount] = useState("55,000원");
    const [retreatBankName, setRetreatBankName] = useState("카카오뱅크");
    const [retreatAccountNumber, setRetreatAccountNumber] = useState("3333-29-6957710");
    const [retreatAccountHolder, setRetreatAccountHolder] = useState("배소연");
    const [retreatContact, setRetreatContact] = useState("회장 010-3180-6322");
    const [retreatItems, setRetreatItems] = useState("경량 침낭(또는 침구류), 성경책, 여벌옷, 속옷, 세면도구, 수건, 필기구, 개인상비약");
    const [retreatCaution, setRetreatCaution] = useState("캐리어 반입 금지");
    const [retreatApplyUrl, setRetreatApplyUrl] = useState("https://docs.google.com/forms/d/e/1FAIpQLSf-DKv1q5i6zsNiWOSRJ14IAsUrPvxzX2zyh5ygF0EeibxYog/viewform");

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "retreat", "summercamp"), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setPosterImageUrl(data.posterImageUrl || "");
                setGroupImageUrl(data.groupImageUrl || "");
                setRetreatEnabled(data.retreatEnabled !== undefined ? data.retreatEnabled : true);
                if (data.retreatDate) setRetreatDate(data.retreatDate);
                if (data.retreatLocation) setRetreatLocation(data.retreatLocation);
                if (data.retreatLocationDetail) setRetreatLocationDetail(data.retreatLocationDetail);
                if (data.retreatFeeAmount) setRetreatFeeAmount(data.retreatFeeAmount);
                if (data.retreatBankName) setRetreatBankName(data.retreatBankName);
                if (data.retreatAccountNumber) setRetreatAccountNumber(data.retreatAccountNumber);
                if (data.retreatAccountHolder) setRetreatAccountHolder(data.retreatAccountHolder);
                if (data.retreatContact) setRetreatContact(data.retreatContact);
                if (data.retreatItems) setRetreatItems(data.retreatItems);
                if (data.retreatCaution) setRetreatCaution(data.retreatCaution);
                if (data.retreatApplyUrl) setRetreatApplyUrl(data.retreatApplyUrl);
            }
        });
        return () => unsub();
    }, []);

    // 🔴 카카오톡 공유 미리보기용 정적 페이지(/summercamp.html)를 거쳐 들어온 경우
    // 주소창을 원래 경로(/SummerCamp)로 조용히 정리 (서버 요청 없이 클라이언트에서만 처리)
    const navigate = useNavigate();
    const location = useLocation();
    useEffect(() => {
        if (location.pathname === '/summercamp-app') {
            navigate('/SummerCamp', { replace: true });
        }
    }, [location.pathname, navigate]);

    useEffect(() => {
        // 🔴 서울 시간대 기준 실시간 카운트다운 계산 로직 함수
        const calculateTimeLeft = () => {
            const targetDateStr = "2026-08-16T00:00:00+09:00"; // 서울 표준시(KST) 타겟 세팅
            const targetTime = new Date(targetDateStr).getTime();
            const now = new Date().getTime();
            const difference = targetTime - now;

            if (difference <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true });
                return;
            }

            setTimeLeft({
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
                isOver: false
            });
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000); // 1초마다 실시간 동기화 인터벌 작동
        return () => clearInterval(timer);
    }, []);

    // 🔴 계좌번호 복사 함수 추가
    const handleCopyAccount = (accountNumber: string) => {
        navigator.clipboard.writeText(accountNumber)
            .then(() => {
                alert("계좌번호가 복사되었습니다! 🎉");
            })
            .catch((err) => {
                console.error("복사 실패:", err);
            });
    };

    // 🔴 수련회 전체 일정표 데이터 (일자별 타임라인)
    const scheduleData: { time: string; icon: string; label: string; highlight?: boolean }[][] = [
        [
            { time: "09:00", icon: "🚩", label: "은혜의 열기 속으로 출발!", highlight: true },
            { time: "11:00", icon: "⛪", label: "주일 예배" },
            { time: "12:00", icon: "🍽️", label: "점심 식사" },
            { time: "13:00", icon: "🚌", label: "삼은교회로 이동" },
            { time: "15:00", icon: "👥", label: "OT 및 팀활동" },
            { time: "16:00", icon: "⭐", label: "프로그램 1" },
            { time: "18:00", icon: "🍽️", label: "저녁 식사" },
            { time: "20:00", icon: "🎤", label: "저녁 집회 1", highlight: true },
            { time: "21:00", icon: "💜", label: "나눔" },
            { time: "22:00", icon: "🌙", label: "정리 및 취침" },
        ],
        [
            { time: "07:00", icon: "☀️", label: "기상 및 세면" },
            { time: "08:00", icon: "🍽️", label: "아침 식사" },
            { time: "09:00", icon: "⭐", label: "프로그램 2" },
            { time: "10:00", icon: "⭐", label: "프로그램 3" },
            { time: "12:00", icon: "🍽️", label: "점심 식사" },
            { time: "13:00", icon: "🏖️", label: "만리포 해수욕장 이동" },
            { time: "14:00", icon: "🌊", label: "해수욕장 물놀이", highlight: true },
            { time: "16:00", icon: "🏠", label: "숙소 복귀 및 휴식" },
            { time: "18:00", icon: "🍖", label: "바베큐 파티", highlight: true },
            { time: "20:00", icon: "🎤", label: "저녁 집회 2" },
            { time: "22:00", icon: "✏️", label: "피드백 및 간증문 작성" },
            { time: "23:00", icon: "🏆", label: "최종 시상" },
            { time: "24:00", icon: "🌙", label: "정리 및 취침" },
        ],
        [
            { time: "07:00", icon: "☀️", label: "기상 및 세면" },
            { time: "08:00", icon: "🍽️", label: "아침 식사" },
            { time: "09:00", icon: "🧹", label: "청소 시간" },
            { time: "10:00", icon: "⛪", label: "폐회 예배", highlight: true },
            { time: "12:00", icon: "🍽️", label: "점심 식사" },
            { time: "13:00", icon: "🚌", label: "곤지암 만나교회로 이동" },
            { time: "16:00", icon: "🏠", label: "곤지암 도착 및 귀가", highlight: true },
        ],
    ];

    // 🔴 관리자가 수련회 안내를 "사용안함"으로 꺼둔 경우, 직접 주소를 입력해 들어와도 준비중 화면만 노출
    if (!retreatEnabled) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    background: "#F2F4F8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px",
                    fontFamily: "'Malgun Gothic', 'Apple SD Gothic Neo', -apple-system, BlinkMacSystemFont, sans-serif",
                    color: "#191F28",
                    position: "relative"
                }}
            >
                <button
                    onClick={() => window.location.href = "https://mannayouthbulletinonline.web.app/"}
                    style={{
                        position: "absolute",
                        top: "24px",
                        left: "24px",
                        width: "48px",
                        height: "48px",
                        background: "#ffffff",
                        border: "1px solid #E5E8EB",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.04)",
                        zIndex: 10,
                        padding: 0
                    }}
                    title="이전으로 이동"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: "2px" }}>
                        <path d="M15 18L9 12L15 6" stroke="#191F28" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                <div
                    style={{
                        width: "100%",
                        maxWidth: "420px",
                        background: "#ffffff",
                        borderRadius: "32px",
                        boxShadow: "0 24px 64px rgba(26, 74, 160, 0.08)",
                        padding: "56px 32px",
                        textAlign: "center"
                    }}
                >
                    <div style={{ fontSize: "40px", marginBottom: "16px" }}>🚧</div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "#191F28", marginBottom: "10px" }}>
                        수련회가 준비중입니다
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 500, color: "#8B95A1", lineHeight: "1.6" }}>
                        자세한 안내는 관리자에게 문의해주세요
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#F2F4F8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
                fontFamily: "'Malgun Gothic', 'Apple SD Gothic Neo', -apple-system, BlinkMacSystemFont, sans-serif",
                color: "#191F28",
                position: "relative"
            }}
        >
            {/* 🔴 [추가] 웅웅거리며 부드럽게 번지는 토스/머티리얼 스타일의 글로우 애니메이션 주입 */}
            <style>{`
                @keyframes pulseGlow {
                    0% {
                        box-shadow: 0 0 0 0 rgba(240, 68, 82, 0.15), 0 4px 12px rgba(240, 68, 82, 0.04);
                    }
                    50% {
                        box-shadow: 0 0 0 10px rgba(240, 68, 82, 0.02), 0 6px 20px rgba(240, 68, 82, 0.12);
                    }
                    100% {
                        box-shadow: 0 0 0 0 rgba(240, 68, 82, 0.0), 0 4px 12px rgba(240, 68, 82, 0.04);
                    }
                }
                .glow-pulse-box {
                    animation: pulseGlow 2.5s infinite ease-in-out;
                }
                @keyframes pulseGlowBlue {
                    0% {
                        box-shadow: 0 0 0 0 rgba(26, 102, 219, 0.25), 0 2px 8px rgba(26, 102, 219, 0.08);
                        transform: scale(1);
                    }
                    50% {
                        box-shadow: 0 0 0 7px rgba(26, 102, 219, 0.05), 0 4px 16px rgba(26, 102, 219, 0.3);
                        transform: scale(1.04);
                    }
                    100% {
                        box-shadow: 0 0 0 0 rgba(26, 102, 219, 0.0), 0 2px 8px rgba(26, 102, 219, 0.08);
                        transform: scale(1);
                    }
                }
                .glow-pulse-badge {
                    display: inline-block;
                    animation: pulseGlowBlue 2s infinite ease-in-out;
                }
            `}</style>

            {/* 🔴 박스 외부 좌측 상단 배치: 토스 스타일 원형 컨테이너 뒤로가기 버튼 */}
            <button
                onClick={() => window.location.href = "https://mannayouthbulletinonline.web.app/"}
                style={{
                    position: "absolute",
                    top: "24px",
                    left: "24px",
                    width: "48px",
                    height: "48px",
                    background: "#ffffff",
                    border: "1px solid #E5E8EB",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.04)",
                    transition: "all 0.2s ease",
                    zIndex: 10,
                    padding: 0
                }}
                onMouseDown={(e) => {
                    e.currentTarget.style.transform = "scale(0.92)";
                    e.currentTarget.style.background = "#F9FAFB";
                }}
                onMouseUp={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.background = "#ffffff";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.background = "#ffffff";
                }}
                title="이전으로 이동"
            >
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ marginRight: "2px" }}
                >
                    <path
                        d="M15 18L9 12L15 6"
                        stroke="#191F28"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>

            {/* ── 메인 카드 컨테이너 ── */}
            <div
                style={{
                    width: "100%",
                    maxWidth: "520px",
                    background: "#ffffff",
                    borderRadius: "32px",
                    boxShadow: "0 24px 64px rgba(26, 74, 160, 0.08)",
                    overflow: "hidden",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    marginTop: "40px"
                }}
            >
                {/* ── HERO SECTION ── */}
                <div
                    style={{
                        background: "#FAFBFC",
                        padding: "48px 32px 32px",
                        color: "#191F28",
                        position: "relative",
                        textAlign: "center",
                        borderBottom: "1px solid #F2F4F6",
                        fontFamily: "'Malgun Gothic', 'Apple SD Gothic Neo', -apple-system, BlinkMacSystemFont, sans-serif"
                    }}
                >
                    {/* 배지 디자인 */}
                    <div
                        style={{
                            display: "inline-block",
                            background: "#E8F3FF",
                            borderRadius: "100px",
                            padding: "6px 14px",
                            fontSize: "11px",
                            fontWeight: 800,
                            color: "#3182F6",
                            marginBottom: "14px",
                            letterSpacing: "0.05em",
                        }}
                    >
                        SUMMER RETREAT 2026
                    </div>

                    {/* 🔴 [수정] 웅웅거리듯 은은하게 맥박 뛰는(Pulse Glow) 칩으로 개편하여 가독성과 직관성 최상으로 정돈 */}
                    <div
                        className={timeLeft.isOver ? "" : "glow-pulse-box"}
                        style={{
                            background: timeLeft.isOver ? "#F2F4F6" : "rgba(255, 240, 240, 0.95)",
                            border: timeLeft.isOver ? "1px solid #E5E8EB" : "1px solid #FFE3E3",
                            borderRadius: "16px",
                            padding: "12px 20px",
                            maxWidth: "340px",
                            margin: "0 auto 20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            transition: "all 0.3s ease"
                        }}
                    >
                        <span style={{ fontSize: "14px" }}>{timeLeft.isOver ? "⏱️" : "🔥"}</span>
                        <span style={{
                            fontSize: "14px",
                            fontWeight: 700,
                            color: timeLeft.isOver ? "#8B95A1" : "#F04452",
                            letterSpacing: "-0.03em",
                            fontFamily: "'Malgun Gothic', 'Apple SD Gothic Neo', -apple-system, BlinkMacSystemFont, sans-serif"
                        }}>
                            {timeLeft.isOver ? (
                                "수련회 신청이 마감되었습니다"
                            ) : (
                                <>
                                    신청 마감까지 {" "}
                                    <span style={{ fontSize: "15px", fontWeight: 800 }}>{timeLeft.days}</span>일{" "}
                                    <span style={{ fontSize: "15px", fontWeight: 800 }}>{String(timeLeft.hours).padStart(2, '0')}</span>:
                                    <span style={{ fontSize: "15px", fontWeight: 800 }}>{String(timeLeft.minutes).padStart(2, '0')}</span>:
                                    <span style={{ fontSize: "15px", fontWeight: 800 }}>{String(timeLeft.seconds).padStart(2, '0')}</span> 남음
                                </>
                            )}
                        </span>
                    </div>

                    {/* 대주제 타이틀 */}
                    <h2 style={{ fontSize: "clamp(14px, 4vw, 16px)", fontWeight: 700, margin: "0 0 10px", color: "#4E5968", letterSpacing: "-0.03em" }}>
                        2026 만나 청년부 여름수련회
                    </h2>

                    {/* 메인 텍스트 */}
                    <h1
                        style={{
                            fontSize: "clamp(28px, 8.5vw, 44px)",
                            fontWeight: 900,
                            margin: "0 0 24px",
                            letterSpacing: "-0.05em",
                            lineHeight: 1.2,
                            color: "#1A4699",
                            whiteSpace: "nowrap",
                        }}
                    >
                        "나라가 임하시오며"
                    </h1>

                    {/* 타임라인 메타 인포 칩 바 */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            flexWrap: "wrap",
                            marginBottom: "24px"
                        }}
                    >
                        <span style={{ background: "#F2F4F6", color: "#4E5968", padding: "6px 12px", borderRadius: "10px", fontSize: "12px", fontWeight: 700 }}>
                            📅 2026. 08. 14 — 08. 16
                        </span>
                    </div>

                    {/* 말씀 구절 박스 */}
                    <div
                        style={{
                            background: "#FFFFFF",
                            borderRadius: "24px",
                            padding: "clamp(20px, 6vw, 28px) clamp(16px, 4vw, 24px)",
                            fontSize: "clamp(13.5px, 4vw, 15px)",
                            lineHeight: "1.75",
                            fontWeight: 600,
                            color: "#333D4B",
                            textAlign: "center",
                            display: "block",
                            maxWidth: "480px",
                            margin: "0 auto",
                            boxSizing: "border-box",
                            border: "1px solid #E5E8EB",
                            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.02)"
                        }}
                    >
                        <div
                            style={{
                                fontSize: "clamp(11px, 3.2vw, 12px)",
                                fontWeight: 800,
                                color: "#3182F6",
                                marginBottom: "8px",
                                letterSpacing: "0.05em"
                            }}
                        >
                            마태복음 6:10
                        </div>
                        <span style={{ letterSpacing: "-0.03em", wordBreak: "keep-all" }}>
                            “나라가 임하시오며 뜻이 하늘에서 이루어진 것 같이 땅에서도 이루어지이다”
                        </span>
                    </div>
                </div>

                {/* ── 탭 메뉴: 신청서 / 일정표 / 조편성 / 포스터 ── */}
                <div style={{ padding: "16px 24px 0" }}>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(4, 1fr)",
                            gap: "4px",
                            background: "#F2F4F6",
                            borderRadius: "16px",
                            padding: "4px",
                        }}
                    >
                        {(
                            [
                                { key: "apply", label: "신청서" },
                                { key: "schedule", label: "일정표" },
                                { key: "group", label: "조편성" },
                                { key: "poster", label: "포스터" },
                            ] as { key: "apply" | "schedule" | "group" | "poster"; label: string }[]
                        ).map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    padding: "10px 4px",
                                    borderRadius: "12px",
                                    border: "none",
                                    background: activeTab === tab.key ? "#FFFFFF" : "transparent",
                                    color: activeTab === tab.key ? "#3182F6" : "#8B95A1",
                                    fontWeight: activeTab === tab.key ? 800 : 600,
                                    fontSize: "13px",
                                    letterSpacing: "-0.02em",
                                    boxShadow: activeTab === tab.key ? "0 2px 8px rgba(0, 0, 0, 0.06)" : "none",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease"
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── INFO SECTION: 상세 정보 카드 ── */}
                <div style={{ padding: "32px 24px 24px" }}>
                    {activeTab === "apply" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {(
                            [
                                {
                                    label: "일시",
                                    main: retreatDate,
                                    icon: "📅",
                                    sub: null,
                                },
                                {
                                    label: "장소",
                                    main: retreatLocation,
                                    icon: "📍",
                                    sub: retreatLocationDetail,
                                },
                                {
                                    label: "회비",
                                    main: retreatFeeAmount,
                                    icon: "💳",
                                    sub: `${retreatBankName} ${retreatAccountNumber} (${retreatAccountHolder})`,
                                },
                                {
                                    label: "문의",
                                    main: retreatContact,
                                    icon: "📞",
                                    sub: null,
                                },
                            ] as { label: string; main: string; icon: string; sub: string | null }[]
                        ).map((item, i) => (
                            <div
                                key={i}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "18px 20px",
                                    background: "#F9FAFB",
                                    borderRadius: "20px",
                                    gap: "16px",
                                    border: "1px solid #F2F4F6",
                                    position: "relative"
                                }}
                            >
                                <div style={{ fontSize: "20px", background: "#EBF4FF", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "14px" }}>
                                    <span style={{ width: "100%", textAlign: "center" }}>{item.icon}</span>
                                </div>

                                <div style={{ flex: 1, paddingRight: item.label === "회비" ? "60px" : "0" }}>
                                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#8B95A1", marginBottom: "3px" }}>{item.label}</div>
                                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#191F28", letterSpacing: "-0.01em" }}>{item.main}</div>
                                    {item.sub && (
                                        <div
                                            style={{
                                                fontSize: "13px",
                                                color: item.label === "회비" ? "#333D4B" : "#6B7684",
                                                fontWeight: item.label === "회비" ? 600 : 400,
                                                marginTop: "5px",
                                                lineHeight: "1.4"
                                            }}
                                        >
                                            {item.sub}
                                        </div>
                                    )}
                                </div>

                                {item.label === "회비" && item.sub && (
                                    <button
                                        onClick={() => handleCopyAccount(retreatAccountNumber)}
                                        style={{
                                            position: "absolute",
                                            right: "16px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            background: "#E8F3FF",
                                            border: "none",
                                            borderRadius: "10px",
                                            padding: "8px 12px",
                                            fontSize: "12px",
                                            fontWeight: 700,
                                            color: "#1A66DB",
                                            cursor: "pointer",
                                            transition: "background 0.2s, transform 0.1s"
                                        }}
                                        onMouseDown={(e) => e.currentTarget.style.transform = "translateY(-50%) scale(0.95)"}
                                        onMouseUp={(e) => e.currentTarget.style.transform = "translateY(-50%) scale(1)"}
                                    >
                                        복사
                                    </button>
                                )}
                            </div>
                        ))}

                        {/* 준비물 카드 (전용 레이아웃) */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "flex-start",
                                padding: "18px 20px",
                                background: "#F9FAFB",
                                borderRadius: "20px",
                                gap: "16px",
                                border: "1px solid #F2F4F6",
                            }}
                        >
                            <div style={{ fontSize: "20px", background: "#EBF4FF", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "14px", flexShrink: 0 }}>
                                <span style={{ width: "100%", textAlign: "center" }}>🎒</span>
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "13px", fontWeight: 600, color: "#8B95A1", marginBottom: "3px" }}>준비물</div>
                                <div style={{ fontSize: "16px", fontWeight: 700, color: "#191F28", letterSpacing: "-0.01em", lineHeight: "2.1" }}>
                                    {(() => {
                                        const items = retreatItems.split(",").map((s) => s.trim()).filter(Boolean);
                                        const [first, ...rest] = items;
                                        return (
                                            <>
                                                {first && (
                                                    <span
                                                        className="glow-pulse-badge"
                                                        style={{
                                                            color: "#1A66DB",
                                                            fontWeight: 900,
                                                            fontSize: "1.05em",
                                                            background: "#E8F3FF",
                                                            padding: "3px 9px",
                                                            borderRadius: "8px",
                                                        }}
                                                    >
                                                        {first}
                                                    </span>
                                                )}
                                                {rest.length > 0 && <>{" "}· {rest.join(" · ")}</>}
                                            </>
                                        );
                                    })()}
                                </div>

                                <div style={{ fontSize: "13px", fontWeight: 600, color: "#F04452", marginTop: "6px", lineHeight: "1.4" }}>
                                    ⚠️ {retreatCaution}
                                </div>
                                <div style={{ fontSize: "12.5px", fontWeight: 500, color: "#8B95A1", marginTop: "4px", lineHeight: "1.5" }}>
                                    침낭 구매는 필수는 아니지만, 안정적인 취침을 위해 권장합니다.
                                </div>

                                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                                    <button
                                        onClick={() => window.open("https://www.coupang.com/vp/products/8901910231?itemId=25995420502&vendorItemId=92977675486&pickType=COU_PICK&q=%EC%B9%A8%EB%82%AD&searchId=7dbd176d1310649&sourceType=search&itemsCount=36&searchRank=0&rank=0&traceId=mse65u28", "_blank", "noopener,noreferrer")}
                                        style={{
                                            flex: 1,
                                            padding: "10px 8px",
                                            background: "#FFFFFF",
                                            border: "1px solid #E5E8EB",
                                            borderRadius: "12px",
                                            fontSize: "12.5px",
                                            fontWeight: 700,
                                            color: "#1A66DB",
                                            cursor: "pointer",
                                            textAlign: "center",
                                            lineHeight: "1.4",
                                            transition: "transform 0.1s ease"
                                        }}
                                        onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.97)"}
                                        onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
                                    >
                                        침낭 구매하기<br />
                                        <span style={{ fontWeight: 500, color: "#8B95A1" }}>1만원대</span>
                                    </button>
                                    <button
                                        onClick={() => window.open("https://www.coupang.com/vp/products/7986503239?itemId=22185756037&vendorItemId=89232040715&q=%EC%B9%A8%EB%82%AD&searchId=7dbd176d1310649&sourceType=search&itemsCount=36&searchRank=3&rank=3&traceId=mse66xmy", "_blank", "noopener,noreferrer")}
                                        style={{
                                            flex: 1,
                                            padding: "10px 8px",
                                            background: "#FFFFFF",
                                            border: "1px solid #E5E8EB",
                                            borderRadius: "12px",
                                            fontSize: "12.5px",
                                            fontWeight: 700,
                                            color: "#1A66DB",
                                            cursor: "pointer",
                                            textAlign: "center",
                                            lineHeight: "1.4",
                                            transition: "transform 0.1s ease"
                                        }}
                                        onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.97)"}
                                        onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
                                    >
                                        침낭 구매하기<br />
                                        <span style={{ fontWeight: 500, color: "#8B95A1" }}>3만원 미만대</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    )}

                    {/* 신청서 작성하기 버튼 */}
                    {activeTab === "apply" && (
                    <button
                        onClick={() => window.open(retreatApplyUrl, "_blank", "noopener,noreferrer")}
                        style={{
                            width: "100%",
                            height: "60px",
                            background: "#3182F6",
                            color: "#fff",
                            border: "none",
                            borderRadius: "18px",
                            fontSize: "17px",
                            fontWeight: 700,
                            marginTop: "28px",
                            cursor: "pointer",
                            boxShadow: "0 8px 24px rgba(49, 130, 246, 0.25)",
                            transition: "transform 0.1s ease, background 0.2s ease"
                        }}
                        onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.98)"}
                        onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                    >
                        수련회 신청서 작성하기
                    </button>
                    )}

                    {/* ── 일정표 탭 ── */}
                    {activeTab === "schedule" && (
                    <div>
                        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                            {(
                                [
                                    { label: "8/16 (주일)" },
                                    { label: "8/17 (월)" },
                                    { label: "8/18 (화)" },
                                ] as { label: string }[]
                            ).map((d, i) => (
                                <button
                                    key={i}
                                    onClick={() => setScheduleDay(i as 0 | 1 | 2)}
                                    style={{
                                        flex: 1,
                                        padding: "12px 6px",
                                        borderRadius: "14px",
                                        border: scheduleDay === i ? "1.5px solid #3182F6" : "1px solid #E5E8EB",
                                        background: scheduleDay === i ? "#EBF4FF" : "#FFFFFF",
                                        color: scheduleDay === i ? "#1A66DB" : "#191F28",
                                        fontSize: "13px",
                                        fontWeight: 800,
                                        cursor: "pointer",
                                        transition: "all 0.2s ease"
                                    }}
                                >
                                    {d.label}
                                </button>
                            ))}
                        </div>

                        <div>
                            {scheduleData[scheduleDay].map((item, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "7px 0" }}>
                                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#8B95A1", width: "34px", flexShrink: 0, textAlign: "right" }}>
                                        {item.time}
                                    </div>
                                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: item.highlight ? "#3182F6" : "#D1D8E0", flexShrink: 0 }} />
                                    <div
                                        style={{
                                            flex: 1,
                                            background: item.highlight ? "#EBF4FF" : "#F9FAFB",
                                            border: item.highlight ? "1px solid #D6E9FF" : "1px solid #F2F4F6",
                                            borderRadius: "14px",
                                            padding: "10px 14px",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px"
                                        }}
                                    >
                                        <span style={{ fontSize: "15px" }}>{item.icon}</span>
                                        <span style={{ fontSize: "13.5px", fontWeight: 700, color: item.highlight ? "#1A4699" : "#333D4B" }}>{item.label}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    )}

                    {/* ── 조편성 탭 ── */}
                    {activeTab === "group" && (
                    <div style={{ padding: groupImageUrl ? "4px" : "48px 12px", textAlign: "center" }}>
                        {groupImageUrl ? (
                            <img
                                src={groupImageUrl}
                                alt="수련회 조 편성"
                                style={{ width: "100%", display: "block", borderRadius: "20px", boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)" }}
                            />
                        ) : (
                            <>
                                <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "#F2F4F6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: "32px" }}>
                                    👥
                                </div>
                                <div style={{ fontSize: "16px", fontWeight: 800, color: "#191F28", marginBottom: "8px" }}>
                                    조 편성 준비중이에요
                                </div>
                                <div style={{ fontSize: "13px", fontWeight: 500, color: "#8B95A1", lineHeight: "1.6" }}>
                                    수련회가 가까워지면<br />여기서 우리 조를 확인할 수 있어요
                                </div>
                            </>
                        )}
                    </div>
                    )}

                    {/* ── 포스터 탭 ── */}
                    {activeTab === "poster" && (
                    <div style={{ padding: posterImageUrl ? "4px" : "48px 12px", textAlign: "center" }}>
                        {posterImageUrl ? (
                            <img
                                src={posterImageUrl}
                                alt="수련회 포스터"
                                style={{ width: "100%", display: "block", borderRadius: "20px", boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)" }}
                            />
                        ) : (
                            <>
                                <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "#F2F4F6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: "32px" }}>
                                    🖼️
                                </div>
                                <div style={{ fontSize: "16px", fontWeight: 800, color: "#191F28", marginBottom: "8px" }}>
                                    포스터 준비중이에요
                                </div>
                                <div style={{ fontSize: "13px", fontWeight: 500, color: "#8B95A1", lineHeight: "1.6" }}>
                                    수련회 포스터가 준비되면<br />여기서 바로 확인할 수 있어요
                                </div>
                            </>
                        )}
                    </div>
                    )}

                    {/* ── FOOTER ── */}
                    <div
                        style={{
                            marginTop: "32px",
                            paddingTop: "24px",
                            borderTop: "1px solid #F2F4F6",
                            textAlign: "center"
                        }}
                    >
                        <div
                            style={{
                                fontSize: "13px",
                                fontWeight: 600,
                                color: "#B0B8C1",
                                letterSpacing: "0.05em",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px"
                            }}
                        >
                            <div style={{ width: "12px", height: "1px", background: "#E5E8EB" }} />
                            곤지암만나교회 청년부
                            <div style={{ width: "12px", height: "1px", background: "#E5E8EB" }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
