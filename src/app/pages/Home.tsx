import { useState, useEffect } from 'react';
import { db } from '../../firebase'; // 설정파일
import { doc, onSnapshot, collection, query, orderBy } from "firebase/firestore";
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { defaultWorshipOrder } from '../../hooks/useAdminData';
import { isExpired } from '../../utils/expiryDate';

// Profile images import
import imgPastor from "../../assets/23b6ea5c163050d8d7280dcdba4dd396a2a33a46.png";
import imgDeacon from "../../assets/00ad4e427fa7ed6cd813e8c4cd690b7a86efc80f.png";
import imgStaff from "../../assets/db6dcd21d1e35f52c009a16c9dbf2efb299ee6ee.png";
import imgPresident from "../../assets/0dddf9e56cf8320357777233eabf71e06076128b.png";
import imgSecretary1 from "../../assets/34de46806c44451dbf82b1fa6b39733546054488.png";
import imgTreasurer from "../../assets/4f1e306d2329963fe6f2def993058c9cf7bca570.png";
import imgSecretary2 from "../../assets/c56259d571473b7473ecf24a207afa65b6540e85.png";


import {
    Home as HomeIcon,
    BookOpen,
    Bell,
    Users,
    Instagram,
    Youtube,
    MapPin,
    Copy,
    PhoneCall,
    MessageSquare,
    ChevronDown,
    ChevronRight,
    User,
    X,
    ArrowUp,
    Phone,
    Calendar
} from 'lucide-react';

// Background image import
// import bulletinBg from "figma:asset/be99a7d60cdcd33e42197f11c749fa026cf46000.png";
import bulletinBg from "../../assets/manna_youth_background.png";

// Data - Based on the bulletin image provided
const communityConfession = [
    "이 예배의 주인은 하나님이십니다.",
    "오직는 하나님을 예배하기 위해 이 곳에 왔습니다.",
    "하나님은 지금 여 곳에서 우리의 예배를 받으십니다.",
    "하나님의 사랑을 우리에게 이루어냅니다.",
];

const worshipOrder = [
    { title: '공동체의 고백', time: '13:00 - 13:10', details: [] },
    { title: '입례송', person: '다같이', details: [] },
    {
        title: '신앙고백', person: '사도신경', scripture: '시편 95:1-7', details: [
            "1.(찬송)오라 우리가(식6)여호와 노래하여 우리 구원반석을 즐겁게 부르자",
            "2.(찬송)우리가 하나님 앞에 나아가 감사함으로 그 앞에 즐겁게 부르자",
            "3.(찬송)여호와는 크신 하나님이시요 모든 신들을 그의 것이라",
            "4.(찬송)땅의 깊은 곳이 그의 손안에 있으며 산들의 높은 곳도 그의 것이로다",
            "5.(찬송)바다가 그의 것이니 그가 만드셨고 그 손이 육지를 지으셨도다",
            "6.(찬송)오라 우리가 경배하며 꿇어 엎드러 우리를 지으신 여호와 앞에 무릎을 꿇자",
            "7.(합)임께임자나 나 길에 갈 때 하나님이 우리를 인도하시는 것을 감사합니다 그리고그리고기도하기도을 간청하니라",
        ]
    },
    { title: '예배자의 고백', details: communityConfession },
    {
        title: '찬양', time: '13:10 - 13:30', details: [
            '- 새 힘 얻으리 -',
            '- 내 마음 다해 -',
            '- 믿음에 믿음을 더하여 -'
        ]
    },
    {
        title: '말씀 선포 및 기도회', time: '13:30 - 14:20', highlight: true, details: [
            { label: '말씀선포', person: '김이레 목사님' },
            { label: '기도회', person: '찬양팀' },
            { label: '교회 소식', person: '임원단' },
            { label: '헌금 기도 및 축도', person: '김이레 목사님' },
        ]
    },
];

const newsData = [
    {
        cat: '안내',
        title: '새로 오신 청년들을',
        date: '2026.03.01',
        detail:
            '하반기 사역을 준비하며 소그룹 리더들이 한자리에 모입니다. 비전 공유 및 팀별 교제의 시간이 준비되어 있습니다.<br>• 일시: 3월 30일(토) 오후 4시<br>• 장소: 제1교육관 2층',
    },
    {
        cat: '행사',
        title: '만나 청년부 봄 야유회 \'하나됨\'',
        date: '2024.04.15',
        detail:
            '따스한 봄날, 자연 속에서 공동체의 기쁨을 나눕니다! 다양한 레크리에이션과 맛있는 점심 식사가 준비되어 있으니 모두 함께해요.<br>• 일시: 4월 20일(토) 오전 10시<br>• 신청: 각 소그룹 리더를 통해 신청',
    },
    {
        cat: '교육',
        title: '새가족 교육 4주 과정 개설',
        date: '매주 주일',
        detail:
            '만나 청년부에 처음 오신 여러분을 환영합니다! 공동체의 가치와 신앙의 기초를 배우는 4주 과정에 참여해보세요.<br>• 장소: 새가족실 (오후 2시)<br>• 문의: 새가족팀장',
    },
];

