// 출석부 한글(.hwpx) 양식 읽기/채우기
// - .hwpx 는 zip + XML 구조라서 브라우저에서 표 칸의 글자만 바꿔 다시 압축할 수 있다.
// - 선/색/폰트/칸 너비 등 서식은 양식 파일 그대로 두고, 글자(이름·출석 표시·통계)만 교체한다.
import { unzipSync, zipSync, strFromU8, strToU8 } from "fflate";

export type ServiceType = "1부" | "2부" | "청년부";
export const SERVICE_TYPES: ServiceType[] = ["1부", "2부", "청년부"];

// 날짜(YYYY-MM-DD) -> 멤버 id -> 참석한 예배 목록
export type AttendanceRecords = Record<string, Record<string, string[]>>;

export interface HwpxMember {
    id: string;
    name: string;
    group: string; // 또래(84, 07 …) 또는 구분(해외, 청장년, 군복무, 새가족 …)
    note?: string; // 비고
}

export interface ParsedTemplate {
    members: { name: string; group: string; note: string }[];
    // 날짜 -> 멤버 인덱스(members 배열 기준) -> 참석한 예배 목록
    records: Record<string, Record<number, string[]>>;
}

interface XmlEnv {
    DOMParser: typeof DOMParser;
    XMLSerializer: typeof XMLSerializer;
}

const HP_NS = "http://www.hancom.co.kr/hwpml/2011/paragraph";
const SECTION_PATH = "Contents/section0.xml";
const BLOCK_COLS = 8; // 왼쪽 블록 0~7열, 오른쪽 블록 8~15열
const FIRST_BODY_ROW = 2; // 0행 제목, 1행 헤더
const WEEK_COUNT = 5;

// ───────────────────────── 표시 규칙 / 날짜 유틸 ─────────────────────────

/** 1부/2부/청년부 체크 → 표에 들어갈 표시. 청년부를 하나라도 참석하면 "o" 우선 */
export const markFor = (services?: string[]): string => {
    if (!services || services.length === 0) return "";
    if (services.includes("청년부")) return "o";
    if (services.includes("1부")) return "1부";
    if (services.includes("2부")) return "2부";
    return "";
};

const pad2 = (n: number) => String(n).padStart(2, "0");

export const parseYmd = (ymd: string) => {
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(y, m - 1, d);
};

export const toYmd = (date: Date) =>
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

/** 해당 월의 모든 주일(일요일) 날짜 목록 */
export const sundaysOfMonth = (year: number, monthIndex: number): string[] => {
    const result: string[] = [];
    const date = new Date(year, monthIndex, 1);
    while (date.getDay() !== 0) date.setDate(date.getDate() + 1);
    while (date.getMonth() === monthIndex) {
        result.push(toYmd(date));
        date.setDate(date.getDate() + 7);
    }
    return result;
};

/** 오늘 기준 가장 최근 주일 (오늘이 주일이면 오늘) */
export const latestSunday = (from = new Date()): string => {
    const date = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    date.setDate(date.getDate() - date.getDay());
    return toYmd(date);
};

/** "2026년 11월 1주 주일" 같은 설명. 주일이 아니면 null 대신 안내 문구 반환 */
export const describeSunday = (ymd: string): { isSunday: boolean; label: string; weekIndex: number } => {
    const date = parseYmd(ymd);
    const sundays = sundaysOfMonth(date.getFullYear(), date.getMonth());
    const weekIndex = sundays.indexOf(ymd);
    if (weekIndex < 0) {
        return { isSunday: false, label: `${date.getMonth() + 1}월 ${date.getDate()}일 (주일이 아니에요)`, weekIndex: -1 };
    }
    return {
        isSunday: true,
        label: `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${weekIndex + 1}주 주일`,
        weekIndex,
    };
};

/** 출석률 표시: 50 → "50%", 49.2537 → "49.25%" */
export const formatRate = (attended: number, total: number) =>
    total > 0 ? `${Number(((attended / total) * 100).toFixed(2))}%` : "0%";

