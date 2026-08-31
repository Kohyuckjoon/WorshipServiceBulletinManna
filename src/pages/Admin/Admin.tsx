import { useAdminData } from '../../hooks/useAdminData';
import {
    Calendar, Plus, Trash2, LogOut, Lock, CheckCircle2,
    AlertCircle, CalendarDays, Edit3, BookOpen, User, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, RefreshCw,
    MessageSquare, Quote, Eye, EyeOff, Check, Info, Music, Megaphone, Link2, Image
} from "lucide-react";
import LoginForm from './LoginForm';
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, collection, addDoc, updateDoc, deleteDoc, getDocs, onSnapshot, query, orderBy } from 'firebase/firestore';

// 🔴 이미지를 Firestore 문서에 그대로 저장할 수 있도록 브라우저에서 리사이즈+압축 (Storage 미사용, 완전 무료)
const compressImageToDataUrl = (file: File, maxBytes = 700000): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new window.Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                const maxDimension = 1200;
                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) { reject(new Error('캔버스를 생성할 수 없습니다.')); return; }
                ctx.drawImage(img, 0, 0, width, height);

                let quality = 0.85;
                let dataUrl = canvas.toDataURL('image/jpeg', quality);
                while (dataUrl.length > maxBytes && quality > 0.3) {
                    quality -= 0.1;
                    dataUrl = canvas.toDataURL('image/jpeg', quality);
                }
                resolve(dataUrl);
            };
            img.onerror = () => reject(new Error('이미지를 불러올 수 없습니다.'));
            img.src = reader.result as string;
        };
        reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
        reader.readAsDataURL(file);
    });
};