// 관리자페이지에서 아직 한 번도 저장하지 않았을 때 보여줄 기본값 (하드코딩 폴백, 관리자가 등록하면 Firestore 데이터로 대체됨)
const defaultLeaderData = [
    { role: '담당', name: '임원일 목사님', phone: '010-6258-8105', imageUrl: imgPastor },
    { role: '부장', name: '박양규 장로님', phone: '010-2277-9734', imageUrl: imgDeacon },
    { role: '간사', name: '고혁준 간사님', phone: '010-9231-1175', imageUrl: imgStaff },
    { role: '회장', name: '최지환 청년', phone: '010-3180-6322', imageUrl: imgPresident },
    { role: '총무', name: '박은희 청년', phone: '010-5767-9734', imageUrl: imgSecretary1 },
    { role: '회계', name: '배소연 청년', phone: '010-3646-4475', imageUrl: imgTreasurer },
    { role: '서기', name: '김석진 청년', phone: '010-7164-4068', imageUrl: imgSecretary2 },
];

const galleryData = [
    {
        title: '봄 야유회',
        date: '2024.04',
        image: 'https://images.unsplash.com/photo-1758274533219-cc0ef0af4f60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaHVyY2glMjB5b3V0aCUyMGdyb3VwJTIwb3V0ZG9vciUyMHBpY25pY3xlbnwxfHx8fDE3NzExMjcxMDd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
        title: '생일파티',
        date: '2024.03',
        image: 'https://images.unsplash.com/photo-1763951778440-13af353b122a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaXJ0aGRheSUyMHBhcnR5JTIwY2VsZWJyYXRpb24lMjB5b3VuZyUyMGFkdWx0c3xlbnwxfHx8fDE3NzExMjcxMDd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
        title: '찬양예배',
        date: '2024.02',
        image: 'https://images.unsplash.com/photo-1558541966-a801364c934b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaHVyY2glMjB3b3JzaGlwJTIwYmFuZCUyMHNpbmdpbmd8ZW58MXx8fHwxNzcxMTI3MTA4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
        title: '모임',
        date: '2024.01',
        image: 'https://images.unsplash.com/photo-1730875650907-b988c91fe120?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmllbmRzJTIwZ3JvdXAlMjBnYXRoZXJpbmclMjBoYXBweXxlbnwxfHx8fDE3NzExMjcxMDh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
        title: '교제',
        date: '2023.12',
        image: 'https://images.unsplash.com/photo-1551327420-4b280d52cc68?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaHVyY2glMjBmZWxsb3dzaGlwJTIwY29tbXVuaXR5fGVufDF8fHx8MTc3MTEyNzEwOXww&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
        title: '청년 축제',
        date: '2023.11',
        image: 'https://images.unsplash.com/photo-1759851684103-1fe22424d088?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3V0aCUyMGNlbGVicmF0aW9uJTIwdG9nZXRoZXJ8ZW58MXx8fHwxNzcxMTI3MTA5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
];

export default function Home() {
    // const [activeNewsIndex, setActiveNewsIndex] = useState<number | null>(null);
    const [activeNewsIndex, setActiveNewsIndex] = useState<number[]>([]);
    const [selectedLeader, setSelectedLeader] = useState<number | null>(null);
    const [showToast, setShowToast] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [activeSection, setActiveSection] = useState('home');
    const [bulletin, setBulletin] = useState<any>(null);
    const [leaders, setLeaders] = useState<{ id: string; role: string; name: string; phone: string; imageUrl: string }[]>([]);
    const navigate = useNavigate();

    // 관리자페이지에서 한 번도 저장한 적이 없으면(컬렉션이 비어있으면) 기존 하드코딩 값을 그대로 보여줌
    const displayLeaders: { id?: string; role: string; name: string; phone: string; imageUrl: string }[] =
        leaders.length > 0 ? leaders : defaultLeaderData;

    // 수련회 광고 배너
    const [isRetreatModalOpen, setIsRetreatModalOpen] = useState(false);
    const [isExpanding, setIsExpanding] = useState(false);
    const [retreatEnabled, setRetreatEnabled] = useState(true);

    // 광고 배너 링크 선택 시트
    const [showBannerLinkPicker, setShowBannerLinkPicker] = useState(false);

    const handleBannerClick = () => {
        // adBannerLinks(신규 배열)가 없고 예전 단일 링크(adBannerLinkUrl)만 저장되어 있는 경우 대비
        const links = bulletin?.adBannerLinks?.length > 0
            ? bulletin.adBannerLinks
            : (bulletin?.adBannerLinkUrl ? [{ label: '', url: bulletin.adBannerLinkUrl }] : []);
        if (links.length === 1) {
            window.open(links[0].url, '_blank', 'noopener,noreferrer');
        } else if (links.length > 1) {
            setShowBannerLinkPicker(true);
        }
    };

    const getWeekOfMonth = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const date = today.getDate();
        const firstDay = new Date(year, today.getMonth(), 1).getDay();
        const week = Math.ceil((date + firstDay) / 7);
        return { month, week };
    };

    const { month, week } = getWeekOfMonth();
    // const toggleNews = (index: number) => {
    //     setActiveNewsIndex(activeNewsIndex === index ? null : index);
    // };

    const toggleNews = (qIndex: number) => {
        setActiveNewsIndex((prev) => {
            // prev가 배열이 아닐 경우를 대비한 안전장치
            const currentIndices = Array.isArray(prev) ? prev : [];

            return currentIndices.includes(qIndex)
                ? currentIndices.filter((id) => id !== qIndex) // 있으면 제거
                : [...currentIndices, qIndex];                // 없으면 추가
        });
    };

    interface ModalData {
        title: string;
        content: string;
    }
    const [modalContent, setModalContent] = useState<ModalData | null>(null);

    useEffect(() => {
        // Firebase 리스너 연결 (실시간으로 데이터를 가져옵니다)
        const unsub = onSnapshot(doc(db, "bulletin", "current"), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                // 1. 전체 데이터를 bulletin 상태에 저장
                setBulletin(data);

                // 2. (선택사항) 만약 applyQuestions를 별도 상태로 관리한다면 아래 코드 사용
                // setApplyQuestions(data.applyQuestions || []);
            } else {
                console.log("데이터가 존재하지 않습니다.");
            }
        });

        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 300);

            // 현재 스크롤 위치에 따라 활성 섹션 결정
            const sections = ['worship', 'home', 'news', 'gallery', 'leaders'];
            const scrollPosition = window.scrollY + 200; // 오프셋 추가

            for (const sectionId of sections) {
                const element = document.getElementById(sectionId);
                if (element) {
                    const { offsetTop, offsetHeight } = element;
                    if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                        setActiveSection(sectionId);
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            unsub(); // Firebase 연결 끊기
        };
    }, []);

    useEffect(() => {
        // 수련회 안내 사용 여부 실시간 반영 (관리자 페이지 토글)
        const unsubRetreat = onSnapshot(doc(db, "retreat", "summercamp"), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setRetreatEnabled(data.retreatEnabled !== undefined ? data.retreatEnabled : true);
            }
        });
        return () => unsubRetreat();
    }, []);

    useEffect(() => {
        // 섬기는 사람들: 관리자페이지에서 추가/수정/삭제하면 실시간으로 반영
        const unsubLeaders = onSnapshot(query(collection(db, "leaders"), orderBy("order")), (snap) => {
            setLeaders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as any)));
        });
        return () => unsubLeaders();
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // const toggleNews = (index: number) => {
    //     setActiveNewsIndex(activeNewsIndex === index ? null : index);
    // };

    const openProfile = (index: number) => {
        setSelectedLeader(index);
        document.body.style.overflow = 'hidden';
    };

    const closeProfile = () => {
        setSelectedLeader(null);
        document.body.style.overflow = 'auto';
    };

    const copyToClipboard = (text: string) => {
        const tempInput = document.createElement('textarea');
        tempInput.value = text;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);

        setShowToast(true);
        setTimeout(() => {
            setShowToast(false);
        }, 2000);
    };

    const currentDate = new Date(); // Date
    const monthYear = `${currentDate.getFullYear()}.${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const [isConfessionOpen, setIsConfessionOpen] = useState(false); // 공동체의 고백 상태 관리 

    const handleRetreatClick = () => {
        setIsExpanding(true);
        setTimeout(() => {
            navigate('/SummerCamp');
        }, 350); // 0.35초 동안 시각적 확장 연출 후 최종 라우팅 이동
    };

    return (
        <div className="bg-[#E8DDD5] text-slate-900 selection:bg-purple-200 pb-24">

            <style>{`
                @keyframes scaleUpOverlay {
                    0% { transform: scale(0.96); opacity: 0; }
                    40% { opacity: 0.95; }
                    100% { transform: scale(1.05); opacity: 1; background: #F2F4F8; }
                }
                .animate-expand-route {
                    animation: scaleUpOverlay 0.38s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }
            `}</style>

            {/* 🔴 [추가] 클릭 시 토스 앱처럼 화면 가득 하얗고 부드럽게 덮어오는 리얼 머티리얼 모션 레이어 */}
            {isExpanding && (
                <div className="animate-expand-route fixed inset-0 z-[100] pointer-events-none" />
            )}

            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#8B7466] shadow-md w-full">
                <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">
                    <h1 className="text-lg font-bold text-white font-[Arita_Dotum_KR] whitespace-nowrap">
                        곤지암 만나교회 청년부
                    </h1>

                    <button
                        // onClick={() => window.location.href = '/admin'}
                        onClick={() => window.open('/admin', '_blank', 'noopener,noreferrer')} // 새 탭으로 지원
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/90 border border-white/20 transition-all active:scale-95"
                    >
                        <Lock size={12} className="opacity-80" />
                        <span className="text-[10px] font-bold tracking-tight uppercase font-[Arita_Dotum_KR]">Admin</span>
                    </button>
                </div>
            </header>

            

            {retreatEnabled && (
            <div className="sticky top-16 z-40 w-full bg-[#5D4A41] text-white shadow-md border-t border-white/5 font-[Arita_Dotum_KR]">
                <div
                    // onClick={() => setIsRetreatModalOpen(true)}
                    onClick={handleRetreatClick} // 🔴 [수정] 무미건조한 즉시이동에서 모션 연동 헨들러로 스위칭
                    className="max-w-md mx-auto px-5 py-3 flex items-center justify-between cursor-pointer active:bg-black/10 transition-colors"
                    style={{
                        transform: isExpanding ? 'scale(0.97)' : 'none',
                        opacity: isExpanding ? 0.9 : 1
                    }}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-[#D4C3B3]/20 p-2 rounded-xl">
                            <Calendar size={18} className="text-[#EADCC9]" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[9px] bg-[#C87A53] font-bold px-1.5 py-0.5 rounded text-white tracking-wider">공지</span>
                                <p className="text-xs font-medium text-[#EADCC9] tracking-tight">2026 여름수련회 신청 안내</p>
                            </div>
                            <p className="text-sm font-bold text-white mt-0.5 tracking-tight">"나라가 임하시오며" — 자세히 보기</p>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-white/40 group-hover:text-white transition-colors" />
                </div>
            </div>
            )}

            {bulletin?.adBannerEnabled && bulletin?.adBannerTitle && !isExpired(bulletin?.adBannerExpiryEnabled, bulletin?.adBannerExpiryAt) && (
                <div className="max-w-md mx-auto px-4 pt-4">
                    <button
                        onClick={handleBannerClick}
                        className="relative w-full bg-[#8B7466] rounded-2xl shadow-lg p-5 flex items-center justify-between gap-3 text-left active:scale-[0.98] transition-transform"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-1.5 h-10 bg-[#C87A53] rounded-full shrink-0"></div>
                            <div className="min-w-0">
                                <p className="font-black text-white text-[15px] truncate font-[Arita_Dotum_KR]">{bulletin.adBannerTitle}</p>
                                {bulletin.adBannerDescription && (
                                    <p className="text-[#EADCC9] text-[12px] font-medium truncate font-[Arita_Dotum_KR] mt-0.5">{bulletin.adBannerDescription}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="bg-[#C87A53] text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">AD</span>
                            <ChevronRight size={16} className="text-white/40" />
                        </div>
                    </button>
                </div>
            )}

            {/* Main Content */}
            <main className="px-4 pt-6 max-w-md mx-auto space-y-8">
                {/* 1. Worship Section with Background - Moved to Top */}
                <section id="worship" className="scroll-mt-24">
                    {/* Hero worship card with mountain background */}
                    <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl mb-6">
                        {/* Background Image */}
                        <div className="absolute inset-0">
                            <img
                                src={bulletinBg}
                                alt="Mountain background"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/50"></div>
                        </div>

                        {/* Content Overlay */}
                        <div className="relative z-10 p-8 min-h-[400px] flex flex-col justify-center text-white">
                            {/* Worship Message - Centered */}
                            <div className="text-center mb-10">
                                <p className="text-xs uppercase tracking-widest mb-3 opacity-90 font-[Arita_Dotum_KR]">
                                    {bulletin?.date || "2026.04.12"}
                                </p>
                                <h1 className="text-3xl font-black leading-tight font-[Arita_Buri_KR] mx-[0px] mt-[30px] mb-[12px] whitespace-pre-line">
                                    {bulletin?.title || "Second Chance"}
                                </h1>
                                <p className="text-base opacity-95 italic mt-2 font-[Arita_Dotum_KR]">
                                    {bulletin?.scripture || "요한복음 21:15-17"}
                                </p>
                            </div>

                            {/* Worship Order */}
                            {/* 불필요한 배경색이나 마진 제거, 폰트 스타일 완전 통일 */}
                            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                                <h3 className="font-bold mb-6 text-center opacity-90 text-[16px] font-[Arita_Dotum_KR] tracking-wider">예배 순서</h3>
                                <div className="space-y-5 text-sm">
                                    {(bulletin?.worshipOrder && bulletin.worshipOrder.length > 0 ? bulletin.worshipOrder : defaultWorshipOrder).map((item: any, idx: number) => {
                                        // 신앙고백 / 예배자의 고백: 클릭하면 상세 내용 팝업
                                        if (item.modalSource) {
                                            const modalTitle = item.modalSource === "creed"
                                                ? `${item.label} (${item.value})`
                                                : item.label;
                                            const modalText = item.modalSource === "creed"
                                                ? `${bulletin?.apostlesCreed || ""}\n\n${bulletin?.psalms || ""}`
                                                : (bulletin?.worshipperConfession || "하나님, 오늘도 우리가 한 마음으로 모여...");

                                            return (
                                                <div
                                                    key={item.key || idx}
                                                    onClick={() => setModalContent({ title: modalTitle, content: modalText })}
                                                    className="flex justify-between items-center cursor-pointer hover:bg-white/10 p-2 -mx-2 rounded-xl transition-all group"
                                                >
                                                    <span className="opacity-90 flex items-center gap-2 font-[Arita_Dotum_KR] text-[15px]">
                                                        {item.label}
                                                        <MessageSquare size={14} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                                                    </span>
                                                    <span className="font-bold font-[Arita_Dotum_KR] text-[15px]">{item.value}</span>
                                                </div>
                                            );
                                        }

                                        // 설교자/소식담당자/축도자와 연동되는 항목 (해당 필드가 비어 있으면 저장된 기본값 사용)
                                        const displayValue = item.dynamicSource
                                            ? (bulletin?.[item.dynamicSource] || item.value)
                                            : item.value;

                                        // 말씀 선포(설교자 연동) 항목은 이름 아래에 본문 구절도 함께 표시
                                        if (item.dynamicSource === "preacher") {
                                            return (
                                                <div key={item.key || idx} className="flex justify-between items-start">
                                                    <span className="opacity-90 font-[Arita_Dotum_KR] text-[15px] pt-0.5">{item.label}</span>
                                                    <div className="flex flex-col items-end gap-0.5">
                                                        <span className="font-black font-[Arita_Dotum_KR] text-[16px]">{displayValue}</span>
                                                        {bulletin?.scripture && (
                                                            <span className="opacity-70 font-[Arita_Dotum_KR] text-[13px]">{bulletin.scripture}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={item.key || idx} className="flex justify-between items-center">
                                                <span className="opacity-90 font-[Arita_Dotum_KR] text-[15px]">{item.label}</span>
                                                <span className="font-bold font-[Arita_Dotum_KR] text-[15px]">
                                                    {displayValue}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Modal Portal */}
                        {modalContent && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
                                {/* 뒷배경 흐리게 (클릭 시 닫힘) */}
                                <div
                                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                    onClick={() => setModalContent(null)}
                                />

                                {/* 팝업 박스 */}
                                <div className="relative bg-[#F2EFE1] w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
                                    <header className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-bold text-[#4A3528] font-[Arita_Dotum_KR]">
                                            {modalContent.title}
                                        </h2>
                                        <button
                                            onClick={() => setModalContent(null)}
                                            className="text-[#8B7456] p-1 hover:bg-black/5 rounded-full transition-colors"
                                        >
                                            <X size={24} />
                                        </button>
                                    </header>

                                    {/* 내용 영역: 스크롤 가능하도록 설정 */}
                                    <div className="max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
                                        <p className="text-[#4A3528] leading-[1.8] font-[Arita_Dotum_KR] whitespace-pre-wrap text-[16px]">
                                            {modalContent.content}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => setModalContent(null)}
                                        className="w-full mt-8 bg-[#8B7456] text-white py-4 rounded-2xl font-bold active:scale-[0.98] transition-all font-[Arita_Dotum_KR]"
                                    >
                                        닫기
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 광고 배너 링크 선택 시트 (링크가 2개 이상일 때만 사용) */}
                        {showBannerLinkPicker && bulletin?.adBannerLinks?.length > 1 && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
                                <div
                                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                    onClick={() => setShowBannerLinkPicker(false)}
                                />
                                <div className="relative bg-[#F2EFE1] w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
                                    <header className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-bold text-[#4A3528] font-[Arita_Dotum_KR]">
                                            {bulletin.adBannerTitle}
                                        </h2>
                                        <button
                                            onClick={() => setShowBannerLinkPicker(false)}
                                            className="text-[#8B7456] p-1 hover:bg-black/5 rounded-full transition-colors"
                                        >
                                            <X size={24} />
                                        </button>
                                    </header>

                                    <div className="space-y-3">
                                        {bulletin.adBannerLinks.map((link: { label: string; url: string }, idx: number) => (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    window.open(link.url, '_blank', 'noopener,noreferrer');
                                                    setShowBannerLinkPicker(false);
                                                }}
                                                className="w-full bg-white rounded-2xl p-4 flex items-center justify-between text-left border border-[#9C8577]/20 active:scale-[0.98] transition-transform"
                                            >
                                                <span className="font-bold text-[#4A3528] font-[Arita_Dotum_KR]">
                                                    {link.label || `링크 ${idx + 1}`}
                                                </span>
                                                <ChevronRight size={18} className="text-[#9C8577]" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Offering Information */}
                    <div className="bg-[#4A3528] text-white rounded-3xl p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg tracking-tight">온라인 헌금 안내</h3>

                        </div>
                        <div className="bg-white/10 rounded-2xl p-4 mb-4 border border-white/5">
                            <p className="text-white/60 mb-1 uppercase text-[12px] font-[Noto_Sans_KR]">국민은행 | 곤지암 만나교회 </p>
                            <p className="text-xl font-black tracking-wider font-[Noto_Sans_KR] font-normal">633801-04-126716</p>
                        </div>
                        <button
                            onClick={() =>
                                copyToClipboard('633801-04-126716')
                            }
                            className="w-full py-3.5 bg-[#9C8577] hover:bg-[#8B7466] rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg font-[Noto_Sans_KR]"
                        >
                            <Copy className="w-4 h-4" /> 계좌번호 복사하기
                        </button>
                    </div>
                </section>

                <hr className="border-[#9C8577]/20" />

                {/* 관리자 페이지에서 '사용중(true)'일 때만 이 섹션을 렌더링합니다. bulletin 데이터에 showApplyQuestions가 true인지 확인하는 조건문 추가*/}
                {bulletin?.showApplyQuestions !== false && (
                    <section id="home" className="fade-in scroll-mt-24">
                        {/* 말씀 적용을 위한 질문 Section */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold text-[#4A3528]">말씀 적용을 위한 질문</h2>
                            </div>

                            <div className="space-y-3">
                                {/* 1. 토글이 켜져 있고, 2. 질문 데이터도 있을 때만 리스트 출력 */}
                                {bulletin?.applyQuestions && bulletin.applyQuestions.length > 0 ? (
                                    bulletin.applyQuestions.map((q: any, index: number) => {
                                        const qIndex = index + 100;
                                        // [수정] 단일 비교가 아닌, 배열 안에 내 번호가 있는지 확인합니다.
                                        // const isOpen = activeNewsIndex.includes(qIndex);
                                        const isOpen = Array.isArray(activeNewsIndex) && activeNewsIndex.includes(qIndex);

                                        return (
                                            <div key={index} className="bg-white rounded-2xl border border-[#9C8577]/20 shadow-sm overflow-hidden transition-all">
                                                <button
                                                    onClick={() => toggleNews(qIndex)}
                                                    className="w-full p-5 flex items-start justify-between gap-3 text-left hover:bg-[#9C8577]/5 transition-colors"
                                                >
                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-[#4A3528] mb-2 font-[Arita_Dotum_KR]">
                                                            {q.title}
                                                        </h3>
                                                        <div className={`text-sm text-slate-600 leading-relaxed font-[Arita_Dotum_KR] ${isOpen ? '' : 'line-clamp-2'}`}>
                                                            {q.quote && (
                                                                <span className="italic text-[#8B7466] block mb-3 font-medium">
                                                                    "{q.quote}"
                                                                </span>
                                                            )}
                                                            {isOpen && (
                                                                <span className="block whitespace-pre-wrap">
                                                                    {q.content}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <ChevronDown
                                                        className={`w-4 h-4 text-slate-300 shrink-0 mt-1 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                                    />
                                                </button>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-10 bg-white/50 rounded-2xl border border-dashed border-[#9C8577]/30 text-slate-400 text-sm">
                                        현재 등록된 질문이 없습니다.
                                    </div>
                                )}
                            </div>
                        </div>
                        <hr className="border-[#9C8577]/20 my-8" />
                    </section>
                )}


                {/* 2. Home Section - Simplified */}
                <section id="home" className="fade-in scroll-mt-24">
                    {/* Community News Section */}
                    {/* 공동체 소식 목록 */}
                    <div className="flex items-center justify-between mb-4">
                        {/* h2와 배지가 이 flex div 안에 나란히 있어야 합니다 */}
                        <h2 className="text-2xl font-bold text-[#4A3528]">공동체 소식</h2>

                        {/* 기존 스타일을 그대로 적용한 배지 */}
                        <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                            {month}월 {week}주
                        </div>
                    </div>
                    <div className="space-y-3">
                        {bulletin?.churchNews?.map((news: any, index: number) => (
                            <div key={index} className="bg-white rounded-2xl border border-[#9C8577]/20 shadow-sm overflow-hidden transition-all">
                                <button
                                    onClick={() => toggleNews(index)}
                                    className="w-full p-5 flex items-start justify-between gap-3 text-left hover:bg-[#9C8577]/5 transition-colors"
                                >
                                    <div className="flex-1">
                                        {/* DB에서 가져온 제목 */}
                                        <h3 className="font-bold text-[#4A3528] mb-2 font-[Arita_Dotum_KR]">
                                            {news.title}
                                        </h3>
                                        {/* DB에서 가져온 내용 */}
                                        <p className={`text-sm text-slate-600 leading-relaxed font-[Arita_Dotum_KR] ${activeNewsIndex.includes(index) ? '' : 'line-clamp-2'}`}>
                                            {news.content}
                                        </p>
                                    </div>
                                    <ChevronDown
                                        className={`w-4 h-4 text-slate-300 shrink-0 mt-1 transition-transform ${activeNewsIndex.includes(index) ? '' : 'line-clamp-2'}`}
                                    />
                                </button>
                            </div>
                        ))}
                    </div>

                    <hr className="border-[#9C8577]/20 my-8" />

                    {/* Worship Info */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#9C8577]/20 mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-1 h-4 bg-[#8B7466] rounded-full"></div>
                            <h2 className="font-bold text-[#4A3528]">예배 안내</h2>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">

                                <div>
                                    <p className="text-xs text-slate-500 font-bold mb-1">예배 시간</p>
                                    <p className="text-sm text-slate-800 font-bold">매주 주일 오후 1시</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">

                                <div>
                                    <p className="text-xs text-slate-500 font-bold mb-1">예배 장소</p>
                                    <p className="text-sm text-slate-800 font-bold">곤지암 만나교회 2층 본당 (예루살렘홀)</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Theme Verse */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#9C8577]/20 mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-1 h-4 bg-[#8B7466] rounded-full"></div>
                            <h2 className="font-bold text-[#4A3528]">주제 성구&nbsp;&nbsp;</h2>
                        </div>
                        <p className="text-slate-700 italic text-sm leading-relaxed mb-4">
                            "인자가 온 것은 섬김을 받으려 함이 아니라 도리어 섬기려 하고 자기
                            목숨을 많은 사람의 대속물로 주려 함이니라"
                        </p>
                        <p className="text-[#8B7466] text-xs font-bold text-right">
                            - 마가복음 10장 45절 -
                        </p>
                    </div>
                </section>

                <hr className="border-[#9C8577]/20" />

                {/* Leaders Section */}
                <section id="leaders" className="scroll-mt-24">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-[#4A3528]">
                            섬기는 사람들
                        </h2>
                    </div>
                    <div className="bg-white rounded-3xl border border-[#9C8577]/20 shadow-sm overflow-hidden">
                        {displayLeaders.map((leader, index) => (
                            <div
                                key={leader.id ?? index}
                                className="flex items-center justify-between p-5 border-b border-[#9C8577]/10 last:border-0 hover:bg-[#9C8577]/5 transition-colors cursor-pointer"
                                onClick={() => openProfile(index)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-[#9C8577]/10 flex items-center justify-center text-[#8B7466] border border-[#9C8577]/20 shrink-0 overflow-hidden">
                                        {leader.imageUrl ? (
                                            <img src={leader.imageUrl} alt={leader.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-5 h-5" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">{leader.role}</p>
                                        <p className="font-black text-[#4A3528] text-sm tracking-tight">{leader.name}</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-200" />
                            </div>
                        ))}
                    </div>
                </section>

                <hr className="border-[#9C8577]/20" />

                {/* Social Links */}
                <section className="fade-in">

                    <div className="grid grid-cols-2 gap-4">
                        <a
                            href="https://www.instagram.com/manna_youthgroup/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white p-4 rounded-2xl border border-[#9C8577]/20 flex flex-col items-center gap-2 shadow-sm active:scale-95 transition-transform"
                        >
                            <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center text-pink-500">
                                <Instagram className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-slate-700">
                                인스타그램
                            </span>
                        </a>
                        <a
                            href="/worship"
                            className="bg-white p-4 rounded-2xl border border-[#9C8577]/20 flex flex-col items-center gap-2 shadow-sm active:scale-95 transition-transform"
                        >
                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                                <Youtube className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-slate-700">
                                이번주 찬양 듣기
                            </span>
                        </a>
                        <a
                            href="https://www.youtube.com/@곤지암만나교회"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="col-span-2 bg-white p-4 rounded-2xl border border-[#9C8577]/20 flex flex-col items-center gap-2 shadow-sm active:scale-95 transition-transform">
                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                                <Youtube className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-slate-700">
                                곤지암 만나교회 채널
                            </span>
                        </a>
                    </div>
                </section>

                <footer className="text-center py-12">
                    <p className="text-[#9C8577] text-[10px] font-medium">섬김으로 하나님 나라를 세워가는 만나 청년부</p>
                    <p className="text-[#9C8577] text-[10px] font-medium">모바일 / 온라인 주보 문의 : 0502-1937-0615</p>
                </footer>
            </main>

            <div
                id="profile-modal"
                className={`fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#4A3528]/60 backdrop-blur-sm ${selectedLeader === null ? 'hidden' : ''
                    }`}
                onClick={(e) => {
                    if (e.target === e.currentTarget) closeProfile();
                }}
            >
                {selectedLeader !== null && (
                    <div
                        id="profile-card"
                        className="bg-white w-full max-w-xs rounded-[2.5rem] overflow-hidden shadow-2xl relative"
                    >
                        <button
                            onClick={closeProfile}
                            className="absolute top-5 right-5 z-10 w-8 h-8 bg-white/90 text-slate-400 rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-lg"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Profile Image - Rectangle */}
                        <div className="relative w-full aspect-[3/4] bg-gradient-to-br from-[#9C8577]/20 to-[#E8DDD5] overflow-hidden">
                            {displayLeaders[selectedLeader].imageUrl ? (
                                <img
                                    src={displayLeaders[selectedLeader].imageUrl}
                                    alt={displayLeaders[selectedLeader].name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <User className="w-24 h-24 text-slate-300" />
                                </div>
                            )}
                        </div>

                        <div className="p-8">
                            {/* Name and Role */}
                            <div className="text-center mb-6">
                                <p className="text-[#8B7466] text-xs font-black uppercase tracking-[0.2em] mb-2">
                                    {displayLeaders[selectedLeader].role}
                                </p>
                                <h3 className="text-2xl font-black text-[#4A3528]">
                                    {displayLeaders[selectedLeader].name}
                                </h3>
                            </div>

                            {/* Phone Number Display */}
                            <div className="flex items-center justify-center gap-2 bg-slate-50 py-3 rounded-2xl mb-4">
                                <Phone className="w-4 h-4 text-slate-400" />
                                <span className="text-slate-600 font-bold tracking-wider">
                                    {displayLeaders[selectedLeader].phone}
                                </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-3">
                                <a
                                    href={`tel:${displayLeaders[selectedLeader].phone}`}
                                    className="bg-[#9C8577] hover:bg-[#8B7466] text-white py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                                >
                                    <PhoneCall className="w-4 h-4" />
                                    <span className="font-bold text-sm">전화하기</span>
                                </a>
                                <a
                                    href={`sms:${displayLeaders[selectedLeader].phone}`}
                                    className="bg-[#4A3528] hover:bg-[#3A2518] text-white py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    <span className="font-bold text-sm">문자하기</span>
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </div>


            {/* Scroll to Top Button */}
            <button
                onClick={scrollToTop}
                className={`fixed bottom-6 right-6 w-10 h-10 bg-white border border-[#9C8577]/30 rounded-full shadow-lg flex items-center justify-center text-[#8B7466] z-50 transition-opacity active:scale-90 ${showScrollTop ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
            >
                <ArrowUp className="w-5 h-5" />
            </button>

            {/* Toast Notification */}
            <div
                className={`fixed left-1/2 -translate-x-1/2 top-20 z-50 bg-[#4A3528] text-white px-6 py-3 rounded-full text-sm font-bold shadow-xl transition-all duration-300 pointer-events-none ${showToast ? 'opacity-100' : 'opacity-0'
                    }`}
            >
                계좌번호가 복사되었습니다!
            </div>
        </div>
    );
}