/** 선택한 날짜의 통계 (현재 명단에 있는 사람만 집계) */
export const computeStats = (memberIds: string[], dayRecord: Record<string, string[]> | undefined) => {
    let first = 0, second = 0, youth = 0;
    for (const id of memberIds) {
        const mark = markFor(dayRecord?.[id]);
        if (mark === "1부") first++;
        else if (mark === "2부") second++;
        else if (mark === "o") youth++;
    }
    const attended = first + second + youth;
    const total = memberIds.length;
    return { first, second, youth, attended, total, rate: formatRate(attended, total) };
};

// ───────────────────────── XML 헬퍼 ─────────────────────────

const childElements = (parent: Element, localName: string): Element[] => {
    const result: Element[] = [];
    for (let node = parent.firstChild; node; node = node.nextSibling) {
        if (node.nodeType === 1 && (node as Element).localName === localName && (node as Element).namespaceURI === HP_NS) {
            result.push(node as Element);
        }
    }
    return result;
};

const firstChild = (parent: Element | null | undefined, localName: string): Element | null =>
    parent ? childElements(parent, localName)[0] ?? null : null;

/** 셀의 문단에 직접 들어있는 글자만 읽음 (머리말 같은 내부 컨트롤 글자는 제외) */
const getCellText = (tc: Element): string => {
    const sub = firstChild(tc, "subList");
    if (!sub) return "";
    let text = "";
    for (const p of childElements(sub, "p")) {
        for (const run of childElements(p, "run")) {
            for (const t of childElements(run, "t")) text += t.textContent ?? "";
        }
    }
    return text.trim();
};

/** 셀 글자 교체. 기존 글자 서식(run)은 그대로 쓰고, 머리말 등 내부 컨트롤은 보존 */
const setCellText = (tc: Element, text: string) => {
    const sub = firstChild(tc, "subList");
    const paragraphs = sub ? childElements(sub, "p") : [];
    if (paragraphs.length === 0) return;

    let target: Element | null = null;
    paragraphs.forEach((p, pi) => {
        for (const run of childElements(p, "run")) {
            const ts = childElements(run, "t");
            if (pi === 0 && !target && ts.length > 0) target = run;
            ts.forEach((t) => run.removeChild(t));
        }
    });
    if (!text) return;

    const firstP = paragraphs[0];
    if (!target) target = childElements(firstP, "run")[0] ?? null;
    const doc = tc.ownerDocument;
    if (!target) {
        target = doc.createElementNS(HP_NS, "hp:run");
        target.setAttribute("charPrIDRef", "0");
        const lineSeg = firstChild(firstP, "linesegarray");
        firstP.insertBefore(target, lineSeg);
    }
    const t = doc.createElementNS(HP_NS, "hp:t");
    t.appendChild(doc.createTextNode(text));
    (target as Element).appendChild(t);
};

interface CellInfo {
    tc: Element;
    col: number;
    row: number;
    colSpan: number;
    rowSpan: number;
}

const readCell = (tc: Element): CellInfo => {
    const addr = firstChild(tc, "cellAddr");
    const span = firstChild(tc, "cellSpan");
    return {
        tc,
        col: Number(addr?.getAttribute("colAddr") ?? -1),
        row: Number(addr?.getAttribute("rowAddr") ?? -1),
        colSpan: Number(span?.getAttribute("colSpan") ?? 1),
        rowSpan: Number(span?.getAttribute("rowSpan") ?? 1),
    };
};

class TableModel {
    tbl: Element;
    cells = new Map<string, CellInfo>();
    rowCount = 0;
    summaryRow = -1; // 오른쪽 아래 통계 칸이 시작되는 행

    constructor(tbl: Element) {
        this.tbl = tbl;
        this.reindex();
    }

    rows() {
        return childElements(this.tbl, "tr");
    }

    reindex() {
        this.cells.clear();
        const rows = this.rows();
        this.rowCount = rows.length;
        this.summaryRow = -1;
        rows.forEach((tr) => {
            for (const tc of childElements(tr, "tc")) {
                const info = readCell(tc);
                this.cells.set(`${info.col},${info.row}`, info);
                if (info.col === BLOCK_COLS + 4 && info.rowSpan > 1 && info.row > FIRST_BODY_ROW) {
                    this.summaryRow = info.row;
                }
            }
        });
    }