export default function Admin() {
    const [editingIdx, setEditingIdx] = useState<number | null>(null);
    const [editingApplyIdx, setEditingApplyIdx] = useState<number | null>(null);
    // const [preacher, setPreacher] = useState("");
    // const [benedictionBy, setBenedictionBy] = useState("");

    // 🔴 수련회 포스터 (별도 문서 retreat/summercamp, Firestore에 압축 이미지 직접 저장 - Storage 미사용)
    const [posterImageUrl, setPosterImageUrl] = useState("");
    const [posterPreview, setPosterPreview] = useState("");
    const [uploadingPoster, setUploadingPoster] = useState(false);
    const [savingPoster, setSavingPoster] = useState(false);
    const [posterSaved, setPosterSaved] = useState(false);

    // 🔴 수련회 조 편성 이미지 (같은 문서에 함께 저장)
    const [groupImageUrl, setGroupImageUrl] = useState("");
    const [groupPreview, setGroupPreview] = useState("");
    const [uploadingGroup, setUploadingGroup] = useState(false);

    // 🔴 수련회 안내 사용 여부 (메인 화면 공지 배너 + /SummerCamp 접근 여부를 함께 제어)
    const [retreatEnabled, setRetreatEnabled] = useState(true);

    // 🔴 수련회 정보 카드 (일시/장소/회비/문의/준비물/주의사항) - 기본값은 /SummerCamp의 기존 하드코딩 값과 동일
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

    // 🔴 섬기는 사람들 (별도 컬렉션 leaders, 인원별로 문서 하나씩 - 사진이 여러 명이라 문서 하나에 다 넣으면 1MB 제한에 걸릴 수 있어서 분리)
    interface LeaderItem { id: string; role: string; name: string; phone: string; imageUrl: string; order: number; }
    const [leaders, setLeaders] = useState<LeaderItem[]>([]);
    const [editingLeaderId, setEditingLeaderId] = useState<string | null>(null);
    const [newLeaderRole, setNewLeaderRole] = useState("");
    const [newLeaderName, setNewLeaderName] = useState("");
    const [newLeaderPhone, setNewLeaderPhone] = useState("");
    const [newLeaderImageUrl, setNewLeaderImageUrl] = useState("");
    const [uploadingNewLeaderImage, setUploadingNewLeaderImage] = useState(false);
    const [savingNewLeader, setSavingNewLeader] = useState(false);
    const [editRole, setEditRole] = useState("");
    const [editName, setEditName] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [editImageUrl, setEditImageUrl] = useState("");
    const [uploadingEditLeaderImage, setUploadingEditLeaderImage] = useState(false);
    const [savingEditLeader, setSavingEditLeader] = useState(false);

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
        youtubeId, setYoutubeId,
        adBannerEnabled, setAdBannerEnabled,
        adBannerTitle, setAdBannerTitle,
        adBannerDescription, setAdBannerDescription,
        adBannerLinks, setAdBannerLinks,
        newBannerLinkLabel, setNewBannerLinkLabel,
        newBannerLinkUrl, setNewBannerLinkUrl,

        // 주보 상세 컨텐츠
        churchNews, setChurchNews, newNewsTitle, setNewNewsTitle, newNewsContent, setNewNewsContent,
        showApplyQuestions, setShowApplyQuestions, applyQuestions, setApplyQuestions,
        newQTitle, setNewQTitle, newQQuote, setNewQQuote, newQContent, setNewQContent,
        historyList, worshipperConfession, setWorshipperConfession,
        apostlesCreed, setApostlesCreed, psalms, setPsalms,
        worshipOrder, moveWorshipOrderItem, updateWorshipOrderLabel, updateWorshipOrderValue,
        addWorshipOrderItem, removeWorshipOrderItem,
        newWorshipLabel, setNewWorshipLabel, newWorshipValue, setNewWorshipValue,

        // 실행 함수들
        renderCalendarDays, handleLogin, handleLogout, handleUpdate
    } = useAdminData();

    // 🔴 공동체 소식 순서 이동 (드래그 대신 위/아래 버튼 방식)
    const moveNewsItem = (index: number, direction: "up" | "down") => {
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= churchNews.length) return;
        const newList = [...churchNews];
        [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
        setChurchNews(newList);
    };

    // 🔴 말씀 적용 질문 순서 이동 (드래그 대신 위/아래 버튼 방식)
    const moveQuestionItem = (index: number, direction: "up" | "down") => {
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= applyQuestions.length) return;
        const newList = [...applyQuestions];
        [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
        setApplyQuestions(newList);
    };

    // 🔴 로그인 후 기존 포스터 불러오기
    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                const snap = await getDoc(doc(db, "retreat", "summercamp"));
                if (snap.exists()) {
                    const data = snap.data();
                    const url = data.posterImageUrl || "";
                    setPosterImageUrl(url);
                    setPosterPreview(url);
                    const groupUrl = data.groupImageUrl || "";
                    setGroupImageUrl(groupUrl);
                    setGroupPreview(groupUrl);
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
            } catch (err) {
                console.error("포스터 로드 실패:", err);
            }
        })();
    }, [user]);

    // 🔴 섬기는 사람들 실시간 목록 (컬렉션 leaders, order 순 정렬)
    useEffect(() => {
        if (!user) return;
        const unsub = onSnapshot(query(collection(db, "leaders"), orderBy("order")), (snap) => {
            setLeaders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as LeaderItem)));
        });
        return () => unsub();
    }, [user]);

    // 🔴 컬렉션이 비어있으면(최초 1회) 기존 Home.tsx에 하드코딩되어 있던 7명을 그대로 옮겨서 시작 (사진은 없이 시작, 편집에서 추가 가능)
    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                const snap = await getDocs(collection(db, "leaders"));
                if (snap.empty) {
                    const defaults = [
                        { role: "담당", name: "임원일 목사님", phone: "010-6258-8105" },
                        { role: "부장", name: "박양규 장로님", phone: "010-2277-9734" },
                        { role: "간사", name: "고혁준 간사님", phone: "010-9231-1175" },
                        { role: "회장", name: "최지환 청년", phone: "010-3180-6322" },
                        { role: "총무", name: "박은희 청년", phone: "010-5767-9734" },
                        { role: "회계", name: "배소연 청년", phone: "010-3646-4475" },
                        { role: "서기", name: "김석진 청년", phone: "010-7164-4068" },
                    ];
                    for (let i = 0; i < defaults.length; i++) {
                        await addDoc(collection(db, "leaders"), { ...defaults[i], imageUrl: "", order: i });
                    }
                }
            } catch (err) {
                console.error("섬기는 사람들 초기화 실패:", err);
            }
        })();
    }, [user]);

    const handleNewLeaderImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingNewLeaderImage(true);
        try {
            const dataUrl = await compressImageToDataUrl(file, 400000);
            setNewLeaderImageUrl(dataUrl);
        } catch (err) {
            console.error("이미지 처리 실패:", err);
            alert("이미지를 처리하는 데 실패했습니다.");
        } finally {
            setUploadingNewLeaderImage(false);
            e.target.value = "";
        }
    };

    const handleEditLeaderImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingEditLeaderImage(true);
        try {
            const dataUrl = await compressImageToDataUrl(file, 400000);
            setEditImageUrl(dataUrl);
        } catch (err) {
            console.error("이미지 처리 실패:", err);
            alert("이미지를 처리하는 데 실패했습니다.");
        } finally {
            setUploadingEditLeaderImage(false);
            e.target.value = "";
        }
    };

    const addLeader = async () => {
        if (!newLeaderRole.trim() || !newLeaderName.trim()) return;
        setSavingNewLeader(true);
        try {
            await addDoc(collection(db, "leaders"), {
                role: newLeaderRole.trim(),
                name: newLeaderName.trim(),
                phone: newLeaderPhone.trim(),
                imageUrl: newLeaderImageUrl,
                order: leaders.length,
            });
            setNewLeaderRole("");
            setNewLeaderName("");
            setNewLeaderPhone("");
            setNewLeaderImageUrl("");
        } catch (err) {
            console.error("추가 실패:", err);
            alert("추가에 실패했습니다.");
        } finally {
            setSavingNewLeader(false);
        }
    };

    const startEditLeader = (item: LeaderItem) => {
        setEditingLeaderId(item.id);
        setEditRole(item.role);
        setEditName(item.name);
        setEditPhone(item.phone);
        setEditImageUrl(item.imageUrl || "");
    };

    const saveEditLeader = async () => {
        if (!editingLeaderId || !editRole.trim() || !editName.trim()) return;
        setSavingEditLeader(true);
        try {
            await updateDoc(doc(db, "leaders", editingLeaderId), {
                role: editRole.trim(),
                name: editName.trim(),
                phone: editPhone.trim(),
                imageUrl: editImageUrl,
            });
            setEditingLeaderId(null);
        } catch (err) {
            console.error("수정 실패:", err);
            alert("수정에 실패했습니다.");
        } finally {
            setSavingEditLeader(false);
        }
    };

    const deleteLeader = async (id: string) => {
        try {
            await deleteDoc(doc(db, "leaders", id));
        } catch (err) {
            console.error("삭제 실패:", err);
            alert("삭제에 실패했습니다.");
        }
    };

    // 🔴 섬기는 사람들 순서 이동 (드래그 대신 위/아래 버튼 방식, 이동 즉시 Firestore에 order 반영)
    const moveLeaderItem = async (index: number, direction: "up" | "down") => {
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= leaders.length) return;
        const a = leaders[index];
        const b = leaders[targetIndex];
        try {
            await Promise.all([
                updateDoc(doc(db, "leaders", a.id), { order: b.order }),
                updateDoc(doc(db, "leaders", b.id), { order: a.order }),
            ]);
        } catch (err) {
            console.error("순서 변경 실패:", err);
        }
    };

    const handlePosterFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingPoster(true);
        setPosterSaved(false);
        try {
            const dataUrl = await compressImageToDataUrl(file);
            setPosterPreview(dataUrl);
            setPosterImageUrl(dataUrl);
        } catch (err) {
            console.error("포스터 이미지 처리 실패:", err);
            alert("이미지를 처리하는 데 실패했습니다.");
        } finally {
            setUploadingPoster(false);
            e.target.value = "";
        }
    };

    const handleGroupFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingGroup(true);
        setPosterSaved(false);
        try {
            const dataUrl = await compressImageToDataUrl(file);
            setGroupPreview(dataUrl);
            setGroupImageUrl(dataUrl);
        } catch (err) {
            console.error("조 편성 이미지 처리 실패:", err);
            alert("이미지를 처리하는 데 실패했습니다.");
        } finally {
            setUploadingGroup(false);
            e.target.value = "";
        }
    };

    const handleRemoveGroupImage = () => {
        setGroupImageUrl("");
        setGroupPreview("");
        setPosterSaved(false);
    };

    const handleRemovePosterImage = () => {
        setPosterImageUrl("");
        setPosterPreview("");
        setPosterSaved(false);
    };

    const handleSavePoster = async () => {
        setSavingPoster(true);
        try {
            await setDoc(doc(db, "retreat", "summercamp"), {
                posterImageUrl,
                groupImageUrl,
                retreatEnabled,
                retreatDate,
                retreatLocation,
                retreatLocationDetail,
                retreatFeeAmount,
                retreatBankName,
                retreatAccountNumber,
                retreatAccountHolder,
                retreatContact,
                retreatItems,
                retreatCaution,
                retreatApplyUrl,
                updatedAt: new Date()
            }, { merge: true });
            setPosterSaved(true);
        } catch (err) {
            console.error("포스터 저장 실패:", err);
            alert("포스터 저장에 실패했습니다.");
        } finally {
            setSavingPoster(false);
        }
    };

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
        <div className={`admin-malgun min-h-screen bg-[#F2F4F6] ${fontStack} pb-32 tracking-tight text-[#191F28]`}>
            {/* 🔴 theme.css의 @layer base가 input/h1-h4/p/label/button/span에 'Arita Buri'를 직접 지정해서
                상위 요소의 폰트 지정을 덮어써버리는 문제를 관리자 페이지 안에서만 무력화 (레이어에 속하지 않은
                스타일은 @layer base보다 항상 우선 적용되므로 !important 없이도 이김) */}
            <style>{`
                .admin-malgun, .admin-malgun input, .admin-malgun textarea, .admin-malgun select,
                .admin-malgun button, .admin-malgun label, .admin-malgun span, .admin-malgun p,
                .admin-malgun h1, .admin-malgun h2, .admin-malgun h3, .admin-malgun h4 {
                    font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans KR', dotum, sans-serif;
                }
            `}</style>
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

            <div className="max-w-2xl mx-auto px-4 mt-4 mb-4">
                <div className="relative flex bg-[#EEEFf1] p-1 rounded-[18px] transition-all duration-500 ease-in-out">

                    {/* 활성화된 탭 배경 (더 부드러운 이동과 쫀득한 그림자) */}
                    <div
                        className={`absolute top-1 bottom-1 w-[calc(33.333%-4px)] bg-white rounded-[14px] shadow-[0_4px_12px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1)
                            ${activeTab === 'edit' ? 'left-1' : activeTab === 'leaders' ? 'left-[calc(33.333%)]' : 'left-[calc(66.666%)]'}`}
                    />

                    {/* 주보 편집 탭 */}
                    <button
                        onClick={() => setActiveTab('edit')}
                        className={`relative flex-1 h-[44px] rounded-[14px] font-bold text-[12px] transition-all duration-300 flex items-center justify-center gap-0.5 z-10
                            ${activeTab === 'edit'
                                ? 'text-[#191F28]'
                                : 'text-[#8B95A1] hover:text-[#505967]'}`}
                    >
                        <Edit3 size={14} strokeWidth={activeTab === 'edit' ? 2.5 : 2} />
                        <span>주보 편집</span>
                    </button>

                    {/* 섬기는 사람들 탭 */}
                    <button
                        onClick={() => setActiveTab('leaders')}
                        className={`relative flex-1 h-[44px] rounded-[14px] font-bold text-[12px] transition-all duration-300 flex items-center justify-center gap-0.5 z-10
                            ${activeTab === 'leaders'
                                ? 'text-[#191F28]'
                                : 'text-[#8B95A1] hover:text-[#505967]'}`}
                    >
                        <User size={14} strokeWidth={activeTab === 'leaders' ? 2.5 : 2} />
                        <span>섬기는 사람들</span>
                    </button>

                    {/* 주보 이력 탭 */}
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`relative flex-1 h-[44px] rounded-[14px] font-bold text-[12px] transition-all duration-300 flex items-center justify-center gap-0.5 z-10
                            ${activeTab === 'history'
                                ? 'text-[#191F28]'
                                : 'text-[#8B95A1] hover:text-[#505967]'}`}
                    >
                        <CalendarDays size={14} strokeWidth={activeTab === 'history' ? 2.5 : 2} />
                        <span>주보 이력</span>
                    </button>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-5">
                {activeTab === 'edit' ? (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-40">

                        {/* 1. 날짜 선택 섹션 (기존 개선안 유지하며 정제) */}
                        <section className="p-4 rounded-[20px] border-0 bg-white shadow-xl shadow-blue-500/5 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
                            {/* 헤더: 토스 스타일의 사이드 바 포인트 */}
                            <header className="flex items-center justify-between mb-3">
                                <h2 className="text-[16px] font-bold flex items-center gap-3 text-[#191F28] tracking-tight">
                                    <div className="w-1.5 h-[18px] bg-[#3182F6] rounded-full shadow-[0_0_12px_rgba(49,130,246,0.3)]"></div>
                                    발행일 설정
                                </h2>

                                {/* 상태 배지: 현재 DB에 등록된 날짜 표시 */}
                                <div className="flex items-center gap-2 bg-[#F9FAFB] px-3 py-1.5 rounded-full border border-[#F2F4F6]">
                                    <div className="w-2 h-2 rounded-full bg-[#3182F6] animate-pulse" />
                                    <span className="text-[13px] font-black text-[#4E5968]">현재: {fixedDate || "미등록"}</span>
                                </div>
                            </header>

                            <div className="grid md:grid-cols-1 gap-3 relative">
                                <div className="space-y-3 group">
                                    <label className="text-[12px] font-bold text-[#8B95A1] group-focus-within:text-[#3182F6] transition-colors ml-1">
                                        예배 날짜 (주보 발행일)
                                    </label>

                                    {/* 날짜 선택 커스텀 인풋 */}
                                    <div
                                        onClick={() => setShowCalendar(!showCalendar)}
                                        className="relative flex items-center cursor-pointer group"
                                    >
                                        <div className={`w-full h-12 bg-[#F9FAFB] border-0 rounded-[18px] px-5 flex items-center justify-between outline-none ring-1 transition-all ${showCalendar ? 'ring-2 ring-[#3182F6] bg-white' : 'ring-[#F2F4F6] hover:ring-[#D1D8E0]'}`}>
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
                                        className="absolute top-[100px] left-0 right-0 bg-white rounded-[28px] shadow-[0_24px_60px_rgba(0,0,0,0.15)] border border-[#F2F4F6] p-5 z-[100] animate-in fade-in zoom-in-95 duration-200"
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
                        <section className="p-4 rounded-[20px] border-0 bg-white shadow-xl shadow-blue-500/5 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* 헤더: 메테리얼 디자인 3 스타일의 강조 포인트 */}
                            <h2 className="text-[16px] font-bold mb-6 flex items-center gap-3 text-[#191F28] tracking-tight">
                                <div className="w-1.5 h-[18px] bg-[#3182F6] rounded-full shadow-[0_0_12px_rgba(49,130,246,0.3)]"></div>
                                예배 정보
                            </h2>

                            {/* 세로 스택: 모바일에서 한 줄씩 일정한 간격으로 읽히도록 통일 */}
                            <div className="space-y-4">

                                {/* 설교자 입력 */}
                                <div className="space-y-2 group">
                                    <label className="text-[12px] font-bold text-[#8B95A1] group-focus-within:text-[#3182F6] transition-colors ml-1 flex items-center gap-2">
                                        설교자
                                    </label>
                                    <input
                                        type="text"
                                        value={preacher}
                                        onChange={(e) => setPreacher(e.target.value)}
                                        placeholder="예: 청년부 목사님"
                                        className="w-full h-12 bg-[#F9FAFB] border-0 rounded-[18px] px-5 text-[16px] font-medium text-[#191F28] outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] focus:bg-white transition-all placeholder:text-[#D1D8E0]"
                                    />
                                </div>

                                {/* 축도자 입력 */}
                                <div className="space-y-2 group">
                                    <label className="text-[12px] font-bold text-[#8B95A1] group-focus-within:text-[#3182F6] transition-colors ml-1 flex items-center gap-2">
                                        축도자
                                    </label>
                                    <input
                                        type="text"
                                        value={benedictionBy}
                                        onChange={(e) => setBenedictionBy(e.target.value)}
                                        placeholder="예: 청년부 목사님"
                                        className="w-full h-12 bg-[#F9FAFB] border-0 rounded-[18px] px-5 text-[16px] font-medium text-[#191F28] outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] focus:bg-white transition-all placeholder:text-[#D1D8E0]"
                                    />
                                </div>

                                {/* 본문 말씀 입력 */}
                                <div className="space-y-2 group">
                                    <label className="text-[12px] font-bold text-[#8B95A1] group-focus-within:text-[#3182F6] transition-colors ml-1">
                                        본문 말씀
                                    </label>
                                    <input
                                        type="text"
                                        value={scripture}
                                        onChange={(e) => setScripture(e.target.value)}
                                        placeholder="예: 마태복음 5:13-16"
                                        className="w-full h-12 bg-[#F9FAFB] border-0 rounded-[18px] px-5 text-[16px] font-medium text-[#191F28] outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] focus:bg-white transition-all placeholder:text-[#D1D8E0]"
                                    />
                                </div>

                                {/* 소식 담당자 입력 */}
                                <div className="space-y-2 group">
                                    <label className="text-[12px] font-bold text-[#8B95A1] group-focus-within:text-[#3182F6] transition-colors ml-1">
                                        소식 담당자
                                    </label>
                                    <input
                                        type="text"
                                        value={newsInCharge}
                                        onChange={(e) => setNewsInCharge(e.target.value)}
                                        placeholder="이름을 입력하세요"
                                        className="w-full h-12 bg-[#F9FAFB] border-0 rounded-[18px] px-5 text-[16px] font-medium text-[#191F28] outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] focus:bg-white transition-all placeholder:text-[#D1D8E0]"
                                    />
                                </div>

                                {/* 설교 제목 입력 */}
                                <div className="space-y-2 group">
                                    <label className="text-[12px] font-bold text-[#8B95A1] group-focus-within:text-[#3182F6] transition-colors ml-1 flex items-center gap-2">
                                        <Edit3 size={14} strokeWidth={3} className="text-[#3182F6]" />
                                        설교 제목
                                    </label>
                                    <textarea
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="제목을 입력하세요"
                                        className="w-full min-h-[88px] bg-[#F9FAFB] border-0 rounded-[18px] p-5 text-[16px] font-medium text-[#191F28] outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] focus:bg-white transition-all placeholder:text-[#D1D8E0] resize-none leading-relaxed"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* 예배 순서 섹션 */}
                        <section className="p-4 rounded-[20px] border-0 bg-white shadow-xl shadow-blue-500/5 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-[16px] font-bold mb-3 flex items-center gap-3 text-[#191F28] tracking-tight">
                                <div className="w-1.5 h-[18px] bg-[#3182F6] rounded-full shadow-[0_0_12px_rgba(49,130,246,0.3)]"></div>
                                예배 순서
                            </h2>
                            <p className="text-[12px] font-medium text-[#ADB5BD] mb-6 ml-1 leading-snug">
                                화살표로 순서를 바꾸고, 이름과 내용을 직접 입력할 수 있어요. 설교자·소식담당자·축도자·신앙고백 내용은 위에서 입력한 값과 자동으로 연동돼요.
                            </p>
                            <div className="space-y-3">
                                {worshipOrder.map((item, idx) => (
                                    <div key={item.key} className="bg-[#F9FAFB] rounded-[18px] p-3 ring-1 ring-[#F2F4F6]">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[11px] font-semibold text-[#ADB5BD]">{idx + 1}번째</span>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => moveWorshipOrderItem(idx, "up")}
                                                    disabled={idx === 0}
                                                    className="w-7 h-7 rounded-full bg-white ring-1 ring-[#E5E8EB] flex items-center justify-center text-[#4E5968] disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-all"
                                                >
                                                    <ChevronUp size={14} strokeWidth={3} />
                                                </button>
                                                <button
                                                    onClick={() => moveWorshipOrderItem(idx, "down")}
                                                    disabled={idx === worshipOrder.length - 1}
                                                    className="w-7 h-7 rounded-full bg-white ring-1 ring-[#E5E8EB] flex items-center justify-center text-[#4E5968] disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-all"
                                                >
                                                    <ChevronDown size={14} strokeWidth={3} />
                                                </button>
                                                <button
                                                    onClick={() => removeWorshipOrderItem(idx)}
                                                    className="w-7 h-7 rounded-full flex items-center justify-center text-[#F04452] hover:bg-[#FFF0F1] transition-all"
                                                    title="이 항목 삭제"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                value={item.label}
                                                onChange={(e) => updateWorshipOrderLabel(idx, e.target.value)}
                                                placeholder="항목 이름"
                                                className="w-full h-11 bg-white border-0 rounded-[12px] px-3 text-[14px] font-medium text-[#191F28] outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]"
                                            />
                                            {item.modalSource || item.dynamicSource ? (
                                                <div className="h-11 flex items-center px-3 rounded-[12px] bg-[#EBF4FF] text-[12px] font-semibold text-[#1A66DB]">
                                                    🔗{" "}
                                                    {item.modalSource === "creed" && "신앙고백 내용과 연동"}
                                                    {item.modalSource === "confession" && "예배자의 고백과 연동"}
                                                    {item.dynamicSource === "preacher" && "설교자와 연동"}
                                                    {item.dynamicSource === "newsInCharge" && "소식담당자와 연동"}
                                                    {item.dynamicSource === "benedictionBy" && "축도자와 연동"}
                                                </div>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={item.value}
                                                    onChange={(e) => updateWorshipOrderValue(idx, e.target.value)}
                                                    placeholder="내용"
                                                    className="w-full h-11 bg-white border-0 rounded-[12px] px-3 text-[14px] font-medium text-[#191F28] outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6]"
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 새 항목 추가 */}
                            <div className="mt-4 space-y-2">
                                <input
                                    type="text"
                                    value={newWorshipLabel}
                                    onChange={(e) => setNewWorshipLabel(e.target.value)}
                                    placeholder="새 항목 이름 (예: 헌금)"
                                    className="w-full h-12 bg-[#F9FAFB] border-0 rounded-[14px] px-4 text-[14px] font-medium text-[#191F28] outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] focus:bg-white transition-all placeholder:text-[#D1D8E0]"
                                />
                                <input
                                    type="text"
                                    value={newWorshipValue}
                                    onChange={(e) => setNewWorshipValue(e.target.value)}
                                    placeholder="내용 (예: 다같이)"
                                    className="w-full h-12 bg-[#F9FAFB] border-0 rounded-[14px] px-4 text-[14px] font-medium text-[#191F28] outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] focus:bg-white transition-all placeholder:text-[#D1D8E0]"
                                />
                                <button
                                    onClick={addWorshipOrderItem}
                                    className="w-full h-12 bg-[#3182F6] text-white rounded-[14px] font-bold text-[14px] flex items-center justify-center gap-1 active:scale-[0.98] hover:bg-[#1B64DA] transition-all"
                                >
                                    <Plus size={18} strokeWidth={3} />
                                    추가
                                </button>
                            </div>
                            <p className="text-[11.5px] font-medium text-[#ADB5BD] leading-snug px-1 mt-3">
                                새로 추가한 항목은 목록 맨 아래에 붙고, 화살표로 원하는 위치로 옮길 수 있어요.
                            </p>
                        </section>

                        <section className="p-4 rounded-[20px] border-0 bg-white shadow-xl shadow-blue-500/5 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-[16px] font-bold mb-3 flex items-center gap-3 text-[#191F28] tracking-tight">
                                <div className="w-1.5 h-[18px] bg-[#3182F6] rounded-full shadow-[0_0_12px_rgba(49,130,246,0.3)]"></div>
                                금주의 찬양
                            </h2>
                            <div className="space-y-3">
                                <label className="text-[12px] font-bold text-[#8B95A1] ml-1">유튜브 링크나 ID를 넣어주세요.</label>
                                <div className="relative flex items-center">
                                    {/* 아이콘을 입력창 안에 배치하거나 깔끔하게 구성 */}
                                    <div className="absolute left-5 text-[#3182F6]">
                                        <Music size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="유튜브 URL 주소를 입력하세요"
                                        value={youtubeId}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setYoutubeId(e.target.value)}
                                        className="w-full h-12 bg-[#F9FAFB] border-0 rounded-[18px] pl-14 pr-5 text-[16px] font-medium text-[#191F28] outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] focus:bg-white transition-all placeholder:text-[#D1D8E0]"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* 광고 배너 섹션 */}
                        <section className="p-4 rounded-[20px] border-0 bg-white shadow-xl shadow-blue-500/5 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <header className="flex items-center justify-between mb-3">
                                <h2 className="text-[16px] font-bold flex items-center gap-3 text-[#191F28] tracking-tight">
                                    <div className="w-1.5 h-[18px] bg-[#3182F6] rounded-full shadow-[0_0_12px_rgba(49,130,246,0.3)]"></div>
                                    광고 배너
                                    <Megaphone size={20} strokeWidth={3} className="text-[#3182F6] opacity-50" />
                                </h2>
                                <div className="flex items-center gap-3 bg-[#F9FAFB] px-3 py-1.5 rounded-full border border-[#F2F4F6] shrink-0">
                                    <span className={`text-[13px] font-black whitespace-nowrap transition-colors ${adBannerEnabled ? 'text-[#3182F6]' : 'text-[#8B95A1]'}`}>
                                        {adBannerEnabled ? '사용중' : '사용안함'}
                                    </span>
                                    <button
                                        onClick={() => setAdBannerEnabled(!adBannerEnabled)}
                                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ${adBannerEnabled ? 'bg-[#3182F6]' : 'bg-[#E5E8EB]'}`}
                                    >
                                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-all duration-300 ${adBannerEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </header>

                            <div className={`space-y-3 transition-all duration-500 ${adBannerEnabled ? 'opacity-100' : 'opacity-30 grayscale pointer-events-none'}`}>
                                <div className="space-y-3 group">
                                    <label className="text-[12px] font-bold text-[#8B95A1] group-focus-within:text-[#3182F6] transition-colors ml-1">
                                        배너 제목
                                    </label>
                                    <input
                                        type="text"
                                        value={adBannerTitle}
                                        onChange={(e) => setAdBannerTitle(e.target.value)}
                                        placeholder="예: 2026 여름 수련회 신청 안내"
                                        className="w-full h-12 bg-[#F9FAFB] border-0 rounded-[18px] px-5 text-[16px] font-medium text-[#191F28] outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] focus:bg-white transition-all placeholder:text-[#D1D8E0]"
                                    />
                                </div>

                                <div className="space-y-3 group">
                                    <label className="text-[12px] font-bold text-[#8B95A1] group-focus-within:text-[#3182F6] transition-colors ml-1">
                                        배너 설명 (선택)
                                    </label>
                                    <input
                                        type="text"
                                        value={adBannerDescription}
                                        onChange={(e) => setAdBannerDescription(e.target.value)}
                                        placeholder="예: 지금 바로 신청하세요"
                                        className="w-full h-12 bg-[#F9FAFB] border-0 rounded-[18px] px-5 text-[16px] font-medium text-[#191F28] outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] focus:bg-white transition-all placeholder:text-[#D1D8E0]"
                                    />
                                </div>

                                <div className="space-y-3 group">
                                    <label className="text-[12px] font-bold text-[#8B95A1] group-focus-within:text-[#3182F6] transition-colors ml-1 flex items-center gap-2">
                                        <Link2 size={14} strokeWidth={3} className="text-[#3182F6]" />
                                        이동할 링크 목록
                                    </label>
                                    <p className="text-[12px] font-medium text-[#ADB5BD] ml-1 -mt-1 mb-1">
                                        링크가 1개면 배너 클릭 시 바로 이동하고, 2개 이상이면 목록에서 선택하는 화면이 뜹니다.
                                    </p>

                                    {adBannerLinks.length > 0 && (
                                        <div className="space-y-3">
                                            {adBannerLinks.map((link, idx) => (
                                                <div key={idx} className="flex items-center gap-2 bg-[#F9FAFB] p-3 rounded-[16px] ring-1 ring-[#F2F4F6]">
                                                    <div className="flex-1 space-y-2">
                                                        <input
                                                            type="text"
                                                            value={link.label}
                                                            onChange={(e) => {
                                                                const updated = [...adBannerLinks];
                                                                updated[idx] = { ...updated[idx], label: e.target.value };
                                                                setAdBannerLinks(updated);
                                                            }}
                                                            placeholder="라벨 (예: 1일차 집회)"
                                                            className="w-full h-10 bg-white border-0 ring-1 ring-[#E5E8EB] px-3 rounded-[10px] outline-none focus:ring-2 focus:ring-[#3182F6] font-medium text-[13px] text-[#191F28] placeholder:text-[#D1D8E0]"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={link.url}
                                                            onChange={(e) => {
                                                                const updated = [...adBannerLinks];
                                                                updated[idx] = { ...updated[idx], url: e.target.value };
                                                                setAdBannerLinks(updated);
                                                            }}
                                                            placeholder="https://..."
                                                            className="w-full h-10 bg-white border-0 ring-1 ring-[#E5E8EB] px-3 rounded-[10px] outline-none focus:ring-2 focus:ring-[#3182F6] font-medium text-[13px] text-[#4E5968] placeholder:text-[#D1D8E0]"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => setAdBannerLinks(adBannerLinks.filter((_, i) => i !== idx))}
                                                        className="w-10 h-10 flex items-center justify-center text-[#F04452] hover:bg-[#FFF0F1] rounded-full transition-all shrink-0"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex items-end gap-2 pt-1">
                                        <div className="flex-1 space-y-2">
                                            <input
                                                type="text"
                                                value={newBannerLinkLabel}
                                                onChange={(e) => setNewBannerLinkLabel(e.target.value)}
                                                placeholder="라벨 (선택, 예: 2일차 집회)"
                                                className="w-full h-12 bg-[#F9FAFB] border-0 rounded-[14px] px-4 text-[14px] font-medium text-[#191F28] outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] focus:bg-white transition-all placeholder:text-[#D1D8E0]"
                                            />
                                            <input
                                                type="text"
                                                value={newBannerLinkUrl}
                                                onChange={(e) => setNewBannerLinkUrl(e.target.value)}
                                                placeholder="https://..."
                                                className="w-full h-12 bg-[#F9FAFB] border-0 rounded-[14px] px-4 text-[14px] font-medium text-[#191F28] outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] focus:bg-white transition-all placeholder:text-[#D1D8E0]"
                                            />
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (!newBannerLinkUrl.trim()) return;
                                                setAdBannerLinks([...adBannerLinks, { label: newBannerLinkLabel.trim(), url: newBannerLinkUrl.trim() }]);
                                                setNewBannerLinkLabel("");
                                                setNewBannerLinkUrl("");
                                            }}
                                            className="h-12 px-4 bg-[#3182F6] text-white rounded-[14px] font-black text-[14px] flex items-center justify-center gap-1 active:scale-[0.98] hover:bg-[#1B64DA] transition-all shrink-0"
                                        >
                                            <Plus size={18} strokeWidth={3} />
                                            추가
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2 px-2">
                                    <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-[#3182F6] text-[10px] font-black">TIP</span>
                                    </div>
                                    <p className="text-[12px] font-medium text-[#ADB5BD] leading-snug">
                                        사용 토글을 켜고 배너 제목을 입력하면 메인 화면 헤더 바로 아래에 배너가 노출되며, 클릭 시 새 탭에서 링크로 이동합니다.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 수련회 안내 섹션 */}
                        <section className="p-4 rounded-[20px] border-0 bg-white shadow-xl shadow-blue-500/5 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <header className="mb-3">
                                <div className="flex items-center justify-between gap-2">
                                    <h2 className="text-[16px] font-bold text-[#191F28] tracking-tight flex items-center gap-2 min-w-0">
                                        <div className="w-1.5 h-[18px] bg-[#3182F6] rounded-full shadow-[0_0_12px_rgba(49,130,246,0.3)] shrink-0"></div>
                                        <span className="truncate">수련회 안내</span>
                                        <Image size={18} strokeWidth={3} className="text-[#3182F6] opacity-50 shrink-0" />
                                    </h2>
                                    <div className="flex items-center gap-3 bg-[#F9FAFB] px-3 py-1.5 rounded-full border border-[#F2F4F6] shrink-0">
                                        <span className={`text-[13px] font-black whitespace-nowrap transition-colors ${retreatEnabled ? 'text-[#3182F6]' : 'text-[#8B95A1]'}`}>
                                            {retreatEnabled ? '사용중' : '사용안함'}
                                        </span>
                                        <button
                                            onClick={() => { setRetreatEnabled(!retreatEnabled); setPosterSaved(false); }}
                                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 shrink-0 ${retreatEnabled ? 'bg-[#3182F6]' : 'bg-[#E5E8EB]'}`}
                                        >
                                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-all duration-300 ${retreatEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-[11px] font-medium text-[#ADB5BD] ml-[22px] mt-1">최상단 띠 형태 배너</p>
                            </header>

                            <div className="flex items-start gap-2 px-2 mb-3">
                                <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-[#3182F6] text-[10px] font-black">TIP</span>
                                </div>
                                <p className="text-[12px] font-medium text-[#ADB5BD] leading-snug">
                                    사용중일 때만 메인 화면 상단에 수련회 공지 배너가 노출되고 /SummerCamp 페이지도 열람 가능해요. 사용안함으로 바꾸면 배너가 사라지고, 주소를 직접 입력해 들어와도 "준비중" 안내만 표시돼요.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="space-y-3">
                                    <label className="text-[12px] font-bold text-[#8B95A1] ml-1">📅 일시</label>
                                    <input
                                        type="text"
                                        value={retreatDate}
                                        onChange={(e) => setRetreatDate(e.target.value)}
                                        placeholder="예: 2026. 8. 16 (주일) — 8. 18 (화)"
                                        className="w-full h-12 bg-[#F9FAFB] border-0 rounded-[18px] px-5 text-[16px] font-medium text-[#191F28] outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] focus:bg-white transition-all placeholder:text-[#D1D8E0]"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[12px] font-bold text-[#8B95A1] ml-1">📍 장소</label>
                                    <input
                                        type="text"
                                        value={retreatLocation}
                                        onChange={(e) => setRetreatLocation(e.target.value)}
                                        placeholder="장소명 (예: 삼은교회)"
                                        className="w-full h-12 bg-[#F9FAFB] border-0 rounded-[18px] px-5 text-[16px] font-medium text-[#191F28] outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] focus:bg-white transition-all placeholder:text-[#D1D8E0] mb-3"
                                    />
                                    <input
                                        type="text"
                                        value={retreatLocationDetail}
                                        onChange={(e) => setRetreatLocationDetail(e.target.value)}
                                        placeholder="상세 주소"
                                        className="w-full h-12 bg-[#F9FAFB] border-0 rounded-[16px] px-5 text-[14px] font-medium text-[#4E5968] outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] focus:bg-white transition-all placeholder:text-[#D1D8E0]"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[12px] font-bold text-[#8B95A1] ml-1">💳 회비</label>
                                    <input
                                        type="text"
                                        value={retreatFeeAmount}
                                        onChange={(e) => setRetreatFeeAmount(e.target.value)}
                                        placeholder="금액 (예: 55,000원)"
                                        className="w-full h-12 bg-[#F9FAFB] border-0 rounded-[18px] px-5 text-[16px] font-medium text-[#191F28] outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] focus:bg-white transition-all placeholder:text-[#D1D8E0]"
                                    />
                                    <div className="grid grid-cols-3 gap-2">
                                        <input
                                            type="text"
                                            value={retreatBankName}
                                            onChange={(e) => setRetreatBankName(e.target.value)}
                                            placeholder="은행명"
                                            className="h-12 bg-[#F9FAFB] border-0 rounded-[14px] px-3 text-[13px] font-medium text-[#191F28] outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] focus:bg-white transition-all placeholder:text-[#D1D8E0]"
                                        />
                                        <input
                                            type="text"
                                            value={retreatAccountNumber}
                                            onChange={(e) => setRetreatAccountNumber(e.target.value)}
                                            placeholder="계좌번호"
                                            className="h-12 bg-[#F9FAFB] border-0 rounded-[14px] px-3 text-[13px] font-medium text-[#191F28] outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] focus:bg-white transition-all placeholder:text-[#D1D8E0]"
                                        />
                                        <input
                                            type="text"
                                            value={retreatAccountHolder}
                                            onChange={(e) => setRetreatAccountHolder(e.target.value)}
                                            placeholder="예금주"
                                            className="h-12 bg-[#F9FAFB] border-0 rounded-[14px] px-3 text-[13px] font-medium text-[#191F28] outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] focus:bg-white transition-all placeholder:text-[#D1D8E0]"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[12px] font-bold text-[#8B95A1] ml-1">📞 문의</label>
                                    <input
                                        type="text"
                                        value={retreatContact}
                                        onChange={(e) => setRetreatContact(e.target.value)}
                                        placeholder="예: 회장 010-3180-6322"
                                        className="w-full h-12 bg-[#F9FAFB] border-0 rounded-[18px] px-5 text-[16px] font-medium text-[#191F28] outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] focus:bg-white transition-all placeholder:text-[#D1D8E0]"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[12px] font-bold text-[#8B95A1] ml-1">🎒 준비물</label>
                                    <textarea
                                        value={retreatItems}
                                        onChange={(e) => setRetreatItems(e.target.value)}
                                        placeholder="쉼표(,)로 구분해서 입력하세요"
                                        rows={2}
                                        className="w-full bg-[#F9FAFB] border-0 rounded-[18px] px-5 py-4 text-[15px] font-medium text-[#191F28] outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] focus:bg-white transition-all placeholder:text-[#D1D8E0] resize-none"
                                    />
                                    <p className="text-[11.5px] font-medium text-[#ADB5BD] leading-snug px-1">
                                        쉼표로 구분해서 입력해요. 맨 앞에 쓴 항목이 강조 배지로 표시돼요.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[12px] font-bold text-[#8B95A1] ml-1">⚠️ 주의사항</label>
                                    <input
                                        type="text"
                                        value={retreatCaution}
                                        onChange={(e) => setRetreatCaution(e.target.value)}
                                        placeholder="예: 캐리어 반입 금지"
                                        className="w-full h-12 bg-[#F9FAFB] border-0 rounded-[18px] px-5 text-[16px] font-medium text-[#191F28] outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] focus:bg-white transition-all placeholder:text-[#D1D8E0]"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[12px] font-bold text-[#8B95A1] ml-1">📝 신청서 링크</label>
                                    <input
                                        type="text"
                                        value={retreatApplyUrl}
                                        onChange={(e) => setRetreatApplyUrl(e.target.value)}
                                        placeholder="https://docs.google.com/forms/..."
                                        className="w-full h-12 bg-[#F9FAFB] border-0 rounded-[18px] px-5 text-[16px] font-medium text-[#191F28] outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] focus:bg-white transition-all placeholder:text-[#D1D8E0]"
                                    />
                                    <p className="text-[11.5px] font-medium text-[#ADB5BD] leading-snug px-1">
                                        "수련회 신청서 작성하기" 버튼을 누르면 이 링크로 이동해요.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[12px] font-bold text-[#8B95A1] ml-1">🧑‍🤝‍🧑 조 편성</label>
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-24 h-32 rounded-[16px] bg-[#F9FAFB] ring-1 ring-[#F2F4F6] overflow-hidden flex items-center justify-center shrink-0">
                                            {groupPreview ? (
                                                <>
                                                    <img src={groupPreview} alt="조 편성 미리보기" className="w-full h-full object-cover" />
                                                    <button
                                                        onClick={handleRemoveGroupImage}
                                                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
                                                        title="이미지 삭제"
                                                    >
                                                        <Trash2 size={12} className="text-white" />
                                                    </button>
                                                </>
                                            ) : (
                                                <Image size={24} className="text-[#D1D8E0]" />
                                            )}
                                        </div>

                                        <label className={`flex-1 h-12 rounded-[18px] ring-1 ring-[#F2F4F6] bg-[#F9FAFB] flex items-center justify-center gap-2 font-black text-[15px] transition-all text-center px-3 ${uploadingGroup ? 'text-[#8B95A1] cursor-not-allowed' : 'text-[#3182F6] cursor-pointer hover:bg-white hover:ring-2 hover:ring-[#3182F6]'}`}>
                                            {uploadingGroup ? "이미지 처리 중..." : (groupPreview ? "이미지 다시 선택" : "조 편성 이미지 선택하기")}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                disabled={uploadingGroup}
                                                onChange={handleGroupFileChange}
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[12px] font-bold text-[#8B95A1] ml-1">🖼️ 포스터</label>
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-24 h-32 rounded-[16px] bg-[#F9FAFB] ring-1 ring-[#F2F4F6] overflow-hidden flex items-center justify-center shrink-0">
                                            {posterPreview ? (
                                                <>
                                                    <img src={posterPreview} alt="포스터 미리보기" className="w-full h-full object-cover" />
                                                    <button
                                                        onClick={handleRemovePosterImage}
                                                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
                                                        title="이미지 삭제"
                                                    >
                                                        <Trash2 size={12} className="text-white" />
                                                    </button>
                                                </>
                                            ) : (
                                                <Image size={24} className="text-[#D1D8E0]" />
                                            )}
                                        </div>

                                        <label className={`flex-1 h-12 rounded-[18px] ring-1 ring-[#F2F4F6] bg-[#F9FAFB] flex items-center justify-center gap-2 font-black text-[15px] transition-all text-center px-3 ${uploadingPoster ? 'text-[#8B95A1] cursor-not-allowed' : 'text-[#3182F6] cursor-pointer hover:bg-white hover:ring-2 hover:ring-[#3182F6]'}`}>
                                            {uploadingPoster ? "이미지 처리 중..." : (posterPreview ? "이미지 다시 선택" : "포스터 이미지 선택하기")}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                disabled={uploadingPoster}
                                                onChange={handlePosterFileChange}
                                            />
                                        </label>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSavePoster}
                                    disabled={savingPoster || uploadingPoster || uploadingGroup}
                                    className="w-full h-12 rounded-[18px] bg-[#3182F6] text-white font-black text-[15px] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
                                >
                                    {savingPoster ? "저장 중..." : posterSaved ? "저장됨 ✓" : "수련회 안내 저장하기"}
                                </button>

                                <p className="text-[12px] font-medium text-[#ADB5BD] leading-snug px-1">
                                    이미지를 선택하면 자동으로 용량을 줄여 저장해요. 위 사용중/사용안함 상태와 포스터가 이 버튼 하나로 함께 저장돼요.
                                </p>
                            </div>
                        </section>

                        {/* 3. 신앙고백 및 예배자의 고백 (Grouped Card) */}
                        <div className="grid grid-cols-1 gap-4">
                            <section className="p-4 rounded-[20px] border-0 bg-white shadow-xl shadow-blue-500/5 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* 헤더: 메테리얼 디자인 3 스타일의 시그니처 바 */}
                                <header className="flex items-center gap-3 mb-3">
                                    <div className="w-1.5 h-[18px] bg-[#3182F6] rounded-full shadow-[0_0_12px_rgba(49,130,246,0.2)]"></div>
                                    <h2 className="text-[16px] font-bold text-[#191F28] tracking-tight flex items-center gap-2">
                                        신앙 고백 문구
                                        <Quote size={20} strokeWidth={3} className="text-[#3182F6] opacity-50" />
                                    </h2>
                                </header>

                                <div className="grid md:grid-cols-2 gap-4">
                                    {/* 사도신경 입력 영역 */}
                                    <div className="space-y-3 group">
                                        <div className="flex items-center justify-between ml-1">
                                            <label className="text-[12px] font-bold text-[#8B95A1] group-focus-within:text-[#3182F6] transition-colors">
                                                사도신경
                                            </label>
                                            <span className="text-[11px] font-bold text-[#D1D8E0] bg-[#F9FAFB] px-2 py-1 rounded-md">필수 입력</span>
                                        </div>
                                        <textarea
                                            value={apostlesCreed}
                                            onChange={(e) => setApostlesCreed(e.target.value)}
                                            placeholder="사도신경 내용을 입력하세요"
                                            className="w-full h-48 bg-[#F9FAFB] border-0 rounded-[24px] p-6 text-[15px] font-medium text-[#4E5968] leading-relaxed outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] focus:bg-white transition-all placeholder:text-[#D1D8E0] resize-none"
                                        />
                                    </div>

                                    {/* 시편 입력 영역 */}
                                    <div className="space-y-3 group">
                                        <div className="flex items-center justify-between ml-1">
                                            <label className="text-[12px] font-bold text-[#8B95A1] group-focus-within:text-[#3182F6] transition-colors">
                                                교독문 (시편)
                                            </label>
                                            <span className="text-[11px] font-bold text-[#D1D8E0] bg-[#F9FAFB] px-2 py-1 rounded-md">선택 사항</span>
                                        </div>
                                        <textarea
                                            value={psalms}
                                            onChange={(e) => setPsalms(e.target.value)}
                                            placeholder="시편 내용을 입력하세요"
                                            className="w-full h-48 bg-[#F9FAFB] border-0 rounded-[24px] p-6 text-[15px] font-medium text-[#4E5968] leading-relaxed outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] focus:bg-white transition-all placeholder:text-[#D1D8E0] resize-none"
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

                            <section className="p-4 rounded-[20px] border-0 bg-white shadow-xl shadow-blue-500/5 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* 헤더: 메테리얼 디자인의 강조 바와 토스 스타일의 타이포그래피 */}
                                <header className="flex items-center gap-3 mb-2">
                                    <div className="w-1.5 h-[18px] bg-[#3182F6] rounded-full shadow-[0_0_12px_rgba(49,130,246,0.3)]"></div>
                                    <h2 className="text-[16px] font-bold text-[#191F28] tracking-tight flex items-center gap-2">
                                        예배자의 고백
                                        <MessageSquare size={20} strokeWidth={3} className="text-[#3182F6] opacity-50" />
                                    </h2>
                                </header>

                                {/* 가이드 문구: 목적을 명확히 설명하여 직관성 부여 */}
                                <p className="text-[14px] font-bold text-[#8B95A1] mb-3 ml-1 flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-[#D1D8E0]"></span>
                                    앱 접속 시 성도들에게 보여줄 첫 고백 문구를 작성해주세요.
                                </p>

                                <div className="space-y-3 group">
                                    <div className="flex items-center justify-between ml-1">
                                        <label className="text-[12px] font-bold text-[#8B95A1] group-focus-within:text-[#3182F6] transition-colors">
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
                                            className="w-full h-44 bg-[#F9FAFB] border-0 rounded-[28px] p-7 text-[16px] font-medium text-[#4E5968] leading-relaxed outline-none ring-1 ring-[#F2F4F6] focus:ring-2 focus:ring-[#3182F6] focus:bg-white transition-all placeholder:text-[#D1D8E0] resize-none"
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
                        <section className="p-4 rounded-[20px] border-0 bg-white shadow-xl shadow-blue-500/5 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* 헤더 부분 */}
                            <header className="flex items-center justify-between mb-3">
                                <h2 className="text-[16px] font-bold flex items-center gap-3 text-[#191F28] tracking-tight">
                                    <div className="w-1.5 h-[18px] bg-[#3182F6] rounded-full shadow-[0_0_12px_rgba(49,130,246,0.3)]"></div>
                                    공동체 소식
                                </h2>
                                <div className="flex items-center gap-1.5 bg-[#F9FAFB] px-3 py-1.5 rounded-full border border-[#F2F4F6]">
                                    <span className="text-[12px] font-black text-[#8B95A1]">현재 소식 {churchNews.length}개</span>
                                </div>
                            </header>

                            {/* 소식 추가 영역 (상단 고정) */}
                            <div className="bg-[#F9FAFB] p-4 rounded-[18px] border border-[#F2F4F6] mb-4 transition-all focus-within:ring-2 focus-within:ring-[#3182F6]/10 focus-within:bg-white">
                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-black text-[#8B95A1] ml-1">새 소식 제목</label>
                                        <input
                                            className="w-full h-12 bg-white border-0 ring-1 ring-[#E5E8EB] px-4 rounded-[14px] outline-none focus:ring-2 focus:ring-[#3182F6] font-medium text-[16px] text-[#191F28] transition-all placeholder:text-[#D1D8E0]"
                                            placeholder="예: 새가족 환영회 안내"
                                            value={newNewsTitle}
                                            onChange={(e) => setNewNewsTitle(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-black text-[#8B95A1] ml-1">상세 내용</label>
                                        <textarea
                                            className="w-full bg-white border-0 ring-1 ring-[#E5E8EB] p-4 rounded-[14px] outline-none focus:ring-2 focus:ring-[#3182F6] font-medium text-[15px] text-[#4E5968] leading-relaxed transition-all placeholder:text-[#D1D8E0] resize-none"
                                            placeholder="성도들에게 전달할 상세한 내용을 입력하세요"
                                            value={newNewsContent}
                                            onChange={(e) => setNewNewsContent(e.target.value)}
                                            rows={3}
                                        />
                                    </div>
                                    <button
                                        onClick={() => { if (newNewsTitle && newNewsContent) { setChurchNews([...churchNews, { title: newNewsTitle, content: newNewsContent }]); setNewNewsTitle(""); setNewNewsContent(""); } }}
                                        className="w-full h-12 bg-[#3182F6] text-white rounded-[14px] font-black text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] hover:bg-[#1B64DA] transition-all shadow-lg shadow-blue-100 mt-2"
                                    >
                                        <Plus size={20} strokeWidth={3} />
                                        소식 추가하기
                                    </button>
                                </div>
                            </div>

                            {/* 리스트 영역 */}
                            <div className="space-y-3">
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
                                                className={`bg-white border p-4 rounded-[18px] transition-all duration-300 ${isEditing ? 'border-[#3182F6] ring-4 ring-[#3182F6]/5 shadow-xl' : 'border-[#F2F4F6] hover:shadow-lg hover:shadow-blue-500/5'}`}
                                            >
                                                {isEditing ? (
                                                    /* --- [수정 모드 UI] --- */
                                                    <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[13px] font-black text-[#3182F6] bg-blue-50 px-2 py-1 rounded">소식 수정 중</span>
                                                            <button onClick={() => setEditingIdx(null)} className="text-[12px] font-bold text-[#8B95A1] hover:text-[#F04452]">취소하기</button>
                                                        </div>
                                                        <input
                                                            className="w-full h-12 bg-[#F9FAFB] border-0 ring-1 ring-[#3182F6]/30 p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#3182F6] font-medium text-[15px] text-[#191F28]"
                                                            value={item.title}
                                                            onChange={(e) => {
                                                                const updated = [...churchNews];
                                                                updated[idx].title = e.target.value;
                                                                setChurchNews(updated);
                                                            }}
                                                        />
                                                        <textarea
                                                            className="w-full bg-[#F9FAFB] border-0 ring-1 ring-[#3182F6]/30 p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#3182F6] font-medium text-[14px] text-[#4E5968] leading-relaxed resize-none"
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
                                                    <div>
                                                        {/* 상단 컨트롤 줄: 왼쪽 Notice 뱃지 / 오른쪽 위·아래 이동 + 수정·삭제 */}
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-[11px] font-black text-[#3182F6] bg-blue-50 px-2 py-0.5 rounded-md shrink-0">Notice</span>
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => moveNewsItem(idx, "up")}
                                                                    disabled={idx === 0}
                                                                    className="w-7 h-7 rounded-full bg-[#F9FAFB] ring-1 ring-[#E5E8EB] flex items-center justify-center text-[#4E5968] disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-all"
                                                                >
                                                                    <ChevronUp size={14} strokeWidth={3} />
                                                                </button>
                                                                <button
                                                                    onClick={() => moveNewsItem(idx, "down")}
                                                                    disabled={idx === churchNews.length - 1}
                                                                    className="w-7 h-7 rounded-full bg-[#F9FAFB] ring-1 ring-[#E5E8EB] flex items-center justify-center text-[#4E5968] disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-all"
                                                                >
                                                                    <ChevronDown size={14} strokeWidth={3} />
                                                                </button>
                                                                <div className="w-px h-4 bg-[#F2F4F6] mx-1" />
                                                                <button onClick={() => setEditingIdx(idx)} className="w-7 h-7 flex items-center justify-center text-[#8B95A1] hover:bg-[#F2F4F6] rounded-full transition-all">
                                                                    <Edit3 size={14} />
                                                                </button>
                                                                <button onClick={() => setChurchNews(churchNews.filter((_, i) => i !== idx))} className="w-7 h-7 flex items-center justify-center text-[#F04452] hover:bg-[#FFF0F1] rounded-full transition-all">
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* 제목/내용: 옆에 아이콘 없이 전체 너비로 표시 */}
                                                        <div onClick={() => setEditingIdx(idx)} className="cursor-pointer">
                                                            <p className="font-bold text-[#191F28] text-[15px] mb-1">{item.title}</p>
                                                            <p className="text-[#8B95A1] text-[13px] font-medium leading-relaxed line-clamp-2">{item.content}</p>
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
                        <section className="p-4 rounded-[20px] border-0 bg-white shadow-xl shadow-blue-500/5 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* 헤더 부분 */}
                            <header className="flex items-center justify-between mb-3">
                                <h2 className="text-[16px] font-bold flex items-center gap-3 text-[#191F28] tracking-tight">
                                    <div className="w-1.5 h-[18px] bg-[#3182F6] rounded-full shadow-[0_0_12px_rgba(49,130,246,0.3)]"></div>
                                    말씀 적용 질문
                                </h2>
                                <div className="flex items-center gap-3 bg-[#F9FAFB] px-3 py-1.5 rounded-full border border-[#F2F4F6]">
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
                                <div className="bg-[#F9FAFB] p-4 rounded-[18px] border border-[#F2F4F6] mb-4 transition-all focus-within:ring-2 focus-within:ring-[#3182F6]/10 focus-within:bg-white">
                                    <div className="space-y-3">
                                        <div className="space-y-2">
                                            <label className="text-[13px] font-black text-[#8B95A1] ml-1">질문 제목</label>
                                            <input
                                                className="w-full h-12 bg-white border-0 ring-1 ring-[#E5E8EB] px-4 rounded-[14px] outline-none focus:ring-2 focus:ring-[#3182F6] font-medium text-[16px] text-[#191F28] transition-all placeholder:text-[#D1D8E0]"
                                                placeholder="예: 1. 믿음과 삶에 대하여"
                                                value={newQTitle}
                                                onChange={(e) => setNewQTitle(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <div className="space-y-2">
                                                <label className="text-[13px] font-black text-[#8B95A1] ml-1">핵심 인용구 (선택사항)</label>
                                                <div className="relative">
                                                    <Quote size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3182F6] opacity-50" />
                                                    <input
                                                        className="w-full h-12 bg-white border-0 ring-1 ring-[#E5E8EB] px-4 pl-11 rounded-[14px] outline-none focus:ring-2 focus:ring-[#3182F6] font-medium text-[15px] text-[#4E5968] transition-all placeholder:text-[#D1D8E0]"
                                                        placeholder="질문의 중심이 되는 말씀을 적어주세요"
                                                        value={newQQuote}
                                                        onChange={(e) => setNewQQuote(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[13px] font-black text-[#8B95A1] ml-1">상세 질문 내용</label>
                                                <textarea
                                                    className="w-full bg-white border-0 ring-1 ring-[#E5E8EB] p-4 rounded-[14px] outline-none focus:ring-2 focus:ring-[#3182F6] font-medium text-[15px] text-[#4E5968] leading-relaxed transition-all placeholder:text-[#D1D8E0] resize-none"
                                                    placeholder="성도들이 깊이 묵상할 수 있는 질문을 입력하세요"
                                                    value={newQContent}
                                                    onChange={(e) => setNewQContent(e.target.value)}
                                                    rows={3}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => { if (newQTitle && newQContent) { setApplyQuestions([...applyQuestions, { title: newQTitle, quote: newQQuote, content: newQContent }]); setNewQTitle(""); setNewQQuote(""); setNewQContent(""); } }}
                                            className="w-full h-12 bg-[#3182F6] text-white rounded-[14px] font-black text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] hover:bg-[#1B64DA] transition-all shadow-lg shadow-blue-100 mt-2"
                                        >
                                            <Plus size={20} strokeWidth={3} />
                                            질문 리스트 추가
                                        </button>
                                    </div>
                                </div>

                                {/* 리스트 및 수정 영역 */}
                                <div className="space-y-3">
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
                                                    className={`bg-white border p-4 rounded-[18px] transition-all duration-300 ${isEditing ? 'border-[#3182F6] ring-4 ring-[#3182F6]/5 shadow-xl' : 'border-[#F2F4F6] hover:shadow-lg hover:shadow-blue-500/5'}`}
                                                >
                                                    {isEditing ? (
                                                        /* --- [질문 수정 모드] --- */
                                                        <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[13px] font-black text-[#3182F6] bg-blue-50 px-2 py-1 rounded">질문 수정 중</span>
                                                                <button onClick={() => setEditingApplyIdx(null)} className="text-[12px] font-bold text-[#8B95A1] hover:text-[#F04452]">취소</button>
                                                            </div>
                                                            <input
                                                                className="w-full h-12 bg-[#F9FAFB] border-0 ring-1 ring-[#3182F6]/30 p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#3182F6] font-medium text-[15px] text-[#191F28]"
                                                                value={item.title}
                                                                onChange={(e) => {
                                                                    const updated = [...applyQuestions];
                                                                    updated[idx].title = e.target.value;
                                                                    setApplyQuestions(updated);
                                                                }}
                                                            />
                                                            <input
                                                                className="w-full h-12 bg-[#F9FAFB] border-0 ring-1 ring-[#3182F6]/30 p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#3182F6] font-medium text-[14px] text-[#3182F6]"
                                                                placeholder="핵심 인용구 수정"
                                                                value={item.quote}
                                                                onChange={(e) => {
                                                                    const updated = [...applyQuestions];
                                                                    updated[idx].quote = e.target.value;
                                                                    setApplyQuestions(updated);
                                                                }}
                                                            />
                                                            <textarea
                                                                className="w-full bg-[#F9FAFB] border-0 ring-1 ring-[#3182F6]/30 p-4 rounded-xl outline-none focus:ring-2 focus:ring-[#3182F6] font-medium text-[14px] text-[#4E5968] leading-relaxed resize-none"
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
                                                        <div>
                                                            {/* 상단 컨트롤 줄: 왼쪽 Question 번호 / 오른쪽 위·아래 이동 + 수정·삭제 */}
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-[11px] font-black text-[#3182F6] bg-blue-50 px-2 py-0.5 rounded-md shrink-0">Question {idx + 1}</span>
                                                                <div className="flex items-center gap-1">
                                                                    <button
                                                                        onClick={() => moveQuestionItem(idx, "up")}
                                                                        disabled={idx === 0}
                                                                        className="w-7 h-7 rounded-full bg-[#F9FAFB] ring-1 ring-[#E5E8EB] flex items-center justify-center text-[#4E5968] disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-all"
                                                                    >
                                                                        <ChevronUp size={14} strokeWidth={3} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => moveQuestionItem(idx, "down")}
                                                                        disabled={idx === applyQuestions.length - 1}
                                                                        className="w-7 h-7 rounded-full bg-[#F9FAFB] ring-1 ring-[#E5E8EB] flex items-center justify-center text-[#4E5968] disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-all"
                                                                    >
                                                                        <ChevronDown size={14} strokeWidth={3} />
                                                                    </button>
                                                                    <div className="w-px h-4 bg-[#F2F4F6] mx-1" />
                                                                    <button onClick={() => setEditingApplyIdx(idx)} className="w-7 h-7 flex items-center justify-center text-[#8B95A1] hover:bg-[#F2F4F6] rounded-full transition-all">
                                                                        <Edit3 size={14} />
                                                                    </button>
                                                                    <button onClick={() => setApplyQuestions(applyQuestions.filter((_, i) => i !== idx))} className="w-7 h-7 flex items-center justify-center text-[#F04452] hover:bg-[#FFF0F1] rounded-full transition-all">
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* 제목/인용구/내용: 옆에 아이콘 없이 전체 너비로 표시 */}
                                                            <div onClick={() => setEditingApplyIdx(idx)} className="cursor-pointer">
                                                                <p className="font-bold text-[#191F28] text-[15px] mb-1">{item.title}</p>
                                                                {item.quote && (
                                                                    <p className="text-[#3182F6] text-[13px] font-semibold italic mb-1">"{item.quote}"</p>
                                                                )}
                                                                <p className="text-[#8B95A1] text-[13px] font-medium leading-relaxed line-clamp-2">{item.content}</p>
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
                ) : activeTab === 'leaders' ? (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
                        <p className="text-[12px] font-bold text-[#8B95A1] px-1 mb-1">추가·수정·삭제는 버튼을 누르는 즉시 저장돼요. 따로 발행 버튼을 누를 필요 없어요.</p>
                        {/* 6. 섬기는 사람들 (사진/직책/이름/전화번호 - 생성·조회·수정·삭제, 변경 즉시 저장) */}
                        <section className="p-4 rounded-[20px] border-0 bg-white shadow-xl shadow-blue-500/5 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <header className="flex items-center justify-between mb-3">
                                <h2 className="text-[16px] font-bold flex items-center gap-3 text-[#191F28] tracking-tight">
                                    <div className="w-1.5 h-[18px] bg-[#3182F6] rounded-full shadow-[0_0_12px_rgba(49,130,246,0.3)]"></div>
                                    섬기는 사람들
                                </h2>
                                <div className="flex items-center gap-1.5 bg-[#F9FAFB] px-3 py-1.5 rounded-full border border-[#F2F4F6]">
                                    <span className="text-[12px] font-black text-[#8B95A1]">총 {leaders.length}명</span>
                                </div>
                            </header>

                            {/* 추가 영역 */}
                            <div className="bg-[#F9FAFB] p-4 rounded-[18px] border border-[#F2F4F6] mb-4 transition-all focus-within:ring-2 focus-within:ring-[#3182F6]/10 focus-within:bg-white">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-16 h-16 rounded-full bg-white ring-1 ring-[#F2F4F6] overflow-hidden flex items-center justify-center shrink-0">
                                            {newLeaderImageUrl ? (
                                                <img src={newLeaderImageUrl} alt="미리보기" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={22} className="text-[#D1D8E0]" />
                                            )}
                                        </div>
                                        <label className={`flex-1 h-11 rounded-[14px] ring-1 ring-[#F2F4F6] bg-white flex items-center justify-center gap-2 font-black text-[13px] transition-all text-center px-2 ${uploadingNewLeaderImage ? 'text-[#8B95A1] cursor-not-allowed' : 'text-[#3182F6] cursor-pointer hover:ring-2 hover:ring-[#3182F6]'}`}>
                                            {uploadingNewLeaderImage ? "이미지 처리 중..." : (newLeaderImageUrl ? "사진 다시 선택" : "사진 선택하기")}
                                            <input type="file" accept="image/*" className="hidden" disabled={uploadingNewLeaderImage} onChange={handleNewLeaderImageChange} />
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            className="w-full h-12 bg-white border-0 ring-1 ring-[#E5E8EB] px-4 rounded-[14px] outline-none focus:ring-2 focus:ring-[#3182F6] font-medium text-[15px] text-[#191F28] transition-all placeholder:text-[#D1D8E0]"
                                            placeholder="직책 (예: 회장)"
                                            value={newLeaderRole}
                                            onChange={(e) => setNewLeaderRole(e.target.value)}
                                        />
                                        <input
                                            className="w-full h-12 bg-white border-0 ring-1 ring-[#E5E8EB] px-4 rounded-[14px] outline-none focus:ring-2 focus:ring-[#3182F6] font-medium text-[15px] text-[#191F28] transition-all placeholder:text-[#D1D8E0]"
                                            placeholder="이름"
                                            value={newLeaderName}
                                            onChange={(e) => setNewLeaderName(e.target.value)}
                                        />
                                    </div>
                                    <input
                                        className="w-full h-12 bg-white border-0 ring-1 ring-[#E5E8EB] px-4 rounded-[14px] outline-none focus:ring-2 focus:ring-[#3182F6] font-medium text-[15px] text-[#191F28] transition-all placeholder:text-[#D1D8E0]"
                                        placeholder="전화번호 (예: 010-1234-5678)"
                                        value={newLeaderPhone}
                                        onChange={(e) => setNewLeaderPhone(e.target.value)}
                                    />
                                    <button
                                        onClick={addLeader}
                                        disabled={savingNewLeader || uploadingNewLeaderImage || !newLeaderRole.trim() || !newLeaderName.trim()}
                                        className="w-full h-12 bg-[#3182F6] text-white rounded-[14px] font-black text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] hover:bg-[#1B64DA] transition-all shadow-lg shadow-blue-100 mt-2 disabled:opacity-50"
                                    >
                                        <Plus size={20} strokeWidth={3} />
                                        {savingNewLeader ? "추가하는 중..." : "추가하기"}
                                    </button>
                                </div>
                            </div>

                            {/* 리스트 영역 */}
                            <div className="space-y-3">
                                {leaders.length === 0 ? (
                                    <div className="py-12 flex flex-col items-center justify-center text-[#D1D8E0] border-2 border-dashed border-[#F2F4F6] rounded-[28px]">
                                        <User size={40} strokeWidth={1.5} className="mb-2 opacity-50" />
                                        <p className="text-[14px] font-bold">등록된 사람이 없습니다</p>
                                    </div>
                                ) : (
                                    leaders.map((item, idx) => {
                                        const isEditing = editingLeaderId === item.id;

                                        return (
                                            <div
                                                key={item.id}
                                                className={`bg-white border p-4 rounded-[18px] transition-all duration-300 ${isEditing ? 'border-[#3182F6] ring-4 ring-[#3182F6]/5 shadow-xl' : 'border-[#F2F4F6] hover:shadow-lg hover:shadow-blue-500/5'}`}
                                            >
                                                {isEditing ? (
                                                    /* --- [수정 모드 UI] --- */
                                                    <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[13px] font-black text-[#3182F6] bg-blue-50 px-2 py-1 rounded">수정 중</span>
                                                            <button onClick={() => setEditingLeaderId(null)} className="text-[12px] font-bold text-[#8B95A1] hover:text-[#F04452]">취소하기</button>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="relative w-16 h-16 rounded-full bg-[#F9FAFB] ring-1 ring-[#3182F6]/30 overflow-hidden flex items-center justify-center shrink-0">
                                                                {editImageUrl ? (
                                                                    <img src={editImageUrl} alt="미리보기" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <User size={22} className="text-[#D1D8E0]" />
                                                                )}
                                                            </div>
                                                            <label className={`flex-1 h-11 rounded-[14px] ring-1 ring-[#3182F6]/30 bg-[#F9FAFB] flex items-center justify-center gap-2 font-black text-[13px] transition-all text-center px-2 ${uploadingEditLeaderImage ? 'text-[#8B95A1] cursor-not-allowed' : 'text-[#3182F6] cursor-pointer hover:bg-white'}`}>
                                                                {uploadingEditLeaderImage ? "이미지 처리 중..." : "사진 변경"}
                                                                <input type="file" accept="image/*" className="hidden" disabled={uploadingEditLeaderImage} onChange={handleEditLeaderImageChange} />
                                                            </label>
                                                            {editImageUrl && (
                                                                <button onClick={() => setEditImageUrl("")} className="w-9 h-9 rounded-full bg-[#FFF0F1] flex items-center justify-center text-[#F04452] shrink-0">
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <input
                                                                className="w-full h-12 bg-[#F9FAFB] border-0 ring-1 ring-[#3182F6]/30 px-4 rounded-xl outline-none focus:ring-2 focus:ring-[#3182F6] font-medium text-[15px] text-[#191F28]"
                                                                placeholder="직책"
                                                                value={editRole}
                                                                onChange={(e) => setEditRole(e.target.value)}
                                                            />
                                                            <input
                                                                className="w-full h-12 bg-[#F9FAFB] border-0 ring-1 ring-[#3182F6]/30 px-4 rounded-xl outline-none focus:ring-2 focus:ring-[#3182F6] font-medium text-[15px] text-[#191F28]"
                                                                placeholder="이름"
                                                                value={editName}
                                                                onChange={(e) => setEditName(e.target.value)}
                                                            />
                                                        </div>
                                                        <input
                                                            className="w-full h-12 bg-[#F9FAFB] border-0 ring-1 ring-[#3182F6]/30 px-4 rounded-xl outline-none focus:ring-2 focus:ring-[#3182F6] font-medium text-[15px] text-[#191F28]"
                                                            placeholder="전화번호"
                                                            value={editPhone}
                                                            onChange={(e) => setEditPhone(e.target.value)}
                                                        />
                                                        <button
                                                            onClick={saveEditLeader}
                                                            disabled={savingEditLeader || uploadingEditLeaderImage || !editRole.trim() || !editName.trim()}
                                                            className="w-full h-12 bg-[#191F28] text-white rounded-xl font-black text-[14px] active:scale-95 transition-all shadow-md disabled:opacity-50"
                                                        >
                                                            {savingEditLeader ? "저장하는 중..." : "수정 완료 (저장)"}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    /* --- [일반 모드 UI] --- */
                                                    <div>
                                                        {/* 상단 컨트롤 줄: 왼쪽 직책 뱃지 / 오른쪽 위·아래 이동 + 수정·삭제 */}
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-[11px] font-black text-[#3182F6] bg-blue-50 px-2 py-0.5 rounded-md shrink-0">{item.role}</span>
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => moveLeaderItem(idx, "up")}
                                                                    disabled={idx === 0}
                                                                    className="w-7 h-7 rounded-full bg-[#F9FAFB] ring-1 ring-[#E5E8EB] flex items-center justify-center text-[#4E5968] disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-all"
                                                                >
                                                                    <ChevronUp size={14} strokeWidth={3} />
                                                                </button>
                                                                <button
                                                                    onClick={() => moveLeaderItem(idx, "down")}
                                                                    disabled={idx === leaders.length - 1}
                                                                    className="w-7 h-7 rounded-full bg-[#F9FAFB] ring-1 ring-[#E5E8EB] flex items-center justify-center text-[#4E5968] disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-all"
                                                                >
                                                                    <ChevronDown size={14} strokeWidth={3} />
                                                                </button>
                                                                <div className="w-px h-4 bg-[#F2F4F6] mx-1" />
                                                                <button onClick={() => startEditLeader(item)} className="w-7 h-7 flex items-center justify-center text-[#8B95A1] hover:bg-[#F2F4F6] rounded-full transition-all">
                                                                    <Edit3 size={14} />
                                                                </button>
                                                                <button onClick={() => deleteLeader(item.id)} className="w-7 h-7 flex items-center justify-center text-[#F04452] hover:bg-[#FFF0F1] rounded-full transition-all">
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* 사진 + 이름/전화번호 */}
                                                        <div onClick={() => startEditLeader(item)} className="flex items-center gap-3 cursor-pointer">
                                                            <div className="w-11 h-11 rounded-full bg-[#F9FAFB] ring-1 ring-[#F2F4F6] overflow-hidden flex items-center justify-center shrink-0">
                                                                {item.imageUrl ? (
                                                                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <User size={18} className="text-[#D1D8E0]" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-[#191F28] text-[15px]">{item.name}</p>
                                                                <p className="text-[#8B95A1] text-[13px] font-medium">{item.phone || '전화번호 없음'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </section>
                    </div>
                ) : (
                    /* 주보 이력 탭 (Toss 리스트 디자인) */
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
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
            `}</style>
        </div>
    );
}
