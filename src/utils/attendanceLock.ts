// 출석부 2차 비밀번호
// 서버(보안 규칙)에서 강제되는 구조 — firestore.rules 의 attendance 부분과 짝을 이룸
//  attendance_secret/config     : { key }        비밀번호 해시. 누구도 읽을 수 없음 (규칙의 get() 으로만 비교)
//  attendance_settings/lock     : { configured } 비밀번호가 설정됐는지 여부 (관리자 읽기 가능)
//  attendance_unlock/{uid}      : { key, at }    잠금 해제 기록. key 가 비밀 해시와 같을 때만 쓰기 허용,
//                                                 at 으로부터 일정 시간 동안만 출석 데이터 접근 허용
import { doc, getDoc, setDoc, deleteDoc, writeBatch, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

const SECRET = doc(db, "attendance_secret", "config");
const SETTINGS = doc(db, "attendance_settings", "lock");
const unlockRef = (uid: string) => doc(db, "attendance_unlock", uid);

export const MIN_PASSWORD_LENGTH = 4;

export const hashAttendancePassword = async (password: string) => {
    const data = new TextEncoder().encode(`manna-attendance:${password}`);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const isPermissionDenied = (err: unknown) =>
    typeof err === "object" && err !== null && (err as { code?: string }).code === "permission-denied";

export const isLockConfigured = async () => {
    const snap = await getDoc(SETTINGS);
    return snap.exists() && snap.data().configured === true;
};

/** 비밀번호가 맞으면 true. 틀리면 보안 규칙이 쓰기를 거부하므로 false */
export const unlockAttendance = async (uid: string, password: string) => {
    try {
        await setDoc(unlockRef(uid), { key: await hashAttendancePassword(password), at: serverTimestamp() });
        return true;
    } catch (err) {
        if (isPermissionDenied(err)) return false;
        throw err;
    }
};

export const lockAttendance = async (uid: string) => {
    try {
        await deleteDoc(unlockRef(uid));
    } catch (err) {
        console.error("출석부 잠금 실패:", err);
    }
};

/** 최초 1회 비밀번호 설정 (이미 설정돼 있으면 규칙이 거부) */
export const setupAttendancePassword = async (uid: string, password: string) => {
    const batch = writeBatch(db);
    batch.set(SECRET, { key: await hashAttendancePassword(password) });
    batch.set(SETTINGS, { configured: true });
    await batch.commit();
    return unlockAttendance(uid, password);
};

/** 비밀번호 변경. 현재 비밀번호가 틀리면 false */
export const changeAttendancePassword = async (uid: string, current: string, next: string) => {
    try {
        await setDoc(SECRET, {
            key: await hashAttendancePassword(next),
            prevKey: await hashAttendancePassword(current),
        });
    } catch (err) {
        if (isPermissionDenied(err)) return false;
        throw err;
    }
    return unlockAttendance(uid, next);
};
