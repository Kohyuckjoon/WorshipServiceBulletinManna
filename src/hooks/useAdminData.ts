import { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { doc, updateDoc, getDoc, setDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { buildExpiryDate } from "../utils/expiryDate";

// 데이터 타입 정의 (에러 방지의 핵심)
export interface ChurchNewsItem {
    title: string;
    content: string;
}

export interface ApplyQuestionItem {
    title: string;
    quote: string;
    content: string;
}

export interface AdBannerLinkItem {
    label: string;
    url: string;
}

export interface WorshipOrderItem {
    key: string; // 항목 종류 식별용 (신앙고백/설교자 등 연동에 사용, 화면에 노출 안 됨)
    label: string;
    value: string;
    modalSource?: "creed" | "confession"; // 클릭 시 팝업으로 상세 내용을 보여주는 항목
    dynamicSource?: "preacher" | "newsInCharge" | "benedictionBy"; // 다른 필드와 값이 자동 연동되는 항목
}

// ✅ 기존 Home.tsx 하드코딩 값과 동일한 기본 예배 순서 (Firestore에 값이 없을 때 사용)
export const defaultWorshipOrder: WorshipOrderItem[] = [
    { key: "invocation", label: "입례송", value: "다같이" },
    { key: "creed", label: "신앙고백", value: "사도신경 / 시편 95:1-7", modalSource: "creed" },
    { key: "confession", label: "예배자의 고백", value: "다같이", modalSource: "confession" },
    { key: "praise1", label: "찬양", value: "JOY 찬양팀" },
    { key: "sermon", label: "말씀 선포", value: "청년부 목사님", dynamicSource: "preacher" },
    { key: "offering", label: "봉헌", value: "JOY 찬양팀" },
    { key: "news", label: "교회 소식", value: "최지환", dynamicSource: "newsInCharge" },
    { key: "benediction", label: "축도", value: "청년부 목사님", dynamicSource: "benedictionBy" },
];

export const useAdminData = () => {
    const [user, setUser] = useState<any>(null);
    const [showLoginSuccess, setShowLoginSuccess] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);
    const [showLoginError, setShowLoginError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const [showCalendar, setShowCalendar] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());
    const calendarRef = useRef<HTMLDivElement>(null);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const [fixedDate, setFixedDate] = useState("");
    const [date, setDate] = useState("");

    const [scripture, setScripture] = useState("");
    const [title, setTitle] = useState("");
    const [newsInCharge, setNewsInCharge] = useState("");

    const [preacher, setPreacher] = useState("");
    const [benedictionBy, setBenedictionBy] = useState("");
    const [loading, setLoading] = useState(false);

    // youtube url
    const [youtubeId, setYoutubeId] = useState("");

    // 광고 배너
    const [adBannerEnabled, setAdBannerEnabled] = useState(false);
    const [adBannerTitle, setAdBannerTitle] = useState("");
    const [adBannerDescription, setAdBannerDescription] = useState("");
    const [adBannerLinks, setAdBannerLinks] = useState<AdBannerLinkItem[]>([]);
    const [newBannerLinkLabel, setNewBannerLinkLabel] = useState("");
    const [newBannerLinkUrl, setNewBannerLinkUrl] = useState("");

    // 광고 배너 노출 마감 시각 (지나면 Home 화면에서 즉시 숨김, 관리자 페이지는 다음 접속 때 토글 자동 off)
    const [adBannerExpiryEnabled, setAdBannerExpiryEnabled] = useState(false);
    const [adBannerExpiryDate, setAdBannerExpiryDate] = useState(""); // "YYYY-MM-DD"
    const [adBannerExpiryHour, setAdBannerExpiryHour] = useState("24");
    const [adBannerExpiryMinute, setAdBannerExpiryMinute] = useState("00");
    const [adBannerExpirySecond, setAdBannerExpirySecond] = useState("00");
    const [adBannerAutoDisabledNotice, setAdBannerAutoDisabledNotice] = useState(false);

    // ✅ 2. 상태 정의 시 타입을 명시 (useState<타입[]>)
    const [churchNews, setChurchNews] = useState<ChurchNewsItem[]>([]);
    const [newNewsTitle, setNewNewsTitle] = useState("");
    const [newNewsContent, setNewNewsContent] = useState("");

    const [showApplyQuestions, setShowApplyQuestions] = useState(true);
    const [applyQuestions, setApplyQuestions] = useState<ApplyQuestionItem[]>([]);
    const [newQTitle, setNewQTitle] = useState("");
    const [newQQuote, setNewQQuote] = useState("");
    const [newQContent, setNewQContent] = useState("");

    const [activeTab, setActiveTab] = useState<'edit' | 'leaders' | 'history'>('edit');
    const [worshipperConfession, setWorshipperConfession] = useState("");
    const [apostlesCreed, setApostlesCreed] = useState("");
    const [psalms, setPsalms] = useState("");

    // 예배 순서
    const [worshipOrder, setWorshipOrder] = useState<WorshipOrderItem[]>(defaultWorshipOrder);
    const [newWorshipLabel, setNewWorshipLabel] = useState("");
    const [newWorshipValue, setNewWorshipValue] = useState("");

    const moveWorshipOrderItem = (index: number, direction: "up" | "down") => {
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= worshipOrder.length) return;
        const newList = [...worshipOrder];
        [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
        setWorshipOrder(newList);
    };

    const updateWorshipOrderLabel = (index: number, label: string) => {
        const newList = [...worshipOrder];
        newList[index] = { ...newList[index], label };
        setWorshipOrder(newList);
    };

    const updateWorshipOrderValue = (index: number, value: string) => {
        const newList = [...worshipOrder];
        newList[index] = { ...newList[index], value };
        setWorshipOrder(newList);
    };

    const addWorshipOrderItem = () => {
        if (!newWorshipLabel.trim()) return;
        const newItem: WorshipOrderItem = {
            key: `custom-${Date.now()}`,
            label: newWorshipLabel.trim(),
            value: newWorshipValue.trim(),
        };
        setWorshipOrder([...worshipOrder, newItem]);
        setNewWorshipLabel("");
        setNewWorshipValue("");
    };

    const removeWorshipOrderItem = (index: number) => {
        setWorshipOrder(worshipOrder.filter((_, i) => i !== index));
    };

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);
    const [dragTarget, setDragTarget] = useState<"news" | "questions" | "apply" | null>(null);

    const [historyList, setHistoryList] = useState<any[]>([]);

    useEffect(() => {
        if (activeTab === 'history' && user) {
            const fetchHistory = async () => {
                try {
                    const q = query(collection(db, "bulletin_history"), orderBy("date", "desc"));
                    const querySnapshot = await getDocs(q);
                    const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setHistoryList(docs);
                } catch (error) {
                    console.error("이력 로드 실패:", error);
                }
            };
            fetchHistory();
        }
    }, [activeTab, user]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setShowCalendar(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) {
            setErrorMessage("이메일과 비밀번호를 모두 입력해주세요.");
            setShowLoginError(true);
            return;
        }
        setIsLoggingIn(true);
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            setUser(result.user);
            setShowLoginSuccess(true);
        } catch (error) {
            setErrorMessage("로그인 정보를 확인해주세요.");
            setShowLoginError(true);
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        setUser(null);
        setShowLogoutConfirm(false);
        window.location.reload();
    };

    // ✅ 데이터 불러오기 시 신규 필드 반영
    useEffect(() => {
        if (user) {
            const fetchData = async () => {
                try {
                    const docSnap = await getDoc(doc(db, "bulletin", "current"));
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setFixedDate(data.date || "");
                        setDate(data.date || "");
                        setScripture(data.scripture || "");
                        setTitle(data.title || "");
                        setNewsInCharge(data.newsInCharge || "");
                        // 데이터가 없을 경우 기본값 세팅 방지 및 빈 문자열 처리
                        setPreacher(data.preacher || "");
                        setBenedictionBy(data.benedictionBy || "");
                        setYoutubeId(data.youtubeId || "");
                        setChurchNews(data.churchNews || []);
                        setApplyQuestions(data.applyQuestions || []);
                        setShowApplyQuestions(data.showApplyQuestions !== undefined ? data.showApplyQuestions : true);
                        setApostlesCreed(data.apostlesCreed || "");
                        setPsalms(data.psalms || "");
                        setWorshipperConfession(data.worshipperConfession || "");
                        setWorshipOrder(data.worshipOrder && data.worshipOrder.length > 0 ? data.worshipOrder : defaultWorshipOrder);
                        setAdBannerTitle(data.adBannerTitle || "");
                        setAdBannerDescription(data.adBannerDescription || "");
                        // adBannerLinks가 없고 예전 단일 링크(adBannerLinkUrl)만 있는 경우 자동 이관
                        if (data.adBannerLinks && data.adBannerLinks.length > 0) {
                            setAdBannerLinks(data.adBannerLinks);
                        } else if (data.adBannerLinkUrl) {
                            setAdBannerLinks([{ label: "", url: data.adBannerLinkUrl }]);
                        } else {
                            setAdBannerLinks([]);
                        }

                        // 광고 배너 노출 마감 설정 불러오기
                        let bannerEnabled = data.adBannerEnabled || false;
                        const bannerExpiryEnabled = !!data.adBannerExpiryEnabled;
                        const bannerExpiryAt = data.adBannerExpiryAt ? new Date(data.adBannerExpiryAt) : null;
                        setAdBannerExpiryEnabled(bannerExpiryEnabled);
                        if (bannerExpiryAt) {
                            const y = bannerExpiryAt.getFullYear();
                            const mo = String(bannerExpiryAt.getMonth() + 1).padStart(2, "0");
                            const d = String(bannerExpiryAt.getDate()).padStart(2, "0");
                            setAdBannerExpiryDate(`${y}-${mo}-${d}`);
                            setAdBannerExpiryHour(String(bannerExpiryAt.getHours()).padStart(2, "0"));
                            setAdBannerExpiryMinute(String(bannerExpiryAt.getMinutes()).padStart(2, "0"));
                            setAdBannerExpirySecond(String(bannerExpiryAt.getSeconds()).padStart(2, "0"));
                        }
                        // 마감 시각이 이미 지났다면 관리자 페이지 접속 시점에 자동으로 사용안함으로 전환 + 즉시 저장
                        if (bannerEnabled && bannerExpiryEnabled && bannerExpiryAt && bannerExpiryAt.getTime() <= Date.now()) {
                            bannerEnabled = false;
                            setAdBannerAutoDisabledNotice(true);
                            await setDoc(doc(db, "bulletin", "current"), { adBannerEnabled: false }, { merge: true });
                        }
                        setAdBannerEnabled(bannerEnabled);
                    }
                } catch (error) { console.error(error); }
            };
            fetchData();
        }
    }, [user]);

    // ✅ 주보 발행(업데이트) 함수
    const handleUpdate = async () => {
        if (!date) {
            setErrorMessage("예배 날짜(발행일)를 먼저 선택해 주세요.");
            setShowLoginError(true);
            return;
        }
        try {
            setLoading(true);

            // 데이터베이스에 저장할 객체 구성 (누락된 필드 확인)
            const bulletinData = {
                date,
                scripture,
                title,
                newsInCharge,
                preacher,           // 설교자 저장
                benedictionBy,      // 축도자 저장
                youtubeId,
                churchNews,
                applyQuestions,
                showApplyQuestions,
                worshipperConfession,
                apostlesCreed,
                psalms,
                worshipOrder,
                adBannerEnabled,
                adBannerTitle,
                adBannerDescription,
                adBannerLinks,
                adBannerExpiryEnabled,
                adBannerExpiryAt: adBannerExpiryEnabled
                    ? buildExpiryDate(adBannerExpiryDate, adBannerExpiryHour, adBannerExpiryMinute, adBannerExpirySecond)?.toISOString() || null
                    : null,
                updatedAt: new Date()
            };

            // 1. 현재 주보 정보 업데이트 (merge: true로 기존 필드 보존하며 신규 필드 추가)
            await setDoc(doc(db, "bulletin", "current"), bulletinData, { merge: true });

            // 2. 이력 저장 (날짜별 문서 생성)
            await setDoc(doc(db, "bulletin_history", date), bulletinData);

            setFixedDate(date);
            setAdBannerAutoDisabledNotice(false);
            setShowUpdateSuccess(true);
        } catch (error) {
            console.error("저장 중 에러 발생:", error);
            setErrorMessage("저장에 실패했습니다.");
            setShowLoginError(true);
        } finally { setLoading(false); }
    };

    const handleDragStart = (index: number, type: "news" | "questions" | "apply") => {
        dragItem.current = index;
        setDragTarget(type);
    };

    const handleDragEnter = (index: number) => { dragOverItem.current = index; };
    const handleDragEnd = () => {
        if (dragItem.current !== null && dragOverItem.current !== null && dragTarget) {
            if (dragTarget === "news") {
                const newList = [...churchNews];
                const dragged = newList.splice(dragItem.current, 1)[0];
                newList.splice(dragOverItem.current, 0, dragged);
                setChurchNews(newList);
            } else {
                const newList = [...applyQuestions];
                const dragged = newList.splice(dragItem.current, 1)[0];
                newList.splice(dragOverItem.current, 0, dragged);
                setApplyQuestions(newList);
            }
        }
        dragItem.current = null;
        dragOverItem.current = null;
        setDragTarget(null);
    };

    // ✅ 달력의 날짜 배열을 생성하는 함수
    const renderCalendarDays = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const totalDays = daysInMonth(year, month);
        const firstDay = firstDayOfMonth(year, month);
        const days = [];

        // 1일 시작 전 빈 칸 채우기
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }
        // 실제 날짜들 채우기
        for (let d = 1; d <= totalDays; d++) {
            days.push(new Date(year, month, d));
        }
        return days;
    };

    return {
        user, setUser, showLoginSuccess, setShowLoginSuccess, showLogoutConfirm, setShowLogoutConfirm,
        showUpdateSuccess, setShowUpdateSuccess, showLoginError, setShowLoginError, errorMessage,
        showCalendar, setShowCalendar, viewDate, setViewDate, calendarRef,
        email, setEmail, password, setPassword, isLoggingIn,
        fixedDate, date, setDate, scripture, setScripture, title, setTitle,
        newsInCharge, setNewsInCharge, loading,
        churchNews, setChurchNews, newNewsTitle, setNewNewsTitle, newNewsContent, setNewNewsContent,
        showApplyQuestions, setShowApplyQuestions, applyQuestions, setApplyQuestions,
        newQTitle, setNewQTitle, newQQuote, setNewQQuote, newQContent, setNewQContent,
        activeTab, setActiveTab, historyList, worshipperConfession, setWorshipperConfession,
        apostlesCreed, setApostlesCreed, psalms, setPsalms,
        worshipOrder, setWorshipOrder, moveWorshipOrderItem, updateWorshipOrderLabel, updateWorshipOrderValue,
        addWorshipOrderItem, removeWorshipOrderItem,
        newWorshipLabel, setNewWorshipLabel, newWorshipValue, setNewWorshipValue,
        daysInMonth, firstDayOfMonth, renderCalendarDays,
        handleLogin, handleLogout, handleUpdate,
        handleDragStart, handleDragEnter, handleDragEnd, dragOverItem,
        preacher, setPreacher,
        benedictionBy, setBenedictionBy,
        youtubeId, setYoutubeId,
        adBannerEnabled, setAdBannerEnabled,
        adBannerTitle, setAdBannerTitle,
        adBannerDescription, setAdBannerDescription,
        adBannerLinks, setAdBannerLinks,
        newBannerLinkLabel, setNewBannerLinkLabel,
        newBannerLinkUrl, setNewBannerLinkUrl,
        adBannerExpiryEnabled, setAdBannerExpiryEnabled,
        adBannerExpiryDate, setAdBannerExpiryDate,
        adBannerExpiryHour, setAdBannerExpiryHour,
        adBannerExpiryMinute, setAdBannerExpiryMinute,
        adBannerExpirySecond, setAdBannerExpirySecond,
        adBannerAutoDisabledNotice, setAdBannerAutoDisabledNotice,
    };
};