    cell(col: number, row: number) {
        return this.cells.get(`${col},${row}`)?.tc ?? null;
    }

    text(col: number, row: number) {
        const tc = this.cell(col, row);
        return tc ? getCellText(tc) : "";
    }

    set(col: number, row: number, value: string) {
        const tc = this.cell(col, row);
        if (tc) setCellText(tc, value);
    }

    /** afterRow 바로 아래에 afterRow 를 복제한 행을 count 개 추가하고 행 주소를 다시 매김 */
    insertRowsAfter(afterRow: number, count: number) {
        if (count <= 0) return;
        const rows = this.rows();
        const source = rows[afterRow];
        const anchor = source.nextSibling;
        let addedHeight = 0;
        const sz = firstChild(childElements(source, "tc")[0], "cellSz");
        const rowHeight = Number(sz?.getAttribute("height") ?? 0);
        for (let i = 0; i < count; i++) {
            this.tbl.insertBefore(source.cloneNode(true), anchor);
            addedHeight += rowHeight;
        }
        this.rows().forEach((tr, rowIndex) => {
            for (const tc of childElements(tr, "tc")) {
                firstChild(tc, "cellAddr")?.setAttribute("rowAddr", String(rowIndex));
            }
        });
        this.tbl.setAttribute("rowCnt", String(this.rows().length));
        const tblSz = firstChild(this.tbl, "sz");
        if (tblSz) tblSz.setAttribute("height", String(Number(tblSz.getAttribute("height") ?? 0) + addedHeight));
        this.reindex();
    }
}

// ───────────────────────── 양식 열기 / 저장 ─────────────────────────

const getEnv = (env?: XmlEnv): XmlEnv => env ?? { DOMParser, XMLSerializer };

const openTemplate = (bytes: Uint8Array, env?: XmlEnv) => {
    let files: Record<string, Uint8Array>;
    try {
        files = unzipSync(bytes);
    } catch {
        throw new Error("hwpx 파일을 열 수 없어요. 한글에서 '다른 이름으로 저장 → HWPX'로 저장한 파일인지 확인해 주세요.");
    }
    const sectionBytes = files[SECTION_PATH];
    if (!sectionBytes) throw new Error("hwpx 파일 안에서 본문(section0.xml)을 찾을 수 없어요.");

    const { DOMParser: Parser } = getEnv(env);
    const doc = new Parser().parseFromString(strFromU8(sectionBytes), "application/xml");
    const tbl = doc.getElementsByTagNameNS(HP_NS, "tbl")[0];
    if (!tbl) throw new Error("hwpx 파일 안에 출석부 표가 없어요.");

    const table = new TableModel(tbl);
    const colCnt = Number(tbl.getAttribute("colCnt"));
    if (colCnt !== BLOCK_COLS * 2 || table.text(1, 1) !== "이름" || table.text(BLOCK_COLS + 1, 1) !== "이름") {
        throw new Error("출석부 양식 구조가 달라요. (16칸, 두 번째 줄에 '이름' 헤더가 좌·우 각각 있어야 해요)");
    }
    if (table.summaryRow < 0) {
        throw new Error("출석부 양식 오른쪽 아래의 통계 칸을 찾을 수 없어요.");
    }
    return { files, doc, table };
};

