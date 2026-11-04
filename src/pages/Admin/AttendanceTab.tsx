import React, { useEffect, useMemo, useState } from "react";
import {
    collection, doc, getDoc, onSnapshot, orderBy, query, setDoc, writeBatch, deleteDoc,
} from "firebase/firestore";
import {
    ChevronUp, ChevronDown, Plus, Trash2, Edit3, Check, Search,
    Upload, Download, FileText, Info, Users, ClipboardCheck, Lock, KeyRound,
} from "lucide-react";
import { db } from "../../firebase";
import SundayPicker from "./SundayPicker";
import {
    SERVICE_TYPES, type ServiceType, type AttendanceRecords, type HwpxMember,
    latestSunday, describeSunday, parseYmd, sundaysOfMonth, computeStats,
    parseAttendanceTemplate, generateAttendanceHwpx, attendanceFileName, bytesToBase64, base64ToBytes,
} from "../../utils/attendanceHwpx";
import {
    MIN_PASSWORD_LENGTH, isLockConfigured, unlockAttendance, lockAttendance,
    setupAttendancePassword, changeAttendancePassword, isPermissionDenied,
} from "../../utils/attendanceLock";
import { useAdminDialog } from "./AdminDialog";

// Firestore 구조 (관리자 + 2차 비밀번호 해제 상태에서만 접근 — firestore.rules 참고)
//  attendance_members/{autoId}   : { name, group, note, order }
//  attendance_records/{YYYY-MM-DD}: { date, entries: { [memberId]: ["1부" | "2부" | "청년부"] }, updatedAt }
//  attendance_template/current   : { data(base64), fileName, size, uploadedAt }
const MEMBERS = "attendance_members";
const RECORDS = "attendance_records";
const TEMPLATE_DOC = doc(db, "attendance_template", "current");
const MAX_TEMPLATE_BASE64 = 900_000; // Firestore 문서 1MB 제한 여유분

interface Member extends HwpxMember {
    order: number;
}

interface TemplateInfo {
    data: string;
    fileName: string;
    size: number;
    uploadedAt?: string;
}

type SubTab = "check" | "roster" | "file";
type Dialog = ReturnType<typeof useAdminDialog>;
type AdminUser = { uid: string } | null;

const SERVICE_STYLE: Record<ServiceType, string> = {
    "1부": "bg-[#3182F6] text-white ring-[#3182F6]",
    "2부": "bg-[#00B8A9] text-white ring-[#00B8A9]",
    "청년부": "bg-[#7B61FF] text-white ring-[#7B61FF]",
};

/** "84"·"07" 같은 또래를 출생연도로 바꿔 정렬에 사용 */
const groupYear = (group: string) => {
    const n = Number(group);
    if (!/^\d+$/.test(group.trim())) return null;
    return n >= 50 ? 1900 + n : 2000 + n;
};

/** 새 멤버가 들어갈 위치: 같은 그룹의 맨 끝. 새 또래는 나이 순서 자리, 새 구분은 맨 끝 */
const insertIndexFor = (list: Member[], group: string) => {
    let lastSame = -1;
    list.forEach((m, i) => { if (m.group === group) lastSame = i; });
    if (lastSame >= 0) return lastSame + 1;
    const year = groupYear(group);
    if (year === null) return list.length;
    let index = 0;
    list.forEach((m, i) => {
        const y = groupYear(m.group);
        if (y !== null && y < year) index = i + 1;
    });
    return index;
};

const sectionClass = "p-3 sm:p-4 rounded-[18px] border-0 bg-white shadow-xl shadow-blue-500/5";
const inputClass = "w-full h-12 bg-white border-0 ring-1 ring-[#E5E8EB] px-4 rounded-[14px] outline-none focus:ring-2 focus:ring-[#3182F6] font-medium text-[15px] text-[#191F28] transition-all placeholder:text-[#D1D8E0]";
const primaryButton = "w-full h-12 bg-[#3182F6] text-white rounded-[14px] font-black text-[16px] flex items-center justify-center gap-2 active:scale-[0.98] hover:bg-[#1B64DA] transition-all shadow-lg shadow-blue-100 disabled:opacity-50";