const saveTemplate = (files: Record<string, Uint8Array>, doc: Document, env?: XmlEnv): Uint8Array => {
    const { XMLSerializer: Serializer } = getEnv(env);
    let xml = new Serializer().serializeToString(doc);
    if (!xml.startsWith("<?xml")) {
        xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>${xml}`;
    }
    const out: Record<string, Uint8Array | [Uint8Array, { level: 0 }]> = {};
    for (const [name, data] of Object.entries(files)) {
        if (name === "mimetype") out[name] = [data, { level: 0 }]; // 규격상 mimetype 은 압축 없이 맨 앞
        else out[name] = name === SECTION_PATH ? strToU8(xml) : data;
    }
    return zipSync(out as Parameters<typeof zipSync>[0], { level: 6 });
};

// ───────────────────────── 양식에서 명단/기존 출석 읽기 ─────────────────────────

const parseWeekHeaders = (table: TableModel, year: number): (string | null)[] => {
    const result: (string | null)[] = [];
    for (let i = 0; i < WEEK_COUNT; i++) {
        const match = table.text(2 + i, 1).match(/(\d{1,2})\s*\/\s*(\d{1,2})/);
        result.push(match ? toYmd(new Date(year, Number(match[1]) - 1, Number(match[2]))) : null);
    }
    return result;
};

const marksToServices = (mark: string): string[] | null => {
    const value = mark.trim().toLowerCase();
    if (value === "o" || value === "ㅇ" || value === "○") return ["청년부"];
    if (value === "1부") return ["1부"];
    if (value === "2부") return ["2부"];
    return null;
};

/** 업로드한 양식에서 명단(또래/이름/비고)과 이미 표시돼 있던 출석을 읽어온다 */
export const parseAttendanceTemplate = (bytes: Uint8Array, env?: XmlEnv): ParsedTemplate => {
    const { table } = openTemplate(bytes, env);
    const yearMatch = table.text(0, 0).match(/(\d{4})/);
    const year = yearMatch ? Number(yearMatch[1]) : new Date().getFullYear();
    const weekDates = parseWeekHeaders(table, year);

    const members: ParsedTemplate["members"] = [];
    const records: ParsedTemplate["records"] = {};
    let group = "";

    for (const base of [0, BLOCK_COLS]) {
        for (let row = FIRST_BODY_ROW; row < table.rowCount; row++) {
            if (!table.cell(base + 1, row)) continue;
            const groupText = table.text(base, row);
            if (groupText) group = groupText;
            const name = table.text(base + 1, row);
            if (!name) continue;

            const index = members.length;
            members.push({ name, group, note: table.text(base + 7, row) });
            weekDates.forEach((date, week) => {
                if (!date) return;
                const services = marksToServices(table.text(base + 2 + week, row));
                if (!services) return;
                (records[date] ??= {})[index] = services;
            });
        }
    }
    return { members, records };
};

// ───────────────────────── 출석부 채우기 ─────────────────────────

type LayoutItem = { member: HwpxMember; showGroup: boolean } | null; // null = 그룹 사이 빈 줄

const isAgeGroup = (group: string) => /^\d+$/.test(group.trim());

/** 명단 → 표에 놓일 순서. 해외/청장년 같은 구분 그룹 앞에는 빈 줄 하나 */
const buildSequence = (members: HwpxMember[]): LayoutItem[] => {
    const sequence: LayoutItem[] = [];
    let prevGroup: string | null = null;
    for (const member of members) {
        const isNewGroup = member.group !== prevGroup;
        if (isNewGroup && prevGroup !== null && !isAgeGroup(member.group)) sequence.push(null);
        sequence.push({ member, showGroup: isNewGroup });
        prevGroup = member.group;
    }
    return sequence;
};

/** 왼쪽 블록을 먼저 채우고 오른쪽 블록으로 이어감. 블록 맨 위의 빈 줄은 버리고 그룹명은 다시 표시 */
const splitIntoBlocks = (sequence: LayoutItem[], leftCapacity: number, rightCapacity: number) => {
    const left = sequence.slice(0, leftCapacity);
    let rest = sequence.slice(leftCapacity);
    while (rest.length > 0 && rest[0] === null) rest = rest.slice(1);
    if (rest[0]) rest[0] = { ...rest[0], showGroup: true };
    return { left, right: rest, fits: rest.length <= rightCapacity };
};

export interface GenerateOptions {
    members: HwpxMember[]; // 표에 놓일 순서대로
    records: AttendanceRecords;
    selectedDate: string; // 통계 칸·제목·파일명 기준 날짜 (YYYY-MM-DD)
}

export const attendanceFileName = (selectedDate: string) => {
    const date = parseYmd(selectedDate);
    return `${String(date.getFullYear()).slice(2)}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}_청년부.hwpx`;
};

/** 양식 + 명단 + 출석 기록 → 채워진 hwpx 파일 */
export const generateAttendanceHwpx = (template: Uint8Array, options: GenerateOptions, env?: XmlEnv): Uint8Array => {
    const { files, doc, table } = openTemplate(template, env);
    const { members, records, selectedDate } = options;
    const selected = parseYmd(selectedDate);
    const sundays = sundaysOfMonth(selected.getFullYear(), selected.getMonth());

    // 1) 자리 계산: 부족하면 통계 칸 바로 위에 행을 추가 (왼쪽·오른쪽 블록이 한 줄씩 늘어남)
    const sequence = buildSequence(members);
    let extraRows = 0;
    let blocks = splitIntoBlocks(sequence, table.rowCount - FIRST_BODY_ROW, table.summaryRow - FIRST_BODY_ROW);
    while (!blocks.fits) {
        extraRows++;
        blocks = splitIntoBlocks(
            sequence,
            table.rowCount + extraRows - FIRST_BODY_ROW,
            table.summaryRow + extraRows - FIRST_BODY_ROW,
        );
    }
    table.insertRowsAfter(table.summaryRow - 1, extraRows);

    // 2) 제목: 앞의 연도와 끝의 (MMDD)만 바꾸고 나머지 문구는 양식 그대로
    const title = table.text(0, 0);
    const mmdd = `${pad2(selected.getMonth() + 1)}${pad2(selected.getDate())}`;
    table.set(0, 0, title.replace(/^\d{4}/, String(selected.getFullYear())).replace(/\(\d{3,4}\)\s*$/, `(${mmdd})`));

    // 3) 헤더: N주(M/D)
    for (const base of [0, BLOCK_COLS]) {
        for (let week = 0; week < WEEK_COUNT; week++) {
            const ymd = sundays[week];
            const date = ymd ? parseYmd(ymd) : null;
            table.set(base + 2 + week, 1, date ? `${week + 1}주(${date.getMonth() + 1}/${date.getDate()})` : "");
        }
    }

    // 4) 본문: 모든 칸을 비운 뒤 명단과 출석 표시를 채움
    for (let row = FIRST_BODY_ROW; row < table.rowCount; row++) {
        for (let col = 0; col < BLOCK_COLS * 2; col++) {
            const isSummaryArea = col >= BLOCK_COLS + 4 && row >= table.summaryRow;
            if (!isSummaryArea) table.set(col, row, "");
        }
    }
    const fillBlock = (base: number, items: LayoutItem[]) => {
        items.forEach((item, i) => {
            if (!item) return;
            const row = FIRST_BODY_ROW + i;
            table.set(base, row, item.showGroup ? item.member.group : "");
            table.set(base + 1, row, item.member.name);
            for (let week = 0; week < WEEK_COUNT; week++) {
                const ymd = sundays[week];
                table.set(base + 2 + week, row, ymd ? markFor(records[ymd]?.[item.member.id]) : "");
            }
            table.set(base + 7, row, item.member.note ?? "");
        });
    };
    fillBlock(0, blocks.left);
    fillBlock(BLOCK_COLS, blocks.right);

    // 5) 통계 칸: 선택한 날짜 기준
    const stats = computeStats(members.map((m) => m.id), records[selectedDate]);
    const s = table.summaryRow;
    table.set(BLOCK_COLS + 4, s, `${selected.getMonth() + 1}/${selected.getDate()}`);
    const values = [stats.first, stats.second, stats.youth, stats.attended, stats.rate, stats.total];
    values.forEach((value, i) => table.set(BLOCK_COLS * 2 - 1, s + i, String(value)));

    return saveTemplate(files, doc, env);
};

// ───────────────────────── base64 (Firestore 저장용) ─────────────────────────

export const bytesToBase64 = (bytes: Uint8Array) => {
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
};

export const base64ToBytes = (base64: string) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
};