const SectionTitle = ({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) => (
    <header className="flex items-center justify-between mb-3 gap-2">
        <h2 className="text-[16px] font-bold flex items-center gap-3 text-[#191F28] tracking-tight">
            <div className="w-1.5 h-[18px] bg-[#3182F6] rounded-full shadow-[0_0_12px_rgba(49,130,246,0.3)]"></div>
            {children}
        </h2>
        {right}
    </header>
);

// ───────────────────────── 2차 비밀번호 잠금 ─────────────────────────

type LockState = "checking" | "setup" | "locked" | "unlocked";

export default function AttendanceTab({ user }: { user: AdminUser }) {
    const dialog = useAdminDialog();
    const [lockState, setLockState] = useState<LockState>("checking");
    const uid = user?.uid ?? "";

    useEffect(() => {
        if (!uid) return;
        isLockConfigured()
            .then((configured) => setLockState(configured ? "locked" : "setup"))
            .catch((err) => {
                console.error("출석부 잠금 상태 확인 실패:", err);
                setLockState("locked");
            });
    }, [uid]);

    // 탭을 벗어나면 서버 쪽 잠금 해제 기록도 지움 → 다시 들어올 때 비밀번호 필요
    useEffect(() => {
        if (lockState !== "unlocked" || !uid) return;
        return () => { lockAttendance(uid); };
    }, [lockState, uid]);

    const handleExpired = async () => {
        setLockState("locked");
        await dialog.showAlert({
            title: "출석부가 잠겼어요",
            message: "보안을 위해 잠금 시간이 지났어요.\n2차 비밀번호를 다시 입력해 주세요.",
            tone: "danger",
        });
    };

    return (
        <>
            {dialog.dialog}
            {lockState === "unlocked" ? (
                <AttendanceContent
                    uid={uid}
                    dialog={dialog}
                    onLock={async () => { await lockAttendance(uid); setLockState("locked"); }}
                    onExpired={handleExpired}
                />
            ) : (
                <LockScreen
                    uid={uid}
                    mode={lockState}
                    dialog={dialog}
                    onUnlocked={() => setLockState("unlocked")}
                />
            )}
        </>
    );
}

function LockScreen({ uid, mode, dialog, onUnlocked }: {
    uid: string;
    mode: LockState;
    dialog: Dialog;
    onUnlocked: () => void;
}) {
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const isSetup = mode === "setup";

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (password.length < MIN_PASSWORD_LENGTH) {
            setError(`비밀번호는 ${MIN_PASSWORD_LENGTH}자리 이상이어야 해요.`);
            return;
        }
        if (isSetup && password !== confirm) {
            setError("비밀번호 확인이 일치하지 않아요.");
            return;
        }
        setSubmitting(true);
        try {
            const ok = isSetup ? await setupAttendancePassword(uid, password) : await unlockAttendance(uid, password);
            if (ok) {
                if (isSetup) {
                    await dialog.showAlert({
                        title: "2차 비밀번호를 설정했어요",
                        message: "앞으로 출석부 탭에 들어올 때마다\n이 비밀번호를 입력해야 해요.",
                        tone: "success",
                    });
                }
                onUnlocked();
            } else {
                setError("비밀번호가 맞지 않아요.");
                setPassword("");
            }
        } catch (err) {
            console.error("2차 비밀번호 처리 실패:", err);
            setError(isPermissionDenied(err)
                ? "이미 2차 비밀번호가 설정되어 있어요. 페이지를 새로고침해 주세요."
                : "처리 중 문제가 생겼어요. 인터넷 연결을 확인해 주세요.");
        } finally {
            setSubmitting(false);
        }
    };

    if (mode === "checking") {
        return <div className="py-24 text-center text-[14px] font-bold text-[#8B95A1]">확인 중...</div>;
    }

    return (
        <div className="pt-2 pb-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <form onSubmit={submit} className="bg-white rounded-[24px] p-6 shadow-xl shadow-blue-500/5 max-w-[380px] mx-auto text-center">
                <div className="flex justify-center mb-5">
                    <div className="w-16 h-16 bg-[#E8F3FF] rounded-full flex items-center justify-center">
                        <Lock size={30} className="text-[#3182F6]" strokeWidth={2.5} />
                    </div>
                </div>
                <h2 className="text-[21px] font-black text-[#191F28] tracking-tighter mb-1">
                    {isSetup ? "2차 비밀번호 설정" : "출석부 잠금"}
                </h2>
                <p className="text-[14px] font-bold text-[#8B95A1] mb-6 leading-relaxed">
                    {isSetup
                        ? "출석부에는 청년부 명단이 있어요.\n출석부 전용 비밀번호를 정해 주세요."
                        : "2차 비밀번호를 입력해 주세요."}
                </p>
                <div className="space-y-2 text-left">
                    <input
                        type="password"
                        autoFocus
                        autoComplete={isSetup ? "new-password" : "current-password"}
                        className={inputClass}
                        placeholder={isSetup ? `새 비밀번호 (${MIN_PASSWORD_LENGTH}자리 이상)` : "2차 비밀번호"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {isSetup && (
                        <input
                            type="password"
                            autoComplete="new-password"
                            className={inputClass}
                            placeholder="비밀번호 확인"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                        />
                    )}
                    {error && <p className="text-[13px] font-bold text-[#F04452] px-1">{error}</p>}
                </div>
                <button type="submit" disabled={submitting || !password} className={`${primaryButton} mt-5`}>
                    {submitting ? "확인 중..." : isSetup ? "설정하고 들어가기" : "잠금 해제"}
                </button>
            </form>
        </div>
    );
}

// ───────────────────────── 출석부 본문 ─────────────────────────

function AttendanceContent({ uid, dialog, onLock, onExpired }: {
    uid: string;
    dialog: Dialog;
    onLock: () => void;
    onExpired: () => void;
}) {
    const { showAlert, showConfirm } = dialog;
    const [subTab, setSubTab] = useState<SubTab>("check");
    const [members, setMembers] = useState<Member[]>([]);
    const [membersLoaded, setMembersLoaded] = useState(false);
    const [selectedDate, setSelectedDate] = useState(latestSunday());
    const [dayEntries, setDayEntries] = useState<Record<string, string[]>>({});
    const [search, setSearch] = useState("");

    const [template, setTemplate] = useState<TemplateInfo | null>(null);
    const [templateLoaded, setTemplateLoaded] = useState(false);
    const [busy, setBusy] = useState<string | null>(null);

    // 명단 추가/수정
    const [newName, setNewName] = useState("");
    const [newGroup, setNewGroup] = useState("");
    const [newNote, setNewNote] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editGroup, setEditGroup] = useState("");
    const [editNote, setEditNote] = useState("");

    // 비밀번호 변경
    const [currentPw, setCurrentPw] = useState("");
    const [nextPw, setNextPw] = useState("");
    const [nextPwConfirm, setNextPwConfirm] = useState("");

    const sundayInfo = describeSunday(selectedDate);
    const groups = useMemo(() => [...new Set(members.map((m) => m.group))], [members]);
    const stats = computeStats(members.map((m) => m.id), dayEntries);

    /** 잠금 시간이 지나 규칙에 막힌 경우 잠금 화면으로, 그 외에는 안내 팝업 */
    const handleError = (err: unknown, title: string, message?: string) => {
        console.error(title, err);
        if (isPermissionDenied(err)) {
            onExpired();
            return;
        }
        showAlert({ title, message: message ?? (err instanceof Error ? err.message : undefined), tone: "danger" });
    };

    // ── 실시간 구독 ──
    useEffect(() => {
        return onSnapshot(query(collection(db, MEMBERS), orderBy("order")), (snap) => {
            setMembers(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Member, "id">) })));
            setMembersLoaded(true);
        }, (err) => {
            setMembersLoaded(true);
            handleError(err, "명단을 불러오지 못했어요");
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        return onSnapshot(doc(db, RECORDS, selectedDate), (snap) => {
            setDayEntries((snap.data()?.entries as Record<string, string[]>) ?? {});
        }, (err) => handleError(err, "출석 기록을 불러오지 못했어요"));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate]);

    useEffect(() => {
        getDoc(TEMPLATE_DOC)
            .then((snap) => setTemplate(snap.exists() ? (snap.data() as TemplateInfo) : null))
            .catch((err) => handleError(err, "양식을 불러오지 못했어요"))
            .finally(() => setTemplateLoaded(true));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── 출석 체크 (누르는 즉시 저장) ──
    const toggleService = async (memberId: string, service: ServiceType) => {
        const current = dayEntries[memberId] ?? [];
        const next = current.includes(service) ? current.filter((s) => s !== service) : [...current, service];
        setDayEntries((prev) => ({ ...prev, [memberId]: next }));
        try {
            await setDoc(doc(db, RECORDS, selectedDate), {
                date: selectedDate,
                entries: { [memberId]: next },
                updatedAt: new Date(),
            }, { merge: true });
        } catch (err) {
            handleError(err, "출석을 저장하지 못했어요", "인터넷 연결을 확인해 주세요.");
        }
    };

    // ── 명단 관리 ──
    const saveOrder = async (list: Member[]) => {
        const batch = writeBatch(db);
        list.forEach((m, i) => {
            if (m.order !== i) batch.update(doc(db, MEMBERS, m.id), { order: i });
        });
        await batch.commit();
    };

    const addMember = async () => {
        const name = newName.trim();
        const group = newGroup.trim();
        if (!name || !group) return;
        if (members.some((m) => m.name === name)) {
            const ok = await showConfirm({
                title: `'${name}' 이름이 이미 있어요`,
                message: `그래도 추가할까요?\n동명이인은 '${name}B'처럼 구분하면 좋아요.`,
                confirmText: "추가하기",
            });
            if (!ok) return;
        }
        setBusy("add");
        try {
            const ref = doc(collection(db, MEMBERS));
            const index = insertIndexFor(members, group);
            const list = [...members];
            list.splice(index, 0, { id: ref.id, name, group, note: newNote.trim(), order: -1 });
            await setDoc(ref, { name, group, note: newNote.trim(), order: index });
            await saveOrder(list);
            setNewName("");
            setNewNote("");
        } catch (err) {
            handleError(err, "추가하지 못했어요");
        } finally {
            setBusy(null);
        }
    };

    const startEdit = (m: Member) => {
        setEditingId(m.id);
        setEditName(m.name);
        setEditGroup(m.group);
        setEditNote(m.note ?? "");
    };

    const saveEdit = async () => {
        if (!editingId || !editName.trim() || !editGroup.trim()) return;
        const target = members.find((m) => m.id === editingId);
        if (!target) return;
        setBusy("edit");
        try {
            const updated = { name: editName.trim(), group: editGroup.trim(), note: editNote.trim() };
            await setDoc(doc(db, MEMBERS, editingId), updated, { merge: true });
            if (updated.group !== target.group) {
                const rest = members.filter((m) => m.id !== editingId);
                rest.splice(insertIndexFor(rest, updated.group), 0, { ...target, ...updated });
                await saveOrder(rest);
            }
            setEditingId(null);
        } catch (err) {
            handleError(err, "수정하지 못했어요");
        } finally {
            setBusy(null);
        }
    };

    const removeMember = async (m: Member) => {
        const ok = await showConfirm({
            title: `'${m.name}'님을 삭제할까요?`,
            message: "다음에 받는 출석부 파일부터 빠져요.",
            tone: "danger",
            confirmText: "삭제",
        });
        if (!ok) return;
        try {
            await deleteDoc(doc(db, MEMBERS, m.id));
        } catch (err) {
            handleError(err, "삭제하지 못했어요");
        }
    };

    const moveMember = async (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= members.length) return;
        const list = [...members];
        [list[index], list[target]] = [list[target], list[index]];
        try {
            await saveOrder(list);
        } catch (err) {
            handleError(err, "순서를 바꾸지 못했어요");
        }
    };

    // ── 양식 업로드 / 다운로드 ──
    const importFromTemplate = async (parsed: ReturnType<typeof parseAttendanceTemplate>) => {
        const batch = writeBatch(db);
        const ids = parsed.members.map((m, order) => {
            const ref = doc(collection(db, MEMBERS));
            batch.set(ref, { name: m.name, group: m.group, note: m.note, order });
            return ref.id;
        });
        for (const [date, byIndex] of Object.entries(parsed.records)) {
            const entries: Record<string, string[]> = {};
            for (const [index, services] of Object.entries(byIndex)) entries[ids[Number(index)]] = services;
            batch.set(doc(db, RECORDS, date), { date, entries, updatedAt: new Date() }, { merge: true });
        }
        await batch.commit();
    };

    const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (!file.name.toLowerCase().endsWith(".hwpx")) {
            showAlert({
                title: "hwpx 파일만 올릴 수 있어요",
                message: "한글에서 '다른 이름으로 저장 → HWPX'로\n저장한 파일을 올려 주세요.",
                tone: "danger",
            });
            return;
        }
        setBusy("upload");
        try {
            const bytes = new Uint8Array(await file.arrayBuffer());
            const parsed = parseAttendanceTemplate(bytes); // 구조가 다르면 여기서 안내 메시지와 함께 실패
            const data = bytesToBase64(bytes);
            if (data.length > MAX_TEMPLATE_BASE64) {
                showAlert({ title: "양식 파일이 너무 커요", message: "표 외의 그림 등을 지우고 다시 올려 주세요.", tone: "danger" });
                return;
            }
            const info: TemplateInfo = { data, fileName: file.name, size: file.size, uploadedAt: new Date().toISOString() };
            await setDoc(TEMPLATE_DOC, info);
            setTemplate(info);

            if (members.length === 0 && parsed.members.length > 0) {
                const dates = Object.keys(parsed.records).map((d) => d.slice(5).replace("-", "/"));
                const ok = await showConfirm({
                    title: `양식에서 명단 ${parsed.members.length}명을 찾았어요`,
                    message: dates.length
                        ? `명단과 기존 출석 표시(${dates.join(", ")})를\n그대로 가져올까요?`
                        : "명단을 그대로 가져올까요?",
                    confirmText: "가져오기",
                    cancelText: "나중에",
                });
                if (ok) {
                    await importFromTemplate(parsed);
                    await showAlert({ title: `명단 ${parsed.members.length}명을 가져왔어요`, tone: "success" });
                }
            } else {
                showAlert({ title: "양식을 저장했어요", message: "다음 다운로드부터 새 양식이 쓰여요.", tone: "success" });
            }
        } catch (err) {
            handleError(err, "양식을 올리지 못했어요");
        } finally {
            setBusy(null);
        }
    };

    const handleDownload = async () => {
        if (!template) return;
        setBusy("download");
        try {
            const date = parseYmd(selectedDate);
            const sundays = sundaysOfMonth(date.getFullYear(), date.getMonth());
            const records: AttendanceRecords = {};
            const snaps = await Promise.all(sundays.map((d) => getDoc(doc(db, RECORDS, d))));
            snaps.forEach((snap, i) => { records[sundays[i]] = (snap.data()?.entries as Record<string, string[]>) ?? {}; });

            const bytes = generateAttendanceHwpx(base64ToBytes(template.data), {
                members: members.map(({ id, name, group, note }) => ({ id, name, group, note })),
                records,
                selectedDate,
            });
            const url = URL.createObjectURL(new Blob([bytes], { type: "application/hwp+zip" }));
            const a = document.createElement("a");
            a.href = url;
            a.download = attendanceFileName(selectedDate);
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (err) {
            handleError(err, "출석부 파일을 만들지 못했어요");
        } finally {
            setBusy(null);
        }
    };

    // ── 2차 비밀번호 변경 ──
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (nextPw.length < MIN_PASSWORD_LENGTH) {
            showAlert({ title: `새 비밀번호는 ${MIN_PASSWORD_LENGTH}자리 이상이어야 해요`, tone: "danger" });
            return;
        }
        if (nextPw !== nextPwConfirm) {
            showAlert({ title: "새 비밀번호 확인이 일치하지 않아요", tone: "danger" });
            return;
        }
        setBusy("password");
        try {
            const ok = await changeAttendancePassword(uid, currentPw, nextPw);
            if (ok) {
                setCurrentPw("");
                setNextPw("");
                setNextPwConfirm("");
                showAlert({ title: "2차 비밀번호를 바꿨어요", tone: "success" });
            } else {
                showAlert({ title: "현재 비밀번호가 맞지 않아요", tone: "danger" });
            }
        } catch (err) {
            handleError(err, "비밀번호를 바꾸지 못했어요");
        } finally {
            setBusy(null);
        }
    };

    // ── 화면 ──
    const keyword = search.trim();
    const visibleMembers = keyword ? members.filter((m) => m.name.includes(keyword) || m.group.includes(keyword)) : members;

    const datePicker = <SundayPicker value={selectedDate} onChange={setSelectedDate} />;

    return (
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-10">
            {/* 하위 탭 + 잠그기 */}
            <div className="flex items-center gap-1.5">
                <div className="flex-1 flex bg-white p-1 rounded-[14px] shadow-sm gap-0.5">
                    {([
                        ["check", "출석 체크", ClipboardCheck],
                        ["roster", "명단 관리", Users],
                        ["file", "파일·설정", FileText],
                    ] as const).map(([key, label, Icon]) => (
                        <button
                            key={key}
                            onClick={() => setSubTab(key)}
                            className={`flex-1 h-9 rounded-[10px] text-[13px] font-bold flex items-center justify-center gap-1 transition-all ${subTab === key ? "bg-[#191F28] text-white" : "text-[#8B95A1] hover:bg-[#F2F4F6]"}`}
                        >
                            <Icon size={14} /> {label}
                        </button>
                    ))}
                </div>
                <button
                    onClick={onLock}
                    className="w-11 h-11 shrink-0 bg-white rounded-[14px] shadow-sm flex items-center justify-center text-[#8B95A1] hover:text-[#F04452] transition-colors"
                    aria-label="출석부 잠그기"
                    title="출석부 잠그기"
                >
                    <Lock size={18} />
                </button>
            </div>

            {membersLoaded && members.length === 0 && subTab !== "file" && (
                <div className="p-3 rounded-[14px] bg-[#E8F3FF] text-[#1B64DA] text-[13px] font-bold flex gap-2">
                    <Info size={16} className="shrink-0 mt-0.5" />
                    <span>아직 명단이 없어요. <b>파일·설정</b> 탭에서 출석부 양식(.hwpx)을 올리면 명단을 한 번에 가져올 수 있어요.</span>
                </div>
            )}

            {subTab === "check" && (
                <>
                    {/* 날짜 + 통계 */}
                    <section className={sectionClass}>
                        {datePicker}
                        <div className="grid grid-cols-4 gap-1.5 mt-2 text-center">
                            {[
                                ["1부", String(stats.first)],
                                ["2부", String(stats.second)],
                                ["청년부", String(stats.youth)],
                                [`출석 ${stats.attended}/${stats.total}`, stats.rate],
                            ].map(([label, value]) => (
                                <div key={label} className="bg-[#F9FAFB] rounded-[12px] py-1.5">
                                    <p className="text-[11px] font-bold text-[#8B95A1] leading-tight">{label}</p>
                                    <p className="text-[17px] font-black text-[#191F28] leading-tight">{value}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 출석 체크 목록 */}
                    <section className={sectionClass}>
                        <div className="relative">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#ADB5BD]" />
                            <input className={`${inputClass} h-11 pl-9`} placeholder="이름 또는 또래 검색" value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                        <p className="text-[11px] font-bold text-[#8B95A1] mt-1.5 px-1">누르면 바로 저장돼요 · 1부와 청년부를 둘 다 누르면 출석부에 <b>o</b>로 표시돼요</p>
                        <div className="divide-y divide-[#F2F4F6]">
                            {visibleMembers.map((m, i) => {
                                const services = dayEntries[m.id] ?? [];
                                const showGroupHeader = i === 0 || visibleMembers[i - 1].group !== m.group;
                                return (
                                    <React.Fragment key={m.id}>
                                        {showGroupHeader && (
                                            <div className="pt-3 pb-0.5 text-[12px] font-black text-[#3182F6]">{m.group}</div>
                                        )}
                                        <div className="flex items-center gap-1.5 py-1.5">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[15px] font-bold text-[#191F28] truncate">{m.name}</p>
                                                {m.note && <p className="text-[11px] font-medium text-[#8B95A1] truncate leading-tight">{m.note}</p>}
                                            </div>
                                            {SERVICE_TYPES.map((service) => {
                                                const on = services.includes(service);
                                                return (
                                                    <button
                                                        key={service}
                                                        onClick={() => toggleService(m.id, service)}
                                                        className={`h-9 rounded-[10px] text-[13px] font-bold ring-1 transition-all active:scale-95 ${service === "청년부" ? "w-[54px]" : "w-11"} ${on ? SERVICE_STYLE[service] : "bg-white text-[#8B95A1] ring-[#E5E8EB]"}`}
                                                    >
                                                        {service}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                            {keyword && visibleMembers.length === 0 && (
                                <p className="py-8 text-center text-[14px] font-bold text-[#ADB5BD]">검색 결과가 없어요</p>
                            )}
                        </div>
                    </section>
                </>
            )}

            {subTab === "roster" && (
                <section className={sectionClass}>
                    <SectionTitle right={<span className="text-[12px] font-black text-[#8B95A1] bg-[#F9FAFB] px-3 py-1.5 rounded-full">총 {members.length}명</span>}>명단 관리</SectionTitle>

                    <div className="bg-[#F9FAFB] p-3 rounded-[16px] border border-[#F2F4F6] mb-2 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <input className={inputClass} list="attendance-groups" placeholder="또래/구분 (예: 07, 새가족)" value={newGroup} onChange={(e) => setNewGroup(e.target.value)} />
                            <input className={inputClass} placeholder="이름" value={newName} onChange={(e) => setNewName(e.target.value)} />
                        </div>
                        <input className={inputClass} placeholder="비고 (선택)" value={newNote} onChange={(e) => setNewNote(e.target.value)} />
                        <datalist id="attendance-groups">
                            {groups.map((g) => <option key={g} value={g} />)}
                        </datalist>
                        <button onClick={addMember} disabled={busy === "add" || !newName.trim() || !newGroup.trim()} className={primaryButton}>
                            <Plus size={20} strokeWidth={3} /> {busy === "add" ? "추가하는 중..." : "추가하기"}
                        </button>
                        <p className="text-[11px] font-bold text-[#8B95A1] px-1">같은 또래/구분의 맨 아래에 추가되고, 출석부 파일에도 그 순서대로 들어가요. 자리가 모자라면 표에 줄이 자동으로 늘어나요.</p>
                    </div>

                    <div className="divide-y divide-[#F2F4F6]">
                        {members.map((m, i) => {
                            const showGroupHeader = i === 0 || members[i - 1].group !== m.group;
                            const isEditing = editingId === m.id;
                            return (
                                <React.Fragment key={m.id}>
                                    {showGroupHeader && <div className="pt-3 pb-0.5 text-[12px] font-black text-[#3182F6]">{m.group}</div>}
                                    {isEditing ? (
                                        <div className="py-3 space-y-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                <input className={inputClass} list="attendance-groups" value={editGroup} onChange={(e) => setEditGroup(e.target.value)} placeholder="또래/구분" />
                                                <input className={inputClass} value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="이름" />
                                            </div>
                                            <input className={inputClass} value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder="비고" />
                                            <div className="flex gap-2">
                                                <button onClick={() => setEditingId(null)} className="flex-1 h-10 rounded-[12px] bg-[#F2F4F6] text-[#4E5968] font-bold text-[14px]">취소</button>
                                                <button onClick={saveEdit} disabled={busy === "edit"} className="flex-1 h-10 rounded-[12px] bg-[#3182F6] text-white font-bold text-[14px] flex items-center justify-center gap-1 disabled:opacity-50">
                                                    <Check size={16} /> 저장
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-0.5 py-1.5">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[15px] font-bold text-[#191F28] truncate">{m.name}</p>
                                                {m.note && <p className="text-[11px] font-medium text-[#8B95A1] truncate">{m.note}</p>}
                                            </div>
                                            <button onClick={() => moveMember(i, -1)} disabled={i === 0} className="w-8 h-8 flex items-center justify-center text-[#8B95A1] hover:bg-[#F2F4F6] rounded-full disabled:opacity-30" aria-label="위로"><ChevronUp size={16} /></button>
                                            <button onClick={() => moveMember(i, 1)} disabled={i === members.length - 1} className="w-8 h-8 flex items-center justify-center text-[#8B95A1] hover:bg-[#F2F4F6] rounded-full disabled:opacity-30" aria-label="아래로"><ChevronDown size={16} /></button>
                                            <button onClick={() => startEdit(m)} className="w-8 h-8 flex items-center justify-center text-[#8B95A1] hover:bg-[#F2F4F6] rounded-full" aria-label="수정"><Edit3 size={15} /></button>
                                            <button onClick={() => removeMember(m)} className="w-8 h-8 flex items-center justify-center text-[#F04452] hover:bg-[#FFF0F1] rounded-full" aria-label="삭제"><Trash2 size={15} /></button>
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </section>
            )}

            {subTab === "file" && (
                <>
                    <section className={sectionClass}>
                        <SectionTitle>출석부 파일 받기</SectionTitle>
                        {datePicker}
                        <p className="text-[12px] font-bold text-[#8B95A1] my-2 px-1 leading-relaxed">
                            선택한 날짜가 속한 달의 모든 주일 출석이 표에 채워지고, 오른쪽 아래 통계 칸은 <b>{sundayInfo.label}</b> 기준으로 계산돼요.
                        </p>
                        <button onClick={handleDownload} disabled={!template || members.length === 0 || busy === "download"} className={primaryButton}>
                            <Download size={18} strokeWidth={3} />
                            {busy === "download" ? "만드는 중..." : `${attendanceFileName(selectedDate)} 다운로드`}
                        </button>
                        {!template && templateLoaded && (
                            <p className="mt-2 text-[12px] font-bold text-[#F04452] px-1">먼저 아래에서 출석부 양식(.hwpx)을 올려 주세요.</p>
                        )}

                        <div className="mt-2 p-3 rounded-[14px] bg-[#F9FAFB] text-[13px] font-medium text-[#4E5968] leading-relaxed">
                            <p className="font-black text-[#191F28] mb-1">PDF가 필요할 때</p>
                            <ol className="list-decimal pl-5 space-y-0.5">
                                <li>위 버튼으로 hwpx 파일을 받아요.</li>
                                <li>네이버 MYBOX 또는 한글에서 파일을 열어요.</li>
                                <li><b>파일 → PDF로 저장</b>을 누르면 원본 그대로 PDF가 만들어져요.</li>
                            </ol>
                        </div>
                    </section>

                    <section className={sectionClass}>
                        <SectionTitle>출석부 양식</SectionTitle>
                        {template ? (
                            <div className="flex items-center gap-3 p-3 rounded-[14px] bg-[#F9FAFB] mb-3">
                                <FileText size={20} className="text-[#3182F6] shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[14px] font-bold text-[#191F28] truncate">{template.fileName}</p>
                                    <p className="text-[11px] font-medium text-[#8B95A1]">
                                        {Math.round(template.size / 1024)}KB{template.uploadedAt ? ` · ${new Date(template.uploadedAt).toLocaleDateString()} 업로드` : ""}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-[13px] font-bold text-[#8B95A1] mb-3">{templateLoaded ? "아직 올린 양식이 없어요." : "불러오는 중..."}</p>
                        )}
                        <label className={`w-full h-12 rounded-[14px] ring-1 ring-[#E5E8EB] bg-white flex items-center justify-center gap-2 font-black text-[14px] transition-all ${busy === "upload" ? "text-[#8B95A1] cursor-not-allowed" : "text-[#3182F6] cursor-pointer hover:ring-2 hover:ring-[#3182F6]"}`}>
                            <Upload size={16} />
                            {busy === "upload" ? "올리는 중..." : template ? "양식 바꾸기 (.hwpx)" : "양식 올리기 (.hwpx)"}
                            <input type="file" accept=".hwpx" className="hidden" disabled={busy === "upload"} onChange={handleTemplateUpload} />
                        </label>
                        <p className="mt-2 text-[11px] font-bold text-[#8B95A1] px-1 leading-relaxed">
                            양식은 관리자만 볼 수 있게 저장돼요. 표의 선·색·글꼴은 양식 그대로 쓰고, 이름·출석 표시·날짜·통계만 바뀌어요.
                        </p>
                    </section>

                    <section className={sectionClass}>
                        <SectionTitle>2차 비밀번호 변경</SectionTitle>
                        <form onSubmit={handleChangePassword} className="space-y-2">
                            <input type="password" autoComplete="current-password" className={inputClass} placeholder="현재 비밀번호" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
                            <input type="password" autoComplete="new-password" className={inputClass} placeholder={`새 비밀번호 (${MIN_PASSWORD_LENGTH}자리 이상)`} value={nextPw} onChange={(e) => setNextPw(e.target.value)} />
                            <input type="password" autoComplete="new-password" className={inputClass} placeholder="새 비밀번호 확인" value={nextPwConfirm} onChange={(e) => setNextPwConfirm(e.target.value)} />
                            <button type="submit" disabled={busy === "password" || !currentPw || !nextPw} className={primaryButton}>
                                <KeyRound size={18} /> {busy === "password" ? "바꾸는 중..." : "비밀번호 바꾸기"}
                            </button>
                        </form>
                    </section>
                </>
            )}
        </div>
    );
}
